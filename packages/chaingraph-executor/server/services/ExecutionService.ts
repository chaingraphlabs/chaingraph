/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type {
  EmittedEvent,
  EmittedEventContext,
  Flow,
  INode,
  IntegrationContext,
} from '@badaitech/chaingraph-types'
import type { IEventBus, ITaskQueue } from '../interfaces'
import type { IExecutionStore } from '../stores/interfaces/IExecutionStore'
import type { ExecutionCommand, ExecutionInstance, ExecutionOptions, ExecutionState, ExecutionTask } from '../types'
import {
  ExecutionContext,
  ExecutionEngine,
  ExecutionEventEnum,
} from '@badaitech/chaingraph-types'
import { TRPCError } from '@trpc/server'
import { customAlphabet } from 'nanoid'
import { nolookalikes } from 'nanoid-dictionary'
import { publishExecutionCommand } from '../kafka/producers/command-producer'
import { ExecutionStatus } from '../types'
import { config } from '../utils/config'
import { createLogger } from '../utils/logger'

const logger = createLogger('execution-service')

function generateExecutionID(): string {
  return `EX${customAlphabet(nolookalikes, 24)()}`
}

function generateEventID(): string {
  return `EV${customAlphabet(nolookalikes, 24)()}`
}

/**
 * Parameters for creating an execution
 */
export interface CreateExecutionParams {
  flow: Flow
  executionId?: string
  options?: ExecutionOptions
  integrations?: IntegrationContext
  parentExecutionId?: string
  eventData?: EmittedEventContext
  parentDepth?: number
}

/**
 * Refactored ExecutionService using dependency injection
 * Works with both local and distributed modes via interfaces
 */
export class ExecutionService {
  // Maximum execution depth to prevent infinite cycles
  private readonly MAX_EXECUTION_DEPTH = 100
  // Track active executions in memory for engine access
  private activeExecutions: Map<string, ExecutionInstance> = new Map()

  constructor(
    private readonly store: IExecutionStore,
    private readonly eventBus: IEventBus,
    private readonly taskQueue: ITaskQueue,
  ) {}

