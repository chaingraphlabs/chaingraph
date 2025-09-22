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
import type { CreateExecutionParams, IExecutionService } from './IExecutionService'

import {
  ExecutionContext,
  ExecutionEngine,
} from '@badaitech/chaingraph-types'
import { customAlphabet } from 'nanoid'
import { nolookalikes } from 'nanoid-dictionary'
import { ExecutionStatus } from '../../types'
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

  // // Track active executions in memory for engine access
  // private activeExecutions: Map<string, ExecutionInstance> = new Map()
  //
  constructor(
    private readonly store: IExecutionStore,
    private readonly eventBus: IEventBus,
    private readonly taskQueue: ITaskQueue,
  ) {}

  async createExecutionInstance(params: CreateExecutionParams): Promise<ExecutionInstance> {
    const {
      task,
      flow,
      executionRow,
    } = params

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

    const context = new ExecutionContext(
      flow.id,
      params.abortController,
      undefined,
      executionRow.id,
      executionRow.integration || undefined,
      executionRow.parentExecutionId || undefined,
      executionRow.rootExecutionId || executionRow.id,
      executionRow.externalEvents?.[0] || undefined,
      // undefined, // TODO: do we really want to provide event data to the context?
      !!executionRow.parentExecutionId, // isChildExecution
      currentDepth,
      (nodeId: string) => flow.nodes.get(nodeId),
      (predicate: (node: INode) => boolean) => {
        return Array.from(flow.nodes.values()).filter(predicate)
      },
    )

    // Enable event support for all executions
    if (!context.emittedEvents) {
      context.emittedEvents = []
    }
    const engine = new ExecutionEngine(
      flow,
      context,
      executionRow.options || undefined,
      (node: INode) => {}, // TODO: onBreakpointHit
    )

    const instance: ExecutionInstance = {
      task,
      row: executionRow,
      context,
      flow,
      engine,
      initialStateFlow,
    }

    // Set up event callback for all executions to allow cycles
    engine.setEventCallback(async (ctx) => {
      await this.processEmittedEvents(instance)
    })

    // Store in database
    // await this.store.create(instance)

    // Store in memory for active tracking
    // this.activeExecutions.set(instance.row.id, instance)

    // Setup event handling and store cleanup function on the instance
    instance.cleanupEventHandling = this.setupEventHandling(instance)

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
    logger.debug({
      parentId: parentInstance.row.id,
      eventType: event.type,
      eventId: event.id,
    }, 'Spawning child execution for event')

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
    }

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
    }, 'Child execution task publish prepared')

    // Publish task to queue (will be executed by worker)
    try {
      await this.taskQueue.publishTask(childTask)
    } catch (error) {
      logger.error({
        parentId: parentInstance.row.id,
        childId: childExecutionId,
        eventType: event.type,
        error: error instanceof Error ? error.message : 'Unknown error',
      }, 'Failed to publish child execution task')
      throw error
    }

    // Parent-child relationship is tracked via parentExecutionId in the task

    logger.info({
      parentId: parentInstance.row.id,
      childId: childTask.executionId,
      eventType: event.type,
    }, 'Child execution task published')
  }
}
