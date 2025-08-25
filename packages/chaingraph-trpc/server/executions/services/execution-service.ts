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
  ExecutionEvent,
  ExecutionEventHandler,
  Flow,
  INode,
  IntegrationContext,

} from '@badaitech/chaingraph-types'
import type { IExecutionStore } from '../store/execution-store'
import type { PostgresEventStore } from '../store/postgres/event-store'
import type { ExecutionInstance, ExecutionOptions, ExecutionState } from '../types'
import { EventEmitter } from 'node:events'
import {
  createExecutionEventHandler,
  EventQueue,
  ExecutionContext,
  ExecutionEngine,
  ExecutionEventEnum,
  ExecutionEventImpl,
} from '@badaitech/chaingraph-types'
import { TRPCError } from '@trpc/server'
import { customAlphabet } from 'nanoid'
import { nolookalikes } from 'nanoid-dictionary'
import { ExecutionStatus } from '../types'

function generateExecutionID(): string {
  return `EX${customAlphabet(nolookalikes, 24)()}`
}

function generateEventID(): string {
  return `EV${customAlphabet(nolookalikes, 24)()}`
}

export class ExecutionService {
  // Keep track of event queues per execution
  private eventQueues: Map<string, EventQueue<ExecutionEventImpl>> = new Map()
  // Keep track of child executions
  private childExecutions: Map<string, Set<string>> = new Map() // parentId -> Set<childId>
  // Use event emitters for child completion notifications
  private childCompletionEmitters: Map<string, EventEmitter> = new Map() // parentId -> EventEmitter
  // Maximum execution depth to prevent infinite cycles
  private readonly MAX_EXECUTION_DEPTH = 100

  constructor(
    private readonly store: IExecutionStore,
    private readonly eventStore: PostgresEventStore | null = null,
  ) {}

  async createExecution(
    flow: Flow,
    options?: ExecutionOptions,
    integrations?: IntegrationContext,
    parentExecutionId?: string,
    eventData?: EmittedEventContext,
    parentDepth: number = 0,
  ): Promise<ExecutionInstance> {
    flow.setIsDisabledPropagationEvents(true)

    // Initial state flow needed to keep in memory the original node states
    const initialStateFlow = await flow.clone() as Flow
    initialStateFlow.setIsDisabledPropagationEvents(true)

    const currentDepth = parentDepth + 1

    // Check for maximum depth
    if (currentDepth > this.MAX_EXECUTION_DEPTH) {
      console.warn(`[createExecution] Maximum execution depth (${this.MAX_EXECUTION_DEPTH}) exceeded. Preventing cycle at depth ${currentDepth}`)
      throw new Error(`Maximum execution depth exceeded: ${currentDepth}. This may indicate an infinite event loop.`)
    }

    const id = generateExecutionID()
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
        // todo: possible to optimize somehow?
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

    await this.store.create(instance)

    // TODO: persist execution state to store

    // Setup event queue for all executions
    // This ensures the queue exists when subscriptions are created
    this.setupEventHandling(instance)

    // Track parent-child relationship
    if (parentExecutionId) {
      if (!this.childExecutions.has(parentExecutionId)) {
        this.childExecutions.set(parentExecutionId, new Set())
      }
      this.childExecutions.get(parentExecutionId)!.add(id)
    }

    return instance
  }

  async getInstance(id: string): Promise<ExecutionInstance | null> {
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
      // Setup event handling if not already done
      let eventQueue = this.eventQueues.get(id)
      if (!eventQueue) {
        eventQueue = this.setupEventHandling(instance)
      }

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
        await instance.engine.execute()
      } else {
        console.log(`[startExecution] Skipping parent execution flow for ${id} - external events will spawn child executions`)
      }

      // Wait for child executions (all executions can have children now)
      await this.waitForChildExecutions(id)

      // Ensure all events are processed before cleanup
      if (this.eventStore) {
        await this.eventStore.flushAll()
      }

      // If execution completed without setting a final status, ensure it's marked as completed
      // BUT only if this execution has no children (children completion is handled by checkParentCompletion)
      const childIds = await this.getChildExecutions(id)
      if (instance.status === ExecutionStatus.Running && childIds.length === 0) {
        console.log(`[startExecution] No child executions found for ${id}, marking as completed`)
        instance.status = ExecutionStatus.Completed
        instance.completedAt = new Date()
        await this.store.create(instance)
      }

