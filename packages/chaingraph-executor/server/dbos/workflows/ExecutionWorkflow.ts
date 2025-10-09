/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { ExecutionTask } from '../../../types'
import type { ExecutionResult } from '../types'
import { ExecutionEventEnum } from '@badaitech/chaingraph-types'
import { DBOS } from '@dbos-inc/dbos-sdk'
import SuperJSON from 'superjson'
import { ExecutionStatus } from '../../../types'
import { getExecutionStore } from '../../stores/execution-store'
import { loadFlow } from '../../stores/flow-store'
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
 * Main DBOS workflow for executing chaingraph flows
 *
 * This workflow orchestrates the execution of a chaingraph flow using the signal pattern:
 *
 * Phase 1: Stream Initialization (immediate)
 * - Write EXECUTION_CREATED event to initialize DBOS stream
 * - Wait for START_SIGNAL from tRPC (timeout: 5 minutes)
 *
 * Phase 2: Execution (after signal received)
 * - Mark execution as "running" (checkpoint)
 * - Execute flow atomically: load + execute + stream events (checkpoint)
 * - Mark execution as "completed" (checkpoint)
 *
 * Signal Pattern Benefits:
 * - Stream exists immediately after workflow starts
 * - Clients can subscribe before execution begins
 * - No race condition between subscribe and stream creation
 * - Timeout protection (workflow fails if not started within 5 min)
 *
 * DBOS Durability Guarantees:
 * - Each step is checkpointed in PostgreSQL
 * - If the worker crashes, DBOS automatically resumes from the last completed step
 * - If Step 1 completes but Step 2 crashes, DBOS will retry Step 2 on another worker
 * - The workflow is guaranteed to run to completion (at-least-once semantics)
 * - Idempotency is ensured through workflow ID (executionId)
 *
 * Recovery Example:
 * ```
 * Time 0: EXECUTION_CREATED event written ✓ (stream initialized)
 * Time 1: Waiting for START_SIGNAL...
 * Time 2: START_SIGNAL received ✓
 * Time 3: Step 1 completes (status = running) ✓
 * Time 4: Step 2 starts (executing flow)
 * Time 5: Worker crashes 💥
 * Time 6: DBOS detects incomplete workflow
 * Time 7: DBOS retries Step 2 on another worker ↻
 * Time 8: Step 2 completes ✓
 * Time 9: Step 3 completes (status = completed) ✓
 * ```
 */

/**
 * Execute a chaingraph flow with durable workflow orchestration
 *
 * This is the main entry point for executing a chaingraph flow using DBOS.
 * The workflow provides exactly-once execution semantics through idempotency keys.
 *
 * Signal Pattern: The workflow starts immediately but waits for START_SIGNAL before executing.
 * This allows clients to subscribe to the event stream before execution begins.
 *
 * @param task Execution task containing executionId and flowId
 * @returns Execution result with status and duration
 */
async function executeChainGraph(task: ExecutionTask): Promise<ExecutionResult> {
  DBOS.logger.info(`Starting execution workflow: ${task.executionId}`)

  // ============================================================
  // Create shared controllers at WORKFLOW level
  // ============================================================
  // These are passed to the step to avoid calling DBOS methods from within steps

  // Abort controller for STOP command
  const abortController = new AbortController()

  // Command controller for PAUSE/RESUME/STEP commands
  const commandController: CommandController = {
    currentCommand: null,
    commandTimestamp: 0,
  }

  // 🎮 Start command polling at WORKFLOW level (DBOS.recv allowed here!)
  let isPollingCommands = true
  const commandPollingInterval = setInterval(async () => {
    if (!isPollingCommands) {
      clearInterval(commandPollingInterval)
      return
    }

    try {
      // Non-blocking check for command (timeout = 0)
      // This is allowed at workflow level (not in step)
      const command = await DBOS.recv<ExecutionCommand>('COMMAND', 5)

      if (command) {
        DBOS.logger.info(`Received command: ${command.command} for ${task.executionId}`)

        if (command.command === 'STOP') {
          // STOP: Trigger abort controller
          abortController.abort(command.reason || 'User requested stop')
          DBOS.logger.info(`Abort triggered for execution: ${task.executionId}`)
        } else {
          // PAUSE/RESUME/STEP: Update shared command controller
          commandController.currentCommand = command.command
          commandController.commandTimestamp = Date.now()
          commandController.reason = command.reason
          DBOS.logger.debug(`Command queued: ${command.command} for ${task.executionId}`)
        }
      }
    } catch (error) {
      DBOS.logger.error(`Error polling for commands: ${error instanceof Error ? error.message : String(error)}`)
    }
  }, 500) // Poll every 500ms

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

    // Step 2: Execute flow ATOMICALLY
    // This is THE main step - includes:
    //   - Load flow from database
    //   - Initialize execution instance with shared controllers
    //   - Execute flow with real-time event streaming
    //   - Collect child tasks from emitted events
    //   - Wait for all events to be published
    //
    // Controllers are passed from workflow to step:
    //   - abortController: For STOP command (via abort signal)
    //   - commandController: For PAUSE/RESUME/STEP (via shared state)
    //
    // If this step fails, DBOS will retry the ENTIRE step on another worker.
    // The flow execution is atomic - either fully succeeds or fully fails.
    const result = await DBOS.runStep(
      () => executeFlowAtomic(task, abortController, commandController),
      { name: 'executeFlowAtomic' },
    )

    // Step 2.5: Spawn child executions (if any)
    // This happens at WORKFLOW level where DBOS.startWorkflow is allowed
    // Child tasks were collected during execution and returned in result.childTasks
    if (result.childTasks && result.childTasks.length > 0) {
      DBOS.logger.info(`Spawning ${result.childTasks.length} child execution(s) for: ${task.executionId}`)

      for (const childTask of result.childTasks) {
        try {
          // Start child workflow with executionId as workflowID
          // eslint-disable-next-line ts/no-use-before-define
          await DBOS.startWorkflow(executionWorkflow, {
            workflowID: childTask.executionId,
          })(childTask)

          DBOS.logger.info(`Child execution workflow started: ${childTask.executionId} (parent: ${task.executionId})`)
        } catch (error) {
          // Log error but continue spawning other children
          // Individual child failures shouldn't fail the parent
          DBOS.logger.error(`Failed to spawn child execution ${childTask.executionId}: ${error instanceof Error ? error.message : String(error)}`)
        }
      }

      DBOS.logger.info(`All ${result.childTasks.length} child execution(s) spawned for: ${task.executionId}`)
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
    // Stop command polling
    isPollingCommands = false
    clearInterval(commandPollingInterval)
    DBOS.logger.debug(`Command polling stopped for execution: ${task.executionId}`)
  }
}

/**
 * Registered workflow - use this to start executions
 */
export const executionWorkflow = DBOS.registerWorkflow(executeChainGraph)
