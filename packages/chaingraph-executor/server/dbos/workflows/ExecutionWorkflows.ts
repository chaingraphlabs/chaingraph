/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { WorkflowHandle } from '@dbos-inc/dbos-sdk'
import type { ExecutionTask } from '../../../types'
import type { ExecutionResult } from '../types'
import { ExecutionEventEnum } from '@badaitech/chaingraph-types'
import { ConfiguredInstance, DBOS } from '@dbos-inc/dbos-sdk'
import SuperJSON from 'superjson'
import { ExecutionStatus } from '../../../types'
import { getExecutionStore } from '../../stores/execution-store'
import { loadFlow } from '../../stores/flow-store'
import { executionQueue } from '../queue'
import {
  executeFlowAtomic,
  updateToCompleted,
  updateToFailed,
  updateToRunning,
} from '../steps'

/**
 * Execution command types for DBOS messaging
 */
type ExecutionCommandType = 'PAUSE' | 'RESUME' | 'STEP' | 'STOP'

interface ExecutionCommand {
  command: ExecutionCommandType
  reason?: string
}

/**
 * Shared command controller for passing command state from workflow to step
 * This avoids calling DBOS.recv() from inside a step (which is not allowed)
 */
export interface CommandController {
  currentCommand: ExecutionCommandType | null
  commandTimestamp: number
  reason?: string
}

/**
 * Signal object for coordinating command loop termination
 */
interface ExecutionSignal {
  done: boolean
  error?: Error
}

/**
 * Class-based DBOS workflow for executing chaingraph flows
 *
 * This class provides the main entry point for executing chaingraph flows using DBOS.
 * Uses the @DBOS.workflow() decorator for durable execution guarantees.
 *
 * Signal Pattern:
 * - Workflow starts immediately but waits for START_SIGNAL before executing
 * - This allows clients to subscribe to the event stream before execution begins
 *
 * Command Loop Pattern (Debug Mode Only):
 * - Command polling (PAUSE/RESUME/STEP/STOP) is ONLY enabled when task.debug=true
 * - In production mode (debug=false): Zero overhead - no polling, no recv() calls
 * - In debug mode: Command loop runs in background, awaited after execution completes
 * - No overlapping recv() calls - single sequential loop
 *
 * DBOS Durability Guarantees:
 * - Each step is checkpointed in PostgreSQL
 * - If the worker crashes, DBOS automatically resumes from the last completed step
 * - The workflow is guaranteed to run to completion (at-least-once semantics)
 * - Idempotency is ensured through workflow ID (executionId)
 */
export class ExecutionWorkflows extends ConfiguredInstance {
  constructor(name: string = 'ExecutionWorkflows') {
    super(name)
  }

  initialize(): Promise<void> {
    DBOS.logger.info(`ExecutionWorkflows initialized with DBOS configuration: ${this.name}`)
    return Promise.resolve()
  }

  /**
   * Command polling loop that runs in parallel with execution
   *
   * This loop:
   * - Polls for commands using DBOS.recv() at workflow level (allowed)
   * - Updates shared controllers (abortController, commandController)
   * - Terminates when signal.done is set or STOP command received
   * - Uses short timeout (2s) to allow responsive termination
   *
   * @param executionId - ID for logging
   * @param signal - Shared signal for termination
   * @param abortController - Controller to trigger STOP
   * @param commandController - Controller for PAUSE/RESUME/STEP
   */
  private static async commandPollingLoop(
    executionId: string,
    signal: ExecutionSignal,
    abortController: AbortController,
    commandController: CommandController,
  ): Promise<void> {
    DBOS.logger.debug(`Command polling loop started for: ${executionId}`)

    while (!signal.done) {
      try {
        // Wait for command with short timeout (5s)
        // Short timeout allows checking signal.done frequently for responsive termination
        // Single recv() call at a time - no overlapping calls
        const command = await DBOS.recv<ExecutionCommand>('COMMAND', 5)

        if (command) {
          DBOS.logger.info(`Received command: ${command.command} for ${executionId}`)

          if (command.command === 'STOP') {
            // STOP: Trigger abort controller and exit loop
            abortController.abort(command.reason || 'User requested stop')
            DBOS.logger.info(`Abort triggered for execution: ${executionId}`)
            break // Exit loop immediately on STOP
          } else {
            // PAUSE/RESUME/STEP: Update shared command controller
            commandController.currentCommand = command.command
            commandController.commandTimestamp = Date.now()
            commandController.reason = command.reason
            DBOS.logger.debug(`Command queued: ${command.command} for ${executionId}`)
          }
        }
        // No command received (timeout) - continue loop and check signal.done
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error)

        // Check for cancellation - workflow was cancelled externally
        if (errorMessage.includes('has been cancelled')) {
          DBOS.logger.info(`Command polling stopped due to cancellation for: ${executionId}`)
          break
        }

        // Log error but continue polling - transient errors shouldn't stop command handling
        DBOS.logger.warn(`Error in command polling (continuing): ${errorMessage} for ${executionId}`)
      }
    }

