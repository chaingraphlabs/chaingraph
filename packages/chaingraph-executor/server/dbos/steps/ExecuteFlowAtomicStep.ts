/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { EmittedEvent, IntegrationContext } from '@badaitech/chaingraph-types'
import type { ExecutionInstance, ExecutionTask } from '../../../types'
import type { ExecutionService } from '../../services/ExecutionService'
import type { IExecutionStore } from '../../stores/interfaces/IExecutionStore'
import type { ExecutionRow } from '../../stores/postgres/schema'
import type { ExecutionResult } from '../types'
import type { CommandController } from '../workflows/ExecutionWorkflow'
import { DBOS } from '@dbos-inc/dbos-sdk'
import { customAlphabet } from 'nanoid'
import { nolookalikes } from 'nanoid-dictionary'
import { ExecutionStatus } from '../../../types'
import { loadFlow } from '../../stores/flow-store'

/**
 * Generate execution ID for child executions
 */
function generateExecutionID(): string {
  return `EX${customAlphabet(nolookalikes, 24)()}`
}

/**
 * Create a child execution task from an emitted event
 * This creates the DB row but doesn't spawn the workflow (that must happen at workflow level)
 *
 * @param parentInstance The parent execution instance
 * @param event The emitted event that triggered the child
 * @param store Execution store for database operations
 * @returns The child execution task ready to be spawned
 */
async function createChildTask(
  parentInstance: ExecutionInstance,
  event: EmittedEvent,
  store: IExecutionStore,
): Promise<ExecutionTask> {
  const childExecutionId = generateExecutionID()

  const childIntegrationContext: IntegrationContext = {
    ...parentInstance.row.integration,
  }

  if (parentInstance.row.integration?.archai) {
    childIntegrationContext.archai = {
      ...parentInstance.row.integration?.archai,
      // remove messageID because it might be used in the root execution only
      messageID: undefined,
    }
  }

  const childExecutionRow: ExecutionRow = {
    id: childExecutionId,
    flowId: parentInstance.flow.id,
    ownerId: parentInstance.flow.metadata.ownerID || 'undefined',
    rootExecutionId: parentInstance.row.rootExecutionId,
    parentExecutionId: parentInstance.task.executionId,
    status: ExecutionStatus.Created,
    createdAt: new Date(),
    updatedAt: new Date(),
    startedAt: null,
    completedAt: null,
    errorMessage: null,
    errorNodeId: null,
    executionDepth: parentInstance.row.executionDepth + 1,
    options: parentInstance.row.options,
    integration: childIntegrationContext,
    externalEvents: [
      {
        eventName: event.type,
        payload: event.data,
      },
    ],
    // Failure tracking and recovery fields
    failureCount: 0,
    lastFailureReason: null,
    lastFailureAt: null,
    processingStartedAt: null,
    processingWorkerId: null,
  }

  // Create child execution in store
  await store.create(childExecutionRow)

  DBOS.logger.debug(`Child execution row created: ${childExecutionId} (parent: ${parentInstance.row.id}, event: ${event.type})`)

  // Return task for workflow-level spawning
  return {
    executionId: childExecutionId,
    flowId: parentInstance.flow.id,
    timestamp: Date.now(),
    maxRetries: parentInstance.task.maxRetries,
  }
}

/**
 * ATOMIC EXECUTION STEP
 *
 * This is the core step that executes a chaingraph flow from start to finish.
 * It's designed to be atomic - either the entire execution succeeds or fails as a unit.
 *
 * What happens in this step:
 * 1. Load the flow definition from database
 * 2. Initialize the execution instance with event streaming
 * 3. Execute the flow (can take up to 30 minutes)
 * 4. Stream events in real-time during execution (DBOS streams)
 * 5. Wait for all events to be published before completing
 *
 * CRITICAL GUARANTEES:
 * - The entire flow execution happens on ONE worker (no state transfer)
 * - Flow state stays in-memory throughout execution
 * - If execution fails, DBOS retries this ENTIRE step on another worker
 * - Events are streamed in real-time as execution progresses
 * - Step only completes after all events are safely persisted
 * - DBOS automatically closes event streams when workflow terminates
 */

// Module-level state for dependency injection (initialized by worker)
let executionService: ExecutionService | null = null
let executionStore: IExecutionStore | null = null

/**
 * Initialize the step with execution service and store dependencies
 */
export function initializeExecuteFlowStep(service: ExecutionService, store: IExecutionStore): void {
  executionService = service
  executionStore = store
  DBOS.logger.debug('ExecuteFlowAtomicStep initialized')
}

/**
 * Get the execution service instance, throw if not initialized
 */