  async createExecution(params: CreateExecutionParams): Promise<ExecutionInstance> {
    const {
      flow,
      executionId: predeterminedId,
      options,
      integrations,
      parentExecutionId,
      eventData,
      parentDepth = 0,
    } = params

    flow.setIsDisabledPropagationEvents(true)

    // Initial state flow needed to keep in memory the original node states
    const initialStateFlow = await flow.clone() as Flow
    initialStateFlow.setIsDisabledPropagationEvents(true)

    const currentDepth = parentDepth + 1

    // Check for maximum depth
    if (currentDepth > this.MAX_EXECUTION_DEPTH) {
      logger.warn({
        currentDepth,
        maxDepth: this.MAX_EXECUTION_DEPTH,
      }, 'Maximum execution depth exceeded')
      throw new Error(`Maximum execution depth exceeded: ${currentDepth}. This may indicate an infinite event loop.`)
    }

    const id = predeterminedId || generateExecutionID()
    const abortController = new AbortController()
    const context = new ExecutionContext(
      flow.id,
      abortController,
      undefined,
      id,
      integrations,
      parentExecutionId,
      eventData,
      !!parentExecutionId, // isChildExecution
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
    const engine = new ExecutionEngine(flow, context, options)

    const instance: ExecutionInstance = {
      id,
      context,
      engine,
      flow,
      initialStateFlow,
      status: ExecutionStatus.Created,
      createdAt: new Date(),
      parentExecutionId,
      executionDepth: currentDepth,
    }

    // Set up event callback for all executions to allow cycles
    engine.setEventCallback(async (ctx) => {
      await this.processEmittedEvents(instance)
    })

    // Store in database
    await this.store.create(instance)

    // Store in memory for active tracking
    this.activeExecutions.set(id, instance)

    // Setup event handling
    this.setupEventHandling(instance)

    // Parent-child relationship is tracked via parentExecutionId in the store

    logger.debug({
      executionId: id,
      parentExecutionId,
      depth: currentDepth,
    }, 'Execution created')

    return instance
  }

  async getInstance(id: string): Promise<ExecutionInstance | null> {
    // Try memory first
    const memoryInstance = this.activeExecutions.get(id)
    if (memoryInstance) {
      return memoryInstance
    }

    // Fall back to database
    return this.store.get(id)
  }

  async startExecution(id: string, events?: Array<{ type: string, data?: any }>): Promise<void> {
    const instance = await this.getInstance(id)
    if (!instance) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: `Execution ${id} not found`,
      })
    }

    if (
      instance.status !== ExecutionStatus.Created
      && instance.status !== ExecutionStatus.Paused
    ) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: `Cannot start execution in ${instance.status} status`,
      })
    }

    try {
      // Process external events if provided
      if (events && events.length > 0) {
        // Store external events on the instance
        instance.externalEvents = events
        await this.processExternalEvents(instance, events)
      }

      // Update instance state
      instance.status = ExecutionStatus.Running
      instance.startedAt = new Date()
      await this.store.create(instance)

      // If we have external events, the parent execution should not run its flow
      // It should only act as a container for child executions
      if (!events || events.length === 0) {
        // Start execution only if no external events
        await instance.engine!.execute()
      } else {
        logger.info({
          executionId: id,
          eventCount: events.length,
        }, 'Skipping parent execution flow - external events will spawn child executions')
      }

      // Parent completes independently after spawning children - no waiting

      // Mark as completed if no errors occurred
      if (instance.status === ExecutionStatus.Running) {
        instance.status = ExecutionStatus.Completed
        instance.completedAt = new Date()
        await this.store.create(instance)

        logger.info({
          executionId: id,
          duration: instance.completedAt.getTime() - instance.startedAt!.getTime(),
        }, 'Execution completed')
      }

      // Cleanup from active executions
      this.activeExecutions.delete(id)
    } catch (error) {
      instance.status = ExecutionStatus.Failed
      instance.error = {
        message: error instanceof Error ? error.message : 'Unknown error',
      }
      instance.completedAt = new Date()
      await this.store.create(instance)

      // Cleanup from active executions
      this.activeExecutions.delete(id)

      logger.error({
        executionId: id,
        error: instance.error.message,
      }, 'Execution failed')

      throw error
    }
  }

  async stopExecution(id: string, reason?: string): Promise<void> {
    const instance = await this.getInstance(id)
    if (!instance) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: `Execution ${id} not found`,
      })
    }

    if (instance.status !== ExecutionStatus.Created
      && instance.status !== ExecutionStatus.Running
      && instance.status !== ExecutionStatus.Paused) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: `Cannot stop execution in ${instance.status} status`,
      })
    }

    // If distributed mode, send command to worker
    if (config.mode === 'distributed') {
      const claim = await this.store.getClaimForExecution(id)
      if (claim && claim.status === 'active') {
        // Double-check claim is still valid before sending command
        const now = new Date()
        if (claim.expiresAt < now) {
          logger.warn({ executionId: id, expiresAt: claim.expiresAt }, 'Claim expired, cannot send stop command')
        } else {
          const command: ExecutionCommand = {
            id: `CMD${customAlphabet(nolookalikes, 24)()}`,
            executionId: id,
            workerId: claim.workerId,
            command: 'STOP',
            payload: {
              reason: reason || 'User requested stop',
            },
            timestamp: Date.now(),
            requestId: `REQ${customAlphabet(nolookalikes, 16)()}`,
            issuedBy: 'user',
          }
          await publishExecutionCommand(command)
          logger.info({ executionId: id, workerId: claim.workerId }, 'Stop command published')
          return
        }
      }
    }

    // Local mode or no active claim - stop directly
    instance.context.abortController.abort('Execution stopped by user')
    instance.status = ExecutionStatus.Stopped
    instance.completedAt = new Date()
    await this.store.create(instance)

    // Cleanup from active executions
    this.activeExecutions.delete(id)

    logger.info({ executionId: id }, 'Execution stopped')
  }

  async pauseExecution(id: string, reason?: string): Promise<void> {
    const instance = await this.getInstance(id)
    if (!instance) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: `Execution ${id} not found`,
      })
    }

    if (instance.status !== ExecutionStatus.Running) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: `Cannot pause execution in ${instance.status} status`,
      })
    }

    // If distributed mode, send command to worker
    if (config.mode === 'distributed') {
      const claim = await this.store.getClaimForExecution(id)
      if (claim && claim.status === 'active') {
        // Double-check claim is still valid before sending command
        const now = new Date()
        if (claim.expiresAt < now) {
          logger.warn({ executionId: id, expiresAt: claim.expiresAt }, 'Claim expired, cannot send pause command')
        } else {
          const command: ExecutionCommand = {
            id: `CMD${customAlphabet(nolookalikes, 24)()}`,
            executionId: id,
            workerId: claim.workerId,
            command: 'PAUSE',
            payload: {
              reason: reason || 'User requested pause',
            },
            timestamp: Date.now(),
            requestId: `REQ${customAlphabet(nolookalikes, 16)()}`,
            issuedBy: 'user',
          }
          await publishExecutionCommand(command)
          logger.info({ executionId: id, workerId: claim.workerId }, 'Pause command published')
          return
        }
      }
    }

    // Local mode or no active claim - pause directly
    const dbg = instance.engine?.getDebugger()
    if (!dbg) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'Debugger is not enabled for this execution',
      })
    }

    dbg.pause()
    instance.status = ExecutionStatus.Paused
    await this.store.create(instance)
  }

  async resumeExecution(id: string): Promise<void> {
    const instance = await this.getInstance(id)
    if (!instance) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: `Execution ${id} not found`,
      })
    }

    // If distributed mode, send command to worker
    if (config.mode === 'distributed') {
      const claim = await this.store.getClaimForExecution(id)
      if (claim && claim.status === 'active') {
        // Double-check claim is still valid before sending command
        const now = new Date()
        if (claim.expiresAt < now) {
          logger.warn({ executionId: id, expiresAt: claim.expiresAt }, 'Claim expired, cannot send resume command')
        } else {
          const command: ExecutionCommand = {
            id: `CMD${customAlphabet(nolookalikes, 24)()}`,
            executionId: id,
            workerId: claim.workerId,
            command: 'RESUME',
            payload: {},
            timestamp: Date.now(),
            requestId: `REQ${customAlphabet(nolookalikes, 16)()}`,
            issuedBy: 'user',
          }
          await publishExecutionCommand(command)
          logger.info({ executionId: id, workerId: claim.workerId }, 'Resume command published')
          return
        }
      }
    }

    // Local mode or no active claim - resume directly
    const dbg = instance.engine?.getDebugger()
    if (!dbg) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'Debugger is not enabled for this execution',
      })
    }

    dbg.continue()
    instance.status = ExecutionStatus.Running
    await this.store.create(instance)
  }

  async getExecutionState(id: string): Promise<ExecutionState> {
    const instance = await this.getInstance(id)
    if (!instance) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: `Execution ${id} not found`,
      })
    }

    return {
      id: instance.id,
      status: instance.status,
      startTime: instance.startedAt,
      endTime: instance.completedAt,
      error: instance.error,
    }
  }

  async addBreakpoint(executionId: string, nodeId: string): Promise<void> {
    const instance = await this.getInstance(executionId)
    if (!instance) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: `Execution ${executionId} not found`,
      })
    }

    const dbg = instance.engine?.getDebugger()
    if (!dbg) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'Debugger is not enabled for this execution',
      })
    }

    // Verify node exists in flow
    if (!instance.flow.nodes.has(nodeId)) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: `Node ${nodeId} not found in flow`,
      })
    }

    dbg.addBreakpoint(nodeId)
  }

  async removeBreakpoint(executionId: string, nodeId: string): Promise<void> {
    const instance = await this.getInstance(executionId)
    if (!instance) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: `Execution ${executionId} not found`,
      })
    }

    const dbg = instance.engine?.getDebugger()
    if (!dbg) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'Debugger is not enabled for this execution',
      })
    }

    dbg.removeBreakpoint(nodeId)
  }

  async stepExecution(executionId: string): Promise<void> {
    const instance = await this.getInstance(executionId)
    if (!instance) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: `Execution ${executionId} not found`,
      })
    }

    const dbg = instance.engine?.getDebugger()
    if (!dbg) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'Debugger is not enabled for this execution',
      })
    }

    dbg.step()
  }

  async getBreakpoints(executionId: string): Promise<string[]> {
    const instance = await this.getInstance(executionId)
    if (!instance) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: `Execution ${executionId} not found`,
      })
    }

    const dbg = instance.engine?.getDebugger()
    if (!dbg) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'Debugger is not enabled for this execution',
      })
    }

    return Array.from(dbg.getState().breakpoints)
  }

  /**
   * Process external events and spawn child executions
   */
  private async processExternalEvents(
    instance: ExecutionInstance,
    events: Array<{ type: string, data?: any }>,
  ): Promise<void> {
    logger.debug({
      executionId: instance.id,
      eventCount: events.length,
    }, 'Processing external events')

    // Group consecutive events optimally
    const eventGroups: Array<Array<{ type: string, data?: any }>> = []
    let currentGroup: Array<{ type: string, data?: any }> = []
    const seenInGroup = new Set<string>()

    for (const event of events) {
      if (seenInGroup.has(event.type)) {
        // Start a new group if we've seen this event type in the current group
        eventGroups.push(currentGroup)
        currentGroup = [event]
        seenInGroup.clear()
        seenInGroup.add(event.type)
      } else {
        // Add to current group
        currentGroup.push(event)
        seenInGroup.add(event.type)
      }
    }

    // Don't forget the last group
    if (currentGroup.length > 0) {
      eventGroups.push(currentGroup)
    }

    logger.debug({
      executionId: instance.id,
      groupCount: eventGroups.length,
    }, 'Created event groups')

    // Spawn child executions for each group
    for (let i = 0; i < eventGroups.length; i++) {
      const group = eventGroups[i]

      // For now, spawn a child execution for each event in the group
      for (const event of group) {
        const emittedEvent: EmittedEvent = {
          id: generateEventID(),
          type: event.type,
          data: event.data || {},
          emittedAt: Date.now(),
          emittedBy: 'external',
          processed: false,
        }

        await this.spawnChildExecutionForEvent(instance, emittedEvent)
      }
    }
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
      executionId: instance.id,
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
   * Spawn a child execution for an event
   */
  private async spawnChildExecutionForEvent(
    parentInstance: ExecutionInstance,
    event: EmittedEvent,
  ): Promise<void> {
    logger.debug({
      parentId: parentInstance.id,
      eventType: event.type,
      eventId: event.id,
    }, 'Spawning child execution for event')

    const eventContext: EmittedEventContext = {
      eventName: event.type,
      payload: event.data,
      emittedBy: event.emittedBy,
    }

    // Create execution task for the child with a predetermined ID
    const childExecutionId = generateExecutionID()
    const task: ExecutionTask = {
      executionId: childExecutionId,
      flowId: parentInstance.flow.id,
      context: {
        integrations: parentInstance.context.integrations || {},
        parentExecutionId: parentInstance.id,
        eventData: eventContext,
        executionDepth: parentInstance.executionDepth + 1,
      },
      options: {
        maxConcurrency: 10,
        nodeTimeoutMs: 60000,
        flowTimeoutMs: 300000,
      },
      priority: 1,
      timestamp: Date.now(),
    }

    // Publish task to queue (will be executed by worker)
    await this.taskQueue.publishTask(task)

    // Parent-child relationship is tracked via parentExecutionId in the task

    logger.info({
      parentId: parentInstance.id,
      childId: task.executionId,
      eventType: event.type,
    }, 'Child execution task published')
  }

  /**
   * Stop all child executions
   */
  private async stopChildExecutions(parentId: string): Promise<void> {
    const childIds = await this.store.getChildExecutions?.(parentId) || []

    await Promise.all(
      childIds.map(childId => this.stopExecution(childId).catch((err) => {
        logger.error({
          parentId,
          childId,
          error: err,
        }, 'Failed to stop child execution')
      })),
    )
  }

  /**
   * Setup event handling for an execution
   */
  private setupEventHandling(instance: ExecutionInstance): void {
    const unsubscribe = instance.engine?.onAll(async (event) => {
      // Publish event to event bus for subscribers
      await this.eventBus.publishEvent(instance.id, event)

      // Log specific events
      switch (event.type) {
        case ExecutionEventEnum.FLOW_COMPLETED:
          logger.debug({ executionId: instance.id }, 'Flow completed event')
          break
        case ExecutionEventEnum.FLOW_FAILED:
          logger.debug({ executionId: instance.id, error: event.data }, 'Flow failed event')
          break
        case ExecutionEventEnum.FLOW_CANCELLED:
          logger.debug({ executionId: instance.id }, 'Flow cancelled event')
          break
      }
    })

    // Store unsubscribe function for cleanup (could be added to instance if needed)
  }

  /**
   * Get child executions of a parent
   */
  async getChildExecutions(parentId: string): Promise<string[]> {
    return this.store.getChildExecutions?.(parentId) || []
  }

  /**
   * Cleanup execution resources
   */
  async dispose(id: string): Promise<void> {
    // Remove from active executions
    this.activeExecutions.delete(id)

    // Unsubscribe from events
    await this.eventBus.unsubscribe(id)

    // Delete from store
    await this.store.delete(id)

    logger.debug({ executionId: id }, 'Execution disposed')
  }

  /**
   * Shutdown the service
   */
  async shutdown(): Promise<void> {
    logger.info('Shutting down execution service')

    // Cleanup all active executions
    const executions = await this.store.list()
    await Promise.all(
      executions.map(execution => this.dispose(execution.id)),
    )

    // Clear active executions
    this.activeExecutions.clear()
  }
}