    DBOS.logger.debug(`Command polling loop ended for: ${executionId}`)
  }

  /**
   * Execute a chaingraph flow with durable workflow orchestration
   *
   * @param task Execution task containing executionId and flowId
   * @returns Execution result with status and duration
   */
  @DBOS.workflow()
  static async executeChainGraph(task: ExecutionTask): Promise<ExecutionResult> {
    DBOS.logger.info(`Starting execution workflow: ${task.executionId}`)

    // ============================================================
    // Create shared controllers at WORKFLOW level
    // ============================================================
    // These are passed to the step to avoid calling DBOS methods from within steps

    // Abort controller for STOP command
    const abortController = new AbortController()

    // Run periodic checker for parent workflow:
    const parentCheckerSignal = { done: false }
    const stopCheckerPromise = (async () => {
      if (!task.parentExecutionId) {
        return // No parent to check
      }

      DBOS.logger.debug(`Starting parent workflow monitor for: ${task.executionId}`)

      while (!parentCheckerSignal.done) {
        try {
          // DO NOT need durable timeout, use just node timeout:
          await new Promise(resolve => setTimeout(resolve, 1000))

          if (parentCheckerSignal.done)
            break // Check signal after sleep

          const parentWorkflow = await DBOS.getWorkflowStatus(task.parentExecutionId)
          if (parentWorkflow?.status === 'COMPLETED' || parentWorkflow?.status === 'ERROR' || parentWorkflow?.status === 'CANCELLED') {
            DBOS.logger.info(`Parent workflow ${task.parentExecutionId} has ended (${parentWorkflow.status}). Stopping execution ${task.executionId}.`)
            abortController.abort(`Parent workflow has ended: ${parentWorkflow.status}`)
            break
          }
        } catch (error) {
          if (parentCheckerSignal.done)
            break // Exit if cancelled
          const errorMessage = error instanceof Error ? error.message : String(error)
          DBOS.logger.warn(`Error checking parent workflow status (continuing): ${errorMessage}`)
        }
      }

      DBOS.logger.debug(`Parent workflow monitor stopped for: ${task.executionId}`)
    })()

    // Command controller for PAUSE/RESUME/STEP commands
    const commandController: CommandController = {
      currentCommand: null,
      commandTimestamp: 0,
    }

    // Signal for coordinating command loop termination
    const executionSignal: ExecutionSignal = { done: false }

    try {
      // ============================================================
      // PHASE 1: Stream Initialization (runs immediately)
      // ============================================================

      // Load execution row to get metadata for EXECUTION_CREATED event
      const executionStore = await getExecutionStore()
      const executionRow = await executionStore.get(task.executionId)

      if (!executionRow) {
        throw new Error(`Execution ${task.executionId} not found in database`)
      }

      // Load flow metadata
      const flow = await loadFlow(task.flowId)
      if (!flow) {
        throw new Error(`Flow ${task.flowId} not found`)
      }

      // 🎯 Write EXECUTION_CREATED event to initialize the stream
      // This creates the stream IMMEDIATELY, allowing clients to subscribe
      // Written from WORKFLOW (not step) = exactly-once semantics
      // Index -1 = special workflow-level event (before engine events start at 0)
      DBOS.logger.info(`Initializing event stream for execution: ${task.executionId}`)

      // TODO: make a step for this, in order to have better durability guarantees and deduplication?
      await DBOS.writeStream('events', {
        executionId: task.executionId,
        event: {
          index: -1, // Special index for workflow-level initialization event
          type: ExecutionEventEnum.EXECUTION_CREATED,
          timestamp: new Date().toISOString(),
          data: SuperJSON.serialize({
            executionId: executionRow.id,
            flowId: executionRow.flowId,
            flowMetadata: flow.metadata,
            ownerId: executionRow.ownerId,
            rootExecutionId: executionRow.rootExecutionId,
            parentExecutionId: executionRow.parentExecutionId,
            executionDepth: executionRow.executionDepth,
          }),
        },
        timestamp: Date.now(),
      })

      // Check if this is a child execution (spawned from Event Emitter)
      const isChildExecution = !!executionRow.parentExecutionId

      if (isChildExecution) {
        // 🚀 AUTO-START for child executions
        // Children are spawned from parent workflows and should start immediately
        // Send START_SIGNAL to self to begin execution
        DBOS.logger.info(`Auto-starting child execution: ${task.executionId} (parent: ${executionRow.parentExecutionId})`)
        await DBOS.send(task.executionId, 'AUTO-START', 'START_SIGNAL')
      }

      DBOS.logger.info(`Event stream initialized, waiting for START_SIGNAL: ${task.executionId}`)

      // ⏸️ WAIT for START_SIGNAL
      // - Parent executions: Wait for signal from tRPC start endpoint (timeout: 5 minutes)
      // - Child executions: Receive auto-start signal immediately (no timeout)
      const startSignal = await DBOS.recv<string>('START_SIGNAL', isChildExecution ? 10 : 300)

      if (!startSignal) {
        const timeoutError = isChildExecution
          ? 'Child execution auto-start failed - START_SIGNAL not received within 10 seconds'
          : 'Execution start timeout - START_SIGNAL not received within 5 minutes'
        DBOS.logger.error(`${timeoutError}: ${task.executionId}`)
        throw new Error(timeoutError)
      }

      DBOS.logger.info(`START_SIGNAL received, beginning execution: ${task.executionId}${isChildExecution ? ' (child auto-started)' : ''}`)

      // ============================================================
      // PHASE 2: Execution (runs after START_SIGNAL received)
      // ============================================================

      // Step 1: Update status to "running"
      // This is the first durable checkpoint - marks that execution has started
      await DBOS.runStep(() => updateToRunning(task.executionId), {
        name: 'updateToRunning',
      })

      // ============================================================
      // Step 2: Execute flow (with optional debug command polling)
      // ============================================================
      //
      // Command polling is ONLY enabled in debug mode (task.debug=true)
      // - Production mode: Zero overhead - direct execution, no recv() calls
      // - Debug mode: Background command loop for PAUSE/RESUME/STEP/STOP
      //
      // Controllers are passed from workflow to step:
      //   - abortController: For STOP command (via abort signal)
      //   - commandController: For PAUSE/RESUME/STEP (via shared state)
      //
      // If the step fails, DBOS will retry the ENTIRE step on another worker.
      // The flow execution is atomic - either fully succeeds or fully fails.

      // Start command polling in background ONLY if debug mode is enabled
      // let commandLoopPromise: Promise<void> | null = null
      // if (task.debug) {
      //   DBOS.logger.info(`Debug mode enabled - starting command polling for: ${task.executionId}`)
      //   commandLoopPromise = ExecutionWorkflows.commandPollingLoop(
      //     task.executionId,
      //     executionSignal,
      //     abortController,
      //     commandController,
      //   )
      // } else {
      //   DBOS.logger.debug(`Production mode - command polling disabled for: ${task.executionId}`)
      // }

      // Run execution (not wrapped in Promise.all - cleaner flow)
      const result = await DBOS.runStep(
        () => executeFlowAtomic(task, abortController, commandController),
        { name: 'executeFlowAtomic' },
      )

      // Signal command loop to stop and wait for cleanup (if debug mode)
      executionSignal.done = true
      // if (commandLoopPromise) {
      // await commandLoopPromise
      // DBOS.logger.debug(`Command polling cleanup complete for: ${task.executionId}`)
      // }

      // Step 2.5: Spawn child executions (if any)
      // This happens at WORKFLOW level where DBOS.startWorkflow is allowed
      // Child tasks were collected during execution and returned in result.childTasks
      if (result.childTasks && result.childTasks.length > 0) {
        const childCount = result.childTasks.length
        const spawnStartTime = Date.now()

        DBOS.logger.info(`Spawning ${childCount} child execution(s) for: ${task.executionId}`)

        // ============================================================
        // PHASE A: Spawn all children and collect handles
        // ============================================================
        // Using Promise.allSettled to prevent cascade failures
        // This is much faster than sequential spawning (40x improvement for 100 children)
        const spawnResults = await Promise.allSettled(
          result.childTasks.map(childTask =>
            DBOS.startWorkflow(ExecutionWorkflows, {
              queueName: executionQueue.name,
              workflowID: childTask.executionId,
              enqueueOptions: {
                deduplicationID: childTask.executionId,
              },
            }).executeChainGraph(childTask),
          ),
        )

        // Extract successful handles and log spawn failures
        const handles: Array<{ handle: WorkflowHandle<ExecutionResult>, executionId: string }> = []
        const spawnFailures: string[] = []

        for (let i = 0; i < spawnResults.length; i++) {
          const spawnResult = spawnResults[i]
          const childTask = result.childTasks[i]

          if (spawnResult.status === 'fulfilled') {
            handles.push({ handle: spawnResult.value, executionId: childTask.executionId })
          } else {
            const errorMsg = spawnResult.reason instanceof Error
              ? spawnResult.reason.message
              : String(spawnResult.reason)
            spawnFailures.push(`${childTask.executionId}: ${errorMsg}`)
            DBOS.logger.error(`Failed to spawn child ${childTask.executionId}: ${errorMsg}`)
          }
        }

        const spawnDuration = Date.now() - spawnStartTime
        DBOS.logger.info(
          `Child spawn complete: ${handles.length}/${childCount} spawned, `
          + `${spawnFailures.length} failed in ${spawnDuration}ms `
          + `(${(childCount / (spawnDuration / 1000)).toFixed(1)} spawns/sec) for: ${task.executionId}`,
        )

        // ============================================================
        // PHASE B: Await all child results
        // ============================================================
        if (handles.length > 0) {
          const awaitStartTime = Date.now()

          const childResults = await Promise.allSettled(
            handles.map(h => h.handle.getResult()),
          )

          // Aggregate results
          let completed = 0
          let failed = 0
          const errors: string[] = []

          for (let i = 0; i < childResults.length; i++) {
            const childResult = childResults[i]
            const executionId = handles[i].executionId

            if (childResult.status === 'fulfilled') {
              const execResult = childResult.value
              if (execResult.status === 'completed') {
                completed++
              } else {
                failed++
                if (execResult.error) {
                  errors.push(`${executionId}: ${execResult.error}`)
                }
              }
            } else {
              failed++
              const errorMsg = childResult.reason instanceof Error
                ? childResult.reason.message
                : String(childResult.reason)
              errors.push(`${executionId}: ${errorMsg}`)
            }
          }

          const awaitDuration = Date.now() - awaitStartTime
          const totalDuration = Date.now() - spawnStartTime

          DBOS.logger.info(
            `Child executions complete: ${completed} completed, ${failed} failed `
            + `in ${awaitDuration}ms (${(handles.length / (awaitDuration / 1000)).toFixed(1)} exec/sec) `
            + `| Total: ${totalDuration}ms for: ${task.executionId}`,
          )

          if (errors.length > 0) {
            DBOS.logger.warn(
              `Child execution errors for ${task.executionId}: `
              + `${errors.slice(0, 5).join('; ')}${errors.length > 5 ? ` (+${errors.length - 5} more)` : ''}`,
            )
          }
        }
      }

      // Step 3: Update status to "completed"
      // This is the final durable checkpoint - marks successful completion
      await DBOS.runStep(() => updateToCompleted(task.executionId), {
        name: 'updateToCompleted',
      })

      DBOS.logger.info(`Execution workflow completed: ${task.executionId}`)
      return result
    } catch (error) {
      // Error handling: Update status to "failed"
      const errorMessage = error instanceof Error ? error.message : String(error)

      DBOS.logger.error(`Execution workflow failed: ${task.executionId} - ${errorMessage}`)

      // Check if error was due to abort (STOP command)
      if (abortController.signal.aborted) {
        DBOS.logger.info(`Execution stopped via abort controller: ${task.executionId}`)

        // Update status to stopped instead of failed
        await DBOS.runStep(() => updateToFailed(task.executionId, 'Execution stopped'), {
          name: 'updateToStopped',
        })

        // Update to stopped status
        const store = await getExecutionStore()
        await store.updateExecutionStatus({
          executionId: task.executionId,
          status: ExecutionStatus.Stopped,
          errorMessage: abortController.signal.reason as string || 'Execution stopped',
          completedAt: new Date(),
        })
      } else {
        // Regular failure
        await DBOS.runStep(() => updateToFailed(task.executionId, errorMessage), {
          name: 'updateToFailed',
        })
      }

      // Re-throw to mark workflow as failed in DBOS
      throw error
    } finally {
      // Ensure command polling loop terminates (defensive - should already be done)
      executionSignal.done = true
      DBOS.logger.debug(`Execution workflow cleanup complete for: ${task.executionId}`)

      // Also stop the parent checker
      parentCheckerSignal.done = true
    }
  }
}
