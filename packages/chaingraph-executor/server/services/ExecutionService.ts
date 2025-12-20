/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { UserStore } from '@badaitech/chaingraph-trpc/server'
import type {
  EmittedEvent,
  INode,
  IntegrationContext,
} from '@badaitech/chaingraph-types'

import type { IEventBus, ITaskQueue } from '../../server/interfaces'
import type { IExecutionStore } from '../../server/stores/interfaces/IExecutionStore'
import type { ExecutionRow } from '../../server/stores/postgres/schema'
import type { ExecutionInstance, ExecutionTask } from '../../types'
import type { ChildSpawnMetric, InitMetric } from '../metrics'

import type { CreateExecutionParams, IExecutionService } from './IExecutionService'
import {
  ExecutionContext,
  ExecutionEngine,
} from '@badaitech/chaingraph-types'
import { customAlphabet } from 'nanoid'
import { nolookalikes } from 'nanoid-dictionary'
import { ExecutionStatus } from '../../types'
import { createMetricsTracker, MetricsHelper, MetricStages } from '../metrics'
import { createLogger } from '../utils/logger'

const logger = createLogger('execution-service')

export function generateExecutionID(): string {
  return `EX${customAlphabet(nolookalikes, 24)()}`
}

export function generateEventID(): string {
  return `EV${customAlphabet(nolookalikes, 24)()}`
}

/**
 * ExecutionService using dependency injection
 * Works with both local and DBOS modes via interfaces
 */
export class ExecutionService implements IExecutionService {
  // Maximum execution depth to prevent infinite cycles
  private readonly MAX_EXECUTION_DEPTH = 100

  // Metrics tracking
  private readonly metrics = createMetricsTracker('execution-service')
  private readonly metricsHelper = new MetricsHelper(this.metrics)

  // // Track active executions in memory for engine access
  // private activeExecutions: Map<string, ExecutionInstance> = new Map()
  //
  constructor(
    private readonly store: IExecutionStore,
    private readonly eventBus: IEventBus,
    private readonly taskQueue: ITaskQueue,
    private readonly userStore: UserStore,
  ) { }

  /**
   * Get the event bus instance
   * Useful for accessing event bus-specific methods (e.g., closing DBOS streams)
   */
  getEventBus(): IEventBus {
    return this.eventBus
  }

  async createExecutionInstance(params: CreateExecutionParams): Promise<ExecutionInstance> {
    const {
      task,
      flow,
      executionRow,
    } = params

    const scopedMetrics = this.metrics.withContext({
      executionId: executionRow.id,
      flowId: flow.id,
      rootExecutionId: executionRow.rootExecutionId || executionRow.id,
      parentExecutionId: executionRow.parentExecutionId || undefined,
      executionDepth: executionRow.executionDepth,
    })

    const initTimer = this.metricsHelper.createTimer(MetricStages.INIT, 'instance_create')

    flow.setIsDisabledPropagationEvents(true)

    const currentDepth = executionRow.executionDepth

    // Check for maximum depth
    if (currentDepth > Math.max(this.MAX_EXECUTION_DEPTH, task.maxDepth || 0)) {
      logger.warn({
        currentDepth,
        maxDepth: this.MAX_EXECUTION_DEPTH,
      }, 'Maximum execution depth exceeded')
      throw new Error(`Maximum execution depth exceeded: ${currentDepth}. This may indicate an infinite event loop.`)
    }

    // Track context creation
    const contextTimer = this.metricsHelper.createTimer(MetricStages.INIT, 'context_create')
    const context = new ExecutionContext(
      flow.id,
      params.abortController,
      undefined,
      executionRow.id,
      executionRow.integration || undefined,
      executionRow.rootExecutionId || executionRow.id,
      executionRow.parentExecutionId || undefined,
      executionRow.externalEvents?.[0] || undefined,
      !!executionRow.parentExecutionId, // isChildExecution
      currentDepth,
      (nodeId: string) => flow.nodes.get(nodeId),
      (predicate: (node: INode) => boolean) => {
        return Array.from(flow.nodes.values()).filter(predicate)
      },
      executionRow.ownerId,
    )
    const contextCreationTime = contextTimer.end()

    // Enable event support for all executions
    if (!context.emittedEvents) {
      context.emittedEvents = []
    }

    // Track engine creation
    const engineTimer = this.metricsHelper.createTimer(MetricStages.INIT, 'engine_create')
    const engine = new ExecutionEngine(
      flow,
      context,
      executionRow.options || undefined,
      (node: INode) => { }, // TODO: onBreakpointHit
    )
    const engineCreationTime = engineTimer.end()

    const instance: ExecutionInstance = {
      task,
      row: executionRow,
      context,
      flow,
      engine,
    }

    // Set up event callback for all executions to allow cycles
    // NOTE: In DBOS mode, child spawning is handled in the step (not here)
    // to avoid calling DBOS.startWorkflow() from within a step callback
    // The callback is kept for Local mode where it works fine
    // TODO: Make this conditional based on execution mode
    // engine.setEventCallback(async (ctx) => {
    //   await this.processEmittedEvents(instance)
    // })

    // Store in database
    // await this.store.create(instance)

    // Store in memory for active tracking
    // this.activeExecutions.set(instance.row.id, instance)

    // Setup event handling and store cleanup function on the instance
    const eventHandlerTimer = this.metricsHelper.createTimer(MetricStages.INIT, 'event_handler_setup')
    instance.cleanupEventHandling = this.setupEventHandling(instance)
    const eventHandlerSetupTime = eventHandlerTimer.end()

    // Track instance creation complete
    const totalInitTime = initTimer.end()
    scopedMetrics.track({
      stage: MetricStages.INIT,
      event: 'setup_complete',
      timestamp: Date.now(),
      total_init_ms: totalInitTime,
      context_creation_ms: contextCreationTime,
      engine_creation_ms: engineCreationTime,
      event_handler_setup_ms: eventHandlerSetupTime,
      instance_count: 1, // Could track active instances if needed
      node_count: flow.nodes.size,
      edge_count: flow.edges.size,
    } as InitMetric)

    // Parent-child relationship is tracked via parentExecutionId in the store

    logger.debug({
      executionId: instance.row.id,
      flowId: flow.id,
      isChild: !!executionRow.parentExecutionId,
      parentId: executionRow.parentExecutionId,
      rootId: executionRow.rootExecutionId,
      depth: currentDepth,
      integration: {
        ...(executionRow.integration?.archai
          ? {
              archai: {
                agentID: executionRow.integration.archai.agentID,
                chatID: executionRow.integration.archai.chatID,
                messageID: executionRow.integration.archai.messageID,
              },
            }
          : {}),
      },
    }, 'Execution created')

    return instance
  }