function getExecutionService(): ExecutionService {
  if (!executionService) {
    throw new Error('ExecuteFlowAtomicStep not initialized. Call initializeExecuteFlowStep() first.')
  }
  return executionService
}

/**
 * Get the execution store instance, throw if not initialized
 */
function getExecutionStore(): IExecutionStore {
  if (!executionStore) {
    throw new Error('ExecuteFlowAtomicStep not initialized. Call initializeExecuteFlowStep() first.')
  }
  return executionStore
}

/**
 * Execute a chaingraph flow atomically
 *
 * This is a single, indivisible operation that encompasses the entire execution lifecycle.
 * If this step fails at any point, DBOS will automatically retry it on another worker.
 *
 * @param task Execution task containing executionId and flowId
 * @param abortController Abort controller from workflow level (for STOP command)
 * @param commandController Command controller from workflow level (for PAUSE/RESUME/STEP)
 * @returns Execution result with status and duration
 */
export async function executeFlowAtomic(
  task: ExecutionTask,
  abortController: AbortController,
  commandController: CommandController,
): Promise<ExecutionResult> {
  const startTime = Date.now()
  DBOS.logger.info(`Starting atomic flow execution: ${task.executionId}`)

  const service = getExecutionService()
  const store = getExecutionStore()

  // Collect child tasks for spawning at workflow level
  // This avoids calling DBOS.startWorkflow() from within a step
  const collectedChildTasks: ExecutionTask[] = []

  // Step 1: Load flow from database
  DBOS.logger.debug(`Loading flow: ${task.flowId}`)
  const flow = await loadFlow(task.flowId)

  if (!flow) {
    const error = `Flow ${task.flowId} not found`
    DBOS.logger.error(error)
    throw new Error(error)
  }

  DBOS.logger.info(`Flow loaded: ${task.flowId} (${flow.nodes.size} nodes, ${flow.edges.size} edges)`)

  // Step 2: Get execution row from store
  const executionRow = await store.get(task.executionId)

  if (!executionRow) {
    const error = `Execution ${task.executionId} not found in database`
    DBOS.logger.error(error)
    throw new Error(error)
  }

  // Step 3: Create execution instance with workflow-provided abortController
  // The execution instance is configured to stream events in real-time
  // Events are streamed via DBOS.writeStream() to PostgreSQL
  // AbortController is passed from workflow level to enable STOP command
  DBOS.logger.debug(`Creating execution instance: ${task.executionId}`)

  const instance = await service.createExecutionInstance({
    task,
    flow,
    executionRow,
    abortController, // ← Passed from workflow level
  })

  // Step 4: Execute the flow
  // Events are streamed in real-time during execution via DBOS streams
  // Commands are received via shared state from workflow-level polling
  DBOS.logger.info(`Executing flow: ${task.executionId}`)

  // 🎮 Start command checking loop (checks shared state, no DBOS calls!)
  // The workflow-level polling updates commandController, we just read it here
  let isCheckingCommands = true
  let lastProcessedTimestamp = 0

  const commandCheckInterval = setInterval(async () => {
    if (!isCheckingCommands) {
      clearInterval(commandCheckInterval)
      return
    }

    try {
      // Check if there's a new command in the shared state
      if (commandController.currentCommand && commandController.commandTimestamp > lastProcessedTimestamp) {
        const command = commandController.currentCommand
        const reason = commandController.reason

        DBOS.logger.info(`Processing command: ${command} for ${task.executionId}`)

        // Get debugger from engine (renamed to avoid 'debugger' reserved keyword)
        const flowDebugger = instance.engine?.getDebugger()

        switch (command) {
          case 'PAUSE':
            flowDebugger?.pause()
            await store.updateExecutionStatus({
              executionId: task.executionId,
              status: ExecutionStatus.Paused,
            })
            DBOS.logger.info(`Execution paused: ${task.executionId}`)
            break

          case 'RESUME':
            flowDebugger?.continue()
            await store.updateExecutionStatus({
              executionId: task.executionId,
              status: ExecutionStatus.Running,
            })
            DBOS.logger.info(`Execution resumed: ${task.executionId}`)
            break

          case 'STEP':
            flowDebugger?.step()
            DBOS.logger.info(`Execution stepped: ${task.executionId}`)
            break

          case 'STOP':
            // STOP is handled via abort controller at workflow level
            // But if we see it here, log it
            DBOS.logger.info(`STOP command detected (handled via abort): ${task.executionId}`)
            break

          default:
            DBOS.logger.warn(`Unknown command type: ${command}`)
        }

        // Mark command as processed
        lastProcessedTimestamp = commandController.commandTimestamp
      }
    } catch (error) {
      DBOS.logger.error(`Error checking commands: ${error instanceof Error ? error.message : String(error)}`)
    }
  }, 100) // Check every 100ms (faster than workflow polling for responsiveness)

  try {
    await instance.engine!.execute(async (context, eventQueue) => {
      // Execution complete callback
      // The eventQueue is already closed at this point, and all events should be processed

      // Stop command checking
      isCheckingCommands = false
      clearInterval(commandCheckInterval)

      // Step 5: Wait for all events to be published
      // This ensures all events are safely persisted before we mark step as complete
      // Events are in PostgreSQL via DBOS streams
      DBOS.logger.debug(`Waiting for all events to be published: ${task.executionId}`)

      if (instance.cleanupEventHandling) {
        await instance.cleanupEventHandling()
      }

      DBOS.logger.info(`All events published successfully: ${task.executionId}`)
    })

    const duration = Date.now() - startTime
    DBOS.logger.info(
      `Flow execution completed successfully: ${task.executionId} in ${duration}ms`,
    )

    // Collect child tasks from emitted events
    // These will be spawned at workflow level (where DBOS.startWorkflow is allowed)
    if (instance.context.emittedEvents && instance.context.emittedEvents.length > 0) {
      const unprocessedEvents = instance.context.emittedEvents.filter(e => !e.processed)

      if (unprocessedEvents.length > 0) {
        const dbInsertStartTime = Date.now()
        DBOS.logger.debug(`Creating ${unprocessedEvents.length} child execution rows in parallel`)

        // Create all child tasks in parallel to avoid blocking on sequential DB inserts
        // This is much faster than sequential inserts (10x improvement for 100 children)
        const childTaskPromises = unprocessedEvents.map(async (event) => {
          // Mark as processed to avoid double-processing
          event.processed = true

          try {
            // Create child execution row and task (but don't spawn yet)
            const childTask = await createChildTask(instance, event, store)
            DBOS.logger.debug(`Child task created: ${childTask.executionId} (parent: ${task.executionId}, event: ${event.type})`)
            return { status: 'created' as const, task: childTask }
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error)
            DBOS.logger.error(`Failed to create child task for event ${event.type}: ${errorMessage}`)
            return { status: 'failed' as const, error: errorMessage, eventType: event.type }
          }
        })

        // Wait for all DB inserts to complete
        const results = await Promise.allSettled(childTaskPromises)

        // Collect successful child tasks
        let successCount = 0
        let failureCount = 0

        for (const result of results) {
          if (result.status === 'fulfilled') {
            if (result.value.status === 'created') {
              collectedChildTasks.push(result.value.task)
              successCount++
            } else {
              failureCount++
            }
          } else {
            // Promise itself was rejected (shouldn't happen with our error handling, but be defensive)
            DBOS.logger.error(`Unexpected promise rejection in child task creation: ${result.reason}`)
            failureCount++
          }
        }

        const dbInsertDuration = Date.now() - dbInsertStartTime
        DBOS.logger.info(
          `Child execution rows created: ${successCount}/${unprocessedEvents.length} succeeded, ${failureCount} failed in ${dbInsertDuration}ms ` +
          `(${(unprocessedEvents.length / (dbInsertDuration / 1000)).toFixed(1)} inserts/sec) for: ${task.executionId}`
        )
      }
    }

    DBOS.logger.info(`Flow execution completed with ${collectedChildTasks.length} child tasks to spawn: ${task.executionId}`)

    // Note: DBOS automatically closes streams when the workflow terminates
    // No manual closeStream() call needed

    return {
      executionId: task.executionId,
      status: 'completed',
      duration,
      childTasks: collectedChildTasks, // ← Return for workflow-level spawning
    }
  } catch (error) {
    const duration = Date.now() - startTime
    const errorMessage = error instanceof Error ? error.message : String(error)

    DBOS.logger.error(
      `Flow execution failed: ${task.executionId} after ${duration}ms - ${errorMessage}`,
    )

    // Stop command checking on error
    isCheckingCommands = false
    clearInterval(commandCheckInterval)

    // Try to cleanup event handling even on error
    try {
      if (instance.cleanupEventHandling) {
        await instance.cleanupEventHandling()
        DBOS.logger.debug(`Event handling cleanup completed after error: ${task.executionId}`)
      }
    } catch (cleanupError) {
      DBOS.logger.error('Failed to cleanup event handling after execution error')
    }

    // Note: DBOS automatically closes streams when the workflow terminates
    // No manual closeStream() call needed, even on error

    // Re-throw the error so DBOS can handle retry
    throw error
  } finally {
    // Ensure command checking is stopped
    isCheckingCommands = false
    clearInterval(commandCheckInterval)
  }
}
