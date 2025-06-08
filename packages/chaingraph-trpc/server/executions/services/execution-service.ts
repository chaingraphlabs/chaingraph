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
  IntegrationContext,
} from '@badaitech/chaingraph-types'
import type { IExecutionStore } from '../store/execution-store'
import type { ExecutionInstance, ExecutionOptions, ExecutionState } from '../types'
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

export class ExecutionService {
  // Keep track of event queues per execution
  private eventQueues: Map<string, EventQueue<ExecutionEventImpl>> = new Map()
  // Keep track of child executions
  private childExecutions: Map<string, Set<string>> = new Map() // parentId -> Set<childId>

  constructor(
    private readonly store: IExecutionStore,
  ) {}

  async createExecution(
    flow: Flow,
    options?: ExecutionOptions,
    integrations?: IntegrationContext,
    parentExecutionId?: string,
    eventData?: EmittedEventContext,
  ): Promise<ExecutionInstance> {
    const clonedFlow = flow.clone() as Flow

    const id = generateExecutionID()
    const abortController = new AbortController()
    const context = new ExecutionContext(
      clonedFlow.id,
      abortController,
      undefined,
      id,
      integrations,
      parentExecutionId,
      eventData,
      !!parentExecutionId, // isChildExecution
    )

    // Enable event support for all executions
    if (!context.emittedEvents) {
      context.emittedEvents = []
    }
    const engine = new ExecutionEngine(clonedFlow, context, options)

    const instance: ExecutionInstance = {
      id,
      context,
      engine,
      flow: clonedFlow,
      status: ExecutionStatus.Created,
      createdAt: new Date(),
      parentExecutionId,
    }

    // Set up event callback for parent executions
    if (!parentExecutionId) {
      engine.setEventCallback(async (ctx) => {
        await this.processEmittedEvents(instance)
      })
    }

    await this.store.create(instance)

    // Setup event queue immediately for parent executions
    // This ensures the queue exists when subscriptions are created
    if (!parentExecutionId) {
      this.setupEventHandling(instance)
    }

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

  async startExecution(id: string): Promise<void> {
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

      // Update instance state
      instance.status = ExecutionStatus.Running
      instance.startedAt = new Date()
      await this.store.create(instance)

      // Start execution
      await instance.engine.execute()

      // Cleanup
      await eventQueue.close()
    } catch (error) {
      instance.status = ExecutionStatus.Failed
      instance.error = {
        message: error instanceof Error ? error.message : 'Unknown error',
      }
      await this.store.create(instance)

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
   * Process emitted events and spawn child executions
   */
  async processEmittedEvents(instance: ExecutionInstance): Promise<void> {
    const context = instance.context
    console.log(`[processEmittedEvents] Checking for events in execution ${instance.id}`)
    console.log(`[processEmittedEvents] emittedEvents:`, context.emittedEvents)
    
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
    }

    // Create child execution
    const childInstance = await this.createExecution(
      parentInstance.flow,
      parentInstance.engine.getOptions(),
      parentInstance.context.integrations,
      parentInstance.id,
      eventContext,
    )
    console.log(`Spawning child execution ${childInstance.id} for event ${event.type}`)

    // Update event with child execution ID
    event.childExecutionId = childInstance.id

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
          }
        )
      )
      console.log(`[spawnChildExecutionForEvent] CHILD_EXECUTION_SPAWNED event published`)
    } else {
      console.log(`[spawnChildExecutionForEvent] WARNING: No parent event queue found for ${parentInstance.id}`)
    }

    // Start child execution asynchronously
    this.startExecution(childInstance.id).catch((error) => {
      console.error(`Failed to start child execution ${childInstance.id}:`, error)
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
          const parentEventQueue = this.eventQueues.get(instance.parentExecutionId)
          if (parentEventQueue) {
            const eventName = instance.context.eventData?.eventName || 'unknown'
            await parentEventQueue.publish(
              new ExecutionEventImpl(
                Date.now(),
                ExecutionEventEnum.CHILD_EXECUTION_COMPLETED,
                new Date(),
                {
                  parentExecutionId: instance.parentExecutionId,
                  childExecutionId: instance.id,
                  eventName,
                }
              )
            )
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
          const parentEventQueue = this.eventQueues.get(instance.parentExecutionId)
          if (parentEventQueue) {
            const eventName = instance.context.eventData?.eventName || 'unknown'
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
                }
              )
            )
          }
          await this.checkParentCompletion(instance.parentExecutionId)
        }
      },

      [ExecutionEventEnum.FLOW_CANCELLED]: async () => {
        instance.status = ExecutionStatus.Stopped
        instance.completedAt = new Date()
        await this.store.create(instance)

        // If this is a child execution being cancelled, check if parent can complete
        if (instance.parentExecutionId) {
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
    const eventQueue = new EventQueue<ExecutionEvent>(200)
    this.eventQueues.set(instance.id, eventQueue)

    const eventHandler = this.createEventHandlers(instance)
    const unsubscribe = instance.engine.onAll((event) => {
      eventHandler(event)
      // Publish event to queue for subscribers
      eventQueue.publish(event)
    })

    eventQueue.onClose(() => {
      unsubscribe()
      this.eventQueues.delete(instance.id)
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
   * Get all child executions for a parent execution
   */
  async getChildExecutions(parentId: string): Promise<string[]> {
    const childIds = this.childExecutions.get(parentId)
    return childIds ? Array.from(childIds) : []
  }

  /**
   * Wait for all child executions to complete
   */
  async waitForChildExecutions(parentId: string, timeoutMs: number = 30000): Promise<void> {
    const childIds = await this.getChildExecutions(parentId)
    if (childIds.length === 0)
      return

    const startTime = Date.now()

    // Poll for completion
    while (Date.now() - startTime < timeoutMs) {
      const allCompleted = await Promise.all(
        childIds.map(async (childId) => {
          const instance = await this.getInstance(childId)
          if (!instance)
            return true // Child no longer exists

          return instance.status === ExecutionStatus.Completed
            || instance.status === ExecutionStatus.Failed
            || instance.status === ExecutionStatus.Stopped
        }),
      )

      if (allCompleted.every(completed => completed)) {
        return
      }

      // Wait a bit before checking again
      await new Promise(resolve => setTimeout(resolve, 100))
    }

    throw new Error(`Timeout waiting for child executions of ${parentId}`)
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
            flow: parentInstance.flow.clone(),
            executionTime: parentInstance.completedAt.getTime() - parentInstance.createdAt.getTime(),
          },
        } as any)
      }
    }
  }
}