  /**
   * Process emitted events and spawn child executions
   */
  async processEmittedEvents(instance: ExecutionInstance): Promise<void> {
    const context = instance.context
    if (!context.emittedEvents || context.emittedEvents.length === 0) {
      return
    }

    logger.debug({
      executionId: instance.row.id,
      eventCount: context.emittedEvents.length,
    }, 'Processing emitted events')

    // Process all unprocessed events
    const unprocessedEvents = context.emittedEvents.filter(e => !e.processed)

    for (const event of unprocessedEvents) {
      if (event.processed) {
        continue
      }
      event.processed = true
      await this.spawnChildExecutionForEvent(instance, event)
    }
  }

  /**
   * Setup event handling for an execution
   *
   * Events are published asynchronously using a sequential queue to avoid blocking flow execution
   * while preventing race conditions in DBOS stream writes.
   *
   * The queue ensures:
   * - Events are written to DBOS streams sequentially (no offset conflicts)
   * - Engine callback returns immediately (non-blocking execution)
   * - All publish promises are tracked for cleanup
   */
  private setupEventHandling(instance: ExecutionInstance): (() => Promise<void>) | undefined {
    const publishPromises: Promise<void>[] = []

    // Promise chain for sequential stream writes
    // This prevents race conditions in DBOS.writeStream() offset assignment
    let publishQueue = Promise.resolve()

    // Subscribe to all events from the execution engine
    const unsubscribe = instance.engine?.onAll((event) => {
      // Chain this event's publish to the queue (sequential processing)
      // But don't block the engine callback - it returns immediately
      publishQueue = publishQueue
        .then(() => this.eventBus.publishEvent(instance.row.id, event))
        .catch((error) => {
          logger.error({
            error,
            executionId: instance.row.id,
            eventType: event.type,
            eventIndex: event.index,
          }, 'Failed to publish event')

          // TODO: Handle publish failure (e.g., retry, dead-letter queue, etc.)
        })

      // Track the promise so we can wait for all publishes during cleanup
      publishPromises.push(publishQueue)

      // Engine callback returns immediately - execution continues without blocking
    })

    // Return enhanced cleanup function that waits for all pending publishes
    return async () => {
      logger.debug({
        executionId: instance.row.id,
        pendingPublishes: publishPromises.length,
      }, 'Waiting for all event publishes to complete')

      // Wait for all pending event publishes to complete
      if (publishPromises.length > 0) {
        const startTime = Date.now()

        // Wait for the entire publish queue to drain
        await publishQueue.catch(() => {
          // Ignore errors here - they were already logged during publishing
        })

        const duration = Date.now() - startTime

        logger.debug({
          executionId: instance.row.id,
          total: publishPromises.length,
          duration,
        }, 'Event publish cleanup complete')
      }

      unsubscribe?.()
    }
  }

