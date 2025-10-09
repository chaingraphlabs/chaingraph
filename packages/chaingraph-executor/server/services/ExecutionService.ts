/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type {
  EmittedEvent,
  Flow,
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
 * Refactored ExecutionService using dependency injection
 * Works with both local and distributed modes via interfaces
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
  ) {}

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

    // Initial state flow needed to keep in memory the original node states
    const initialStateFlow = await flow.clone() as Flow
    initialStateFlow.setIsDisabledPropagationEvents(true)

    const currentDepth = executionRow.executionDepth

    // Check for maximum depth
    if (currentDepth > this.MAX_EXECUTION_DEPTH) {
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
      (node: INode) => {}, // TODO: onBreakpointHit
    )
    const engineCreationTime = engineTimer.end()

    const instance: ExecutionInstance = {
      task,
      row: executionRow,
      context,
      flow,
      engine,
      initialStateFlow,
    }

    // Set up event callback for all executions to allow cycles
    // NOTE: In DBOS mode, child spawning is handled in the step (not here)
    // to avoid calling DBOS.startWorkflow() from within a step callback
    // The callback is kept for Kafka/Local modes where it works fine
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
   */
  private setupEventHandling(instance: ExecutionInstance): (() => Promise<void>) | undefined {
    const publishPromises: Promise<void>[] = []

    // Subscribe to all events from the execution engine
    const unsubscribe = instance.engine?.onAll(async (event) => {
      // Track the publish promise
      const publishPromise = this.eventBus.publishEvent(instance.row.id, event)
        .catch((error) => {
          logger.error({
            error,
            executionId: instance.row.id,
            eventType: event.type,
            eventIndex: event.index,
          }, 'Failed to publish event to Kafka')

          // TODO: Handle publish failure (e.g., retry, dead-letter queue, etc.)
        })

      publishPromises.push(publishPromise)

      // Wait for the publish to complete
      await publishPromise
    })

    // Return enhanced unsubscribe that waits for pending publishes
    return async () => {
      // Wait for all pending Kafka publishes
      if (publishPromises.length > 0) {
        await Promise.allSettled(publishPromises)
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
      flowId: parentInstance.flow.id,
      timestamp: Date.now(),
      maxRetries: parentInstance.task.maxRetries,
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
    // - DBOS mode: Send to child spawner workflow (blazing fast, non-blocking!)
    // - Kafka/Local mode: Publish directly to task queue
    const taskPublishTimer = this.metricsHelper.createTimer(MetricStages.CHILD_SPAWN, 'task_publish')
    try {
      // Always use taskQueue.publishTask() - it handles routing internally
      // For DBOS mode, taskQueue will be DBOSChildSpawnerQueue which uses DBOS.send()
      // For Kafka/Local mode, taskQueue will publish normally
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
