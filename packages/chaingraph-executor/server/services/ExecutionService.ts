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

import type { IEventBus, ITaskQueue } from 'server/interfaces'
import type { IExecutionStore } from 'server/stores/interfaces/IExecutionStore'
import type { ExecutionRow } from 'server/stores/postgres/schema'
import type { ExecutionInstance, ExecutionTask } from 'types'
import type { CreateExecutionParams, IExecutionService } from './IExecutionService'
import {
  ExecutionEventEnum,
} from '@badaitech/chaingraph-types'
import {
  ExecutionContext,
  ExecutionEngine,
} from '@badaitech/chaingraph-types'
import { customAlphabet } from 'nanoid'
import { nolookalikes } from 'nanoid-dictionary'
import { ExecutionStatus } from 'types'
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
      undefined, // TODO: do we really want to provide event data to the context?
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

    // Setup event handling
    const unsubscribe = this.setupEventHandling(instance)

    // Parent-child relationship is tracked via parentExecutionId in the store

    logger.debug({
      executionId: instance.row.id,
      flowId: flow.id,
      isChild: !!executionRow.parentExecutionId,
      parentId: executionRow.parentExecutionId,
      rootId: executionRow.rootExecutionId,
      depth: currentDepth,
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
      event.processed = true
      await this.spawnChildExecutionForEvent(instance, event)
    }
  }

  /**
   * Setup event handling for an execution
   */
  private setupEventHandling(instance: ExecutionInstance): (() => void) | undefined {
    // Subscribe to all events from the execution engine
    const unsubscribe = instance.engine?.onAll(async (event) => {
      console.debug(`[EVENT] Execution ${instance.row.id} emitted event:`, event)

      // Publish event to event bus for subscribers
      await this.eventBus.publishEvent(instance.row.id, event)

      // Log specific events
      switch (event.type) {
        case ExecutionEventEnum.FLOW_COMPLETED:
          logger.debug({ executionId: instance.row.id }, 'Flow completed event')
          break
        case ExecutionEventEnum.FLOW_FAILED:
          logger.debug({ executionId: instance.row.id, error: event.data }, 'Flow failed event')
          break
        case ExecutionEventEnum.FLOW_CANCELLED:
          logger.debug({ executionId: instance.row.id }, 'Flow cancelled event')
          break
      }
    })

    // Store unsubscribe function for cleanup (could be added to instance if needed)
    return unsubscribe
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
        // remove chatID and messageID because it might be used in the root execution only
        chatID: undefined,
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