  /**
   * Spawn a child execution for an event
   */
  private async spawnChildExecutionForEvent(
    parentInstance: ExecutionInstance,
    event: EmittedEvent,
  ): Promise<void> {
    const spawnTimer = this.metricsHelper.createTimer(MetricStages.CHILD_SPAWN, 'spawn')

    logger.debug({
      parentId: parentInstance.row.id,
      eventType: event.type,
      eventId: event.id,
    }, 'Spawning child execution for event')

    const childExecutionId = generateExecutionID()

    const scopedMetrics = this.metrics.withContext({
      executionId: parentInstance.row.id,
      flowId: parentInstance.flow.id,
      parentExecutionId: parentInstance.row.id,
      rootExecutionId: parentInstance.row.rootExecutionId || undefined,
      executionDepth: parentInstance.row.executionDepth + 1,
    })
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

    // Create child execution in store with metrics
    const dbInsertTimer = this.metricsHelper.createTimer(MetricStages.CHILD_SPAWN, 'db_insert')
    try {
      await this.store.create(childExecutionRow)
    } catch (error) {
      logger.error({
        parentId: parentInstance.row.id,
        eventType: event.type,
        error: error instanceof Error ? error.message : 'Unknown error',
      }, 'Failed to create child execution in store')
      throw error
    }
    const dbInsertTime = dbInsertTimer.end()

    const childTask: ExecutionTask = {
      executionId: childExecutionId,
      parentExecutionId: parentInstance.task.executionId,
      flowVersion: parentInstance.task?.flowVersion || parentInstance.flow.metadata.version || undefined,
      flowId: parentInstance.flow.id,
      timestamp: Date.now(),
      maxRetries: parentInstance.task.maxRetries,
      maxDepth: parentInstance.task.maxDepth ? (parentInstance.task.maxDepth - 1) : undefined,
      maxTimeoutMs: parentInstance.task.maxTimeoutMs,
    }

    logger.debug({
      parentId: parentInstance.row.id,
      childId: childExecutionId,
      eventType: event.type,
      flowId: parentInstance.flow.id,
      integration: {
        ...(childIntegrationContext.archai
          ? {
              archai: {
                agentID: childIntegrationContext.archai.agentID,
                chatID: childIntegrationContext.archai.chatID,
                messageID: childIntegrationContext.archai.messageID,
              },
            }
          : {}),
      },
    }, 'Child execution task spawn prepared')

    // Spawn child execution with metrics
    // Strategy depends on execution mode:
    // - DBOS mode: Collected in step, spawned at workflow level
    // - Local mode: Publish directly to in-memory task queue
    const taskPublishTimer = this.metricsHelper.createTimer(MetricStages.CHILD_SPAWN, 'task_publish')
    try {
      // Always use taskQueue.publishTask() - it handles routing internally
      // For DBOS mode, taskQueue will use DBOS queue
      // For Local mode, taskQueue will publish to in-memory queue
      await this.taskQueue.publishTask(childTask)
    } catch (error) {
      logger.error({
        parentId: parentInstance.row.id,
        childId: childExecutionId,
        eventType: event.type,
        error: error instanceof Error ? error.message : 'Unknown error',
      }, 'Failed to spawn child execution')

      // Track spawn error
      scopedMetrics.track({
        stage: MetricStages.CHILD_SPAWN,
        event: 'error',
        timestamp: Date.now(),
        error: error instanceof Error ? error.message : 'Unknown error',
        childExecutionId,
        emittedEventType: event.type,
      } as ChildSpawnMetric)

      throw error
    }
    const taskPublishTime = taskPublishTimer.end()

    // Track successful child spawn
    const totalSpawnTime = spawnTimer.end()
    scopedMetrics.track({
      stage: MetricStages.CHILD_SPAWN,
      event: 'task_published',
      timestamp: Date.now(),
      childExecutionId,
      emittedEventType: event.type,
      total_spawn_ms: totalSpawnTime,
      db_insert_ms: dbInsertTime,
      task_publish_ms: taskPublishTime,
      siblings_count: parentInstance.context.emittedEvents?.length || 0,
    } as ChildSpawnMetric)

    // Parent-child relationship is tracked via parentExecutionId in the task

    logger.info({
      parentId: parentInstance.row.id,
      childId: childTask.executionId,
      eventType: event.type,
    }, 'Child execution task published')
  }
}