      // Cleanup
      await eventQueue.close()
    } catch (error) {
      instance.status = ExecutionStatus.Failed
      instance.error = {
        message: error instanceof Error ? error.message : 'Unknown error',
      }
      instance.completedAt = new Date()
      await this.store.create(instance)

      // Ensure all events are flushed even on error
      if (this.eventStore) {
        try {
          await this.eventStore.flushAll()
        } catch (flushError) {
          console.error('Failed to flush events on error:', flushError)
        }
      }

      // Cleanup event queue on error
      const eventQueue = this.eventQueues.get(id)
      if (eventQueue) {
        await eventQueue.close()
      }
    }
  }

  async stopExecution(id: string): Promise<void> {
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

    instance.context.abortController.abort('Execution stopped by user')
    instance.status = ExecutionStatus.Stopped
    await this.store.create(instance)

    // Stop all child executions when parent is stopped
    await this.stopChildExecutions(id)
  }

  async pauseExecution(id: string): Promise<void> {
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

    const dbg = instance.engine.getDebugger()
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

    // if (instance.status !== ExecutionStatus.Paused) {
    //   throw new TRPCError({
    //     code: 'BAD_REQUEST',
    //     message: `Cannot resume execution in ${instance.status} status`,
    //   })
    // }

    const dbg = instance.engine.getDebugger()
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

    const dbg = instance.engine.getDebugger()
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

    const dbg = instance.engine.getDebugger()
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

    // if (instance.status !== ExecutionStatus.Paused) {
    //   throw new TRPCError({
    //     code: 'BAD_REQUEST',
    //     message: `Execution must be paused to step, current status is: ${instance.status}`,
    //   })
    // }

    const dbg = instance.engine.getDebugger()
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

    const dbg = instance.engine.getDebugger()
    if (!dbg) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'Debugger is not enabled for this execution',
      })
    }

    return Array.from(dbg.getState().breakpoints)
  }

  /**
   * Process external events and spawn child executions optimally
   * Groups consecutive events: [event1, event2, event1, event1, event3, event2]
   * -> [[event1, event2], [event1], [event1], [event3, event2]]
   */
  private async processExternalEvents(
    instance: ExecutionInstance,
    events: Array<{ type: string, data?: any }>,
  ): Promise<void> {
    console.log(`[processExternalEvents] Processing ${events.length} external events for execution ${instance.id}`)

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

    console.log(`[processExternalEvents] Created ${eventGroups.length} event groups from ${events.length} events`)

    // Spawn child executions for each group
    for (let i = 0; i < eventGroups.length; i++) {
      const group = eventGroups[i]
      console.log(`[processExternalEvents] Processing group ${i + 1}/${eventGroups.length} with ${group.length} events: ${group.map(e => e.type).join(', ')}`)

      // For now, spawn a child execution for each event in the group
      // TODO: In the future, we could pass multiple events to a single child execution
      for (const event of group) {
        const emittedEvent: EmittedEvent = {
          id: generateEventID(),
          type: event.type,
          data: event.data || {},
          emittedAt: Date.now(),
          emittedBy: 'external', // Mark as external event
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
      console.log(`[processEmittedEvents] No events to process`)
      return
    }

    const unprocessedEvents = context.emittedEvents.filter(e => !e.processed)
    console.log(`[processEmittedEvents] Found ${unprocessedEvents.length} unprocessed events`)

    for (const event of unprocessedEvents) {
      console.log(`[processEmittedEvents] Processing event: ${event.type}`)
      // Always spawn child execution for each event
      await this.spawnChildExecutionForEvent(instance, event)
      event.processed = true
    }
  }

  /**
   * Spawn a child execution for a specific event
   */
  private async spawnChildExecutionForEvent(
    parentInstance: ExecutionInstance,
    event: EmittedEvent,
  ): Promise<void> {
    const eventContext: EmittedEventContext = {
      eventName: event.type,
      payload: event.data,
      emittedBy: event.emittedBy,
    }

    console.log(`[spawnChildExecutionForEvent] Parent execution depth: ${parentInstance.executionDepth}`)
    console.log(`[spawnChildExecutionForEvent] Event emitted by node: ${event.emittedBy}`)
    console.log(`[spawnChildExecutionForEvent] Creating child for event: ${event.type}`)

    // Create child execution with parent's depth
    let childInstance: ExecutionInstance
    try {
      childInstance = await this.createExecution(
        await parentInstance.initialStateFlow.clone() as Flow,
        parentInstance.engine.getOptions(),
        parentInstance.context.integrations,
        parentInstance.id,
        eventContext,
        parentInstance.executionDepth,
      )
      console.log(`[spawnChildExecutionForEvent] Child execution ${childInstance.id} created at depth ${childInstance.executionDepth} for event ${event.type}`)
    } catch (error) {
      if (error instanceof Error && error.message.includes('Maximum execution depth exceeded')) {
        console.warn(`[spawnChildExecutionForEvent] Cycle detected! ${error.message}`)
        // Emit a special event to indicate cycle detection
        const parentEventQueue = this.eventQueues.get(parentInstance.id)
        if (parentEventQueue) {
          await parentEventQueue.publish(
            new ExecutionEventImpl(
              Date.now(),
              ExecutionEventEnum.FLOW_FAILED,
              new Date(),
              {
                error: new Error(`Cycle detected: ${error.message}`),
                flow: await parentInstance.flow.clone(),
                executionTime: Date.now() - parentInstance.createdAt.getTime(),
              },
            ),
          )
        }
        return
      }
      throw error
    }

    // Update event with child execution ID
    event.childExecutionId = childInstance.id

    // Get or create emitter for parent
    if (!this.childCompletionEmitters.has(parentInstance.id)) {
      this.childCompletionEmitters.set(parentInstance.id, new EventEmitter())
    }

    // Emit child execution spawned event to parent
    const parentEventQueue = this.eventQueues.get(parentInstance.id)
    console.log(`[spawnChildExecutionForEvent] Parent event queue exists: ${!!parentEventQueue}`)
    if (parentEventQueue) {
      console.log(`[spawnChildExecutionForEvent] Publishing CHILD_EXECUTION_SPAWNED event`)
      await parentEventQueue.publish(
        new ExecutionEventImpl(
          Date.now(),
          ExecutionEventEnum.CHILD_EXECUTION_SPAWNED,
          new Date(),
          {
            parentExecutionId: parentInstance.id,
            childExecutionId: childInstance.id,
            eventName: event.type,
            eventData: event.data,
          },
        ),
      )
      console.log(`[spawnChildExecutionForEvent] CHILD_EXECUTION_SPAWNED event published`)
    } else {
      console.log(`[spawnChildExecutionForEvent] WARNING: No parent event queue found for ${parentInstance.id}`)
    }

    // Start child execution asynchronously but track it
    // Don't await here to avoid blocking event processing
    this.startExecution(childInstance.id)
      .then(() => {
        console.log(`[spawnChildExecutionForEvent] Child execution ${childInstance.id} completed`)
      })
      .catch((error) => {
        console.error(`Failed to start child execution ${childInstance.id}:`, error)
        // Emit completion event even on error to prevent hanging
        const emitter = this.childCompletionEmitters.get(parentInstance.id)
        emitter?.emit('child-completed', childInstance.id)
      })
  }

  private createEventHandlers(instance: ExecutionInstance): ExecutionEventHandler<any> {
    return createExecutionEventHandler({
      [ExecutionEventEnum.FLOW_COMPLETED]: async () => {
        // Check if this is a parent execution with children
        const childIds = await this.getChildExecutions(instance.id)

        if (childIds.length > 0 && !instance.parentExecutionId) {
          // This is a parent execution with children
          // Don't mark as completed yet - we'll check again when children complete
          console.log(`Parent execution ${instance.id} has ${childIds.length} active children, deferring completion`)
          return
        }

        instance.status = ExecutionStatus.Completed
        instance.completedAt = new Date()
        await this.store.create(instance)

        // If this is a child execution completing, notify parent and check if it can complete
        if (instance.parentExecutionId) {
          console.log(`[FLOW_COMPLETED] Child execution ${instance.id} completed, notifying parent ${instance.parentExecutionId}`)

          // Emit child completion event
          const emitter = this.childCompletionEmitters.get(instance.parentExecutionId)
          emitter?.emit('child-completed', instance.id)

          const parentEventQueue = this.eventQueues.get(instance.parentExecutionId)
          console.log(`[FLOW_COMPLETED] Parent event queue exists: ${!!parentEventQueue}`)
          if (parentEventQueue) {
            const eventName = instance.context.eventData?.eventName || 'unknown'
            console.log(`[FLOW_COMPLETED] Publishing CHILD_EXECUTION_COMPLETED event for ${eventName}`)
            await parentEventQueue.publish(
              new ExecutionEventImpl(
                Date.now(),
                ExecutionEventEnum.CHILD_EXECUTION_COMPLETED,
                new Date(),
                {
                  parentExecutionId: instance.parentExecutionId,
                  childExecutionId: instance.id,
                  eventName,
                },
              ),
            )
            console.log(`[FLOW_COMPLETED] CHILD_EXECUTION_COMPLETED event published`)
          }
          await this.checkParentCompletion(instance.parentExecutionId)
        }
      },

      [ExecutionEventEnum.FLOW_FAILED]: async (data) => {
        instance.status = ExecutionStatus.Failed
        instance.completedAt = new Date()
        instance.error = {
          message: data.error.message,
        }
        await this.store.create(instance)

        // If this is a child execution failing, notify parent and check if it can complete
        if (instance.parentExecutionId) {
          console.log(`[FLOW_FAILED] Child execution ${instance.id} failed, notifying parent ${instance.parentExecutionId}`)

          // Emit child completion event
          const emitter = this.childCompletionEmitters.get(instance.parentExecutionId)
          emitter?.emit('child-completed', instance.id)

          const parentEventQueue = this.eventQueues.get(instance.parentExecutionId)
          console.log(`[FLOW_FAILED] Parent event queue exists: ${!!parentEventQueue}`)
          if (parentEventQueue) {
            const eventName = instance.context.eventData?.eventName || 'unknown'
            console.log(`[FLOW_FAILED] Publishing CHILD_EXECUTION_FAILED event for ${eventName}`)
            await parentEventQueue.publish(
              new ExecutionEventImpl(
                Date.now(),
                ExecutionEventEnum.CHILD_EXECUTION_FAILED,
                new Date(),
                {
                  parentExecutionId: instance.parentExecutionId,
                  childExecutionId: instance.id,
                  eventName,
                  error: data.error,
                },
              ),
            )
            console.log(`[FLOW_FAILED] CHILD_EXECUTION_FAILED event published`)
          }
          await this.checkParentCompletion(instance.parentExecutionId)
        }
      },

      [ExecutionEventEnum.FLOW_CANCELLED]: async () => {
        instance.status = ExecutionStatus.Stopped
        instance.completedAt = new Date()
        await this.store.create(instance)

        // If this is a child execution being cancelled, emit completion and check if parent can complete
        if (instance.parentExecutionId) {
          // Emit child completion event
          const emitter = this.childCompletionEmitters.get(instance.parentExecutionId)
          emitter?.emit('child-completed', instance.id)
          await this.checkParentCompletion(instance.parentExecutionId)
        }
      },

      [ExecutionEventEnum.FLOW_PAUSED]: async () => {
        instance.status = ExecutionStatus.Paused
        await this.store.create(instance)
      },

      [ExecutionEventEnum.FLOW_RESUMED]: async () => {
        instance.status = ExecutionStatus.Running
        await this.store.create(instance)
      },
    }, {
      // Optional error handling
      onError: (error) => {
        console.error(`Error handling execution event for instance ${instance.id}:`, error)
      },
    })
  }

  private setupEventHandling(instance: ExecutionInstance): EventQueue<ExecutionEvent> {
    const eventQueue = new EventQueue<ExecutionEvent>(100)
    this.eventQueues.set(instance.id, eventQueue)

    const eventHandler = this.createEventHandlers(instance)
    const unsubscribe = instance.engine.onAll((event) => {
      // TODO: when await for the event handlers below then it will brake the logs flushing for some reason. Investigate it later.

      eventHandler(event)
      // Publish event to queue for subscribers
      eventQueue.publish(event)

      // Persist event if event store is available
      if (this.eventStore) {
        try {
          this.eventStore.addEvent(instance.id, event)
        } catch (error) {
          console.error(`Failed to persist event for execution ${instance.id}:`, error)
        }
      }
    })

    eventQueue.onClose(async () => {
      unsubscribe()
      this.eventQueues.delete(instance.id)

      // Flush any pending events
      if (this.eventStore) {
        try {
          await this.eventStore.flushAll()
        } catch (error) {
          console.error('Failed to flush pending events:', error)
        }
      }
    })

    return eventQueue
  }

  /**
   * Get the event queue for a specific execution
   */
  getEventQueue(executionId: string): EventQueue<ExecutionEvent> | undefined {
    return this.eventQueues.get(executionId)
  }

  async dispose(id: string): Promise<void> {
    const eventQueue = this.eventQueues.get(id)
    if (eventQueue) {
      await eventQueue.close()
    }

    // Clean up child completion emitter
    const emitter = this.childCompletionEmitters.get(id)
    if (emitter) {
      emitter.removeAllListeners()
      this.childCompletionEmitters.delete(id)
    }

    await this.store.delete(id)
  }

  async shutdown(): Promise<void> {
    // Cleanup all active executions
    const executions = await this.store.list()
    await Promise.all(
      executions.map(execution => this.dispose(execution.id)),
    )
  }

  /**
   * Get child executions of a parent
   */
  async getChildExecutions(parentId: string): Promise<string[]> {
    // Return from in-memory tracking
    const childIds = this.childExecutions.get(parentId)
    return childIds ? Array.from(childIds) : []
  }

  /**
   * Wait for all child executions to complete using event emitter
   */
  async waitForChildExecutions(parentId: string): Promise<void> {
    const childIds = await this.getChildExecutions(parentId)
    if (childIds.length === 0) {
      console.log(`[waitForChildExecutions] No child executions found for parent ${parentId}`)
      return
    }

    console.log(`[waitForChildExecutions] Found ${childIds.length} child executions for parent ${parentId}`)

    const emitter = this.childCompletionEmitters.get(parentId)
    if (!emitter)
      return

    console.log(`[waitForChildExecutions] Waiting for ${childIds.length} child executions of ${parentId}`)

    // Create a promise that resolves when all children complete
    return new Promise<void>((resolve) => {
      const completedChildren = new Set<string>()

      const checkCompletion = (childId: string) => {
        completedChildren.add(childId)
        console.log(`[waitForChildExecutions] Child ${childId} completed (${completedChildren.size}/${childIds.length})`)

        if (completedChildren.size === childIds.length) {
          // All children completed
          console.log(`[waitForChildExecutions] All child executions of ${parentId} completed`)
          emitter.removeAllListeners('child-completed')
          this.childCompletionEmitters.delete(parentId)
          resolve()
        }
      }

      // Listen for child completions
      emitter.on('child-completed', checkCompletion)
    })
  }

  /**
   * Stop all child executions
   */
  async stopChildExecutions(parentId: string): Promise<void> {
    const childIds = await this.getChildExecutions(parentId)

    await Promise.all(
      childIds.map(childId => this.stopExecution(childId).catch((err) => {
        console.error(`Failed to stop child execution ${childId}:`, err)
      })),
    )
  }

  /**
   * Check if a parent execution can be completed after a child completes
   */
  private async checkParentCompletion(parentId: string): Promise<void> {
    const parentInstance = await this.getInstance(parentId)
    if (!parentInstance) {
      console.error(`Parent execution ${parentId} not found`)
      return
    }

    // Only proceed if parent is still running
    if (parentInstance.status !== ExecutionStatus.Running) {
      return
    }

    // Check if all children are completed
    const childIds = await this.getChildExecutions(parentId)
    const allChildrenCompleted = await Promise.all(
      childIds.map(async (childId) => {
        const child = await this.getInstance(childId)
        if (!child)
          return true // Child no longer exists

        return child.status === ExecutionStatus.Completed
          || child.status === ExecutionStatus.Failed
          || child.status === ExecutionStatus.Stopped
      }),
    )

    if (allChildrenCompleted.every(completed => completed)) {
      console.log(`All children of parent execution ${parentId} have completed, marking parent as completed`)

      // All children are done, complete the parent
      parentInstance.status = ExecutionStatus.Completed
      parentInstance.completedAt = new Date()
      await this.store.create(parentInstance)

      // Emit completion event for the parent
      const eventQueue = this.eventQueues.get(parentId)
      if (eventQueue) {
        await eventQueue.publish({
          index: Date.now(),
          type: ExecutionEventEnum.FLOW_COMPLETED,
          timestamp: new Date(),
          context: parentInstance.context,
          data: {
            flow: await parentInstance.flow.clone(),
            executionTime: parentInstance.completedAt.getTime() - parentInstance.createdAt.getTime(),
          },
        } as ExecutionEventImpl)
      }
    }
  }
}
