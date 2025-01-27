import type { IExecutionStore } from '@chaingraph/backend/execution/store/execution-store'
import type {
  ExecutionInstance,
  ExecutionOptions,
  ExecutionState,
} from '@chaingraph/backend/execution/types'
import type { ExecutionEvent, Flow } from '@chaingraph/types'
import type {
  ExecutionEventHandler,
} from '@chaingraph/types/flow/execution-handlers'
import { CleanupService } from '@chaingraph/backend/execution/services/cleanup-service'
import { ExecutionContext, ExecutionEngine, ExecutionEventEnum } from '@chaingraph/types'
import {
  createExecutionEventHandler,
} from '@chaingraph/types/flow/execution-handlers'
import { EventQueue } from '@chaingraph/types/utils/event-queue'
import { TRPCError } from '@trpc/server'
import { v4 as uuidv4 } from 'uuid'
import { ExecutionStatus } from '../types'

export class ExecutionService {
  // Keep track of event queues per execution
  private eventQueues: Map<string, EventQueue<ExecutionEvent>> = new Map()
  private readonly cleanupService: CleanupService

  constructor(
    private readonly store: IExecutionStore,
    options?: ExecutionOptions,
  ) {
    this.cleanupService = new CleanupService(store, this, options?.cleanup)

    // Start cleanup service
    this.cleanupService.start()
  }

  async createExecution(
    flow: Flow,
    options?: ExecutionOptions,
  ): Promise<ExecutionInstance> {
    const id = uuidv4()
    const abortController = new AbortController()
    const context = new ExecutionContext(flow.id, abortController)
    const engine = new ExecutionEngine(flow, context, options)

    const instance: ExecutionInstance = {
      id,
      context,
      engine,
      flow,
      status: ExecutionStatus.Created,
      createdAt: new Date(),
    }

    await this.store.create(instance)
    return instance
  }

  async getInstance(id: string): Promise<ExecutionInstance | null> {
    return this.store.get(id)
  }

  getCleanupService(): CleanupService {
    return this.cleanupService
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
      // Setup event handling
      const eventQueue = this.setupEventHandling(instance)

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

    if (instance.status !== ExecutionStatus.Running
      && instance.status !== ExecutionStatus.Paused) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: `Cannot stop execution in ${instance.status} status`,
      })
    }

    instance.context.abortController.abort('Execution stopped by user')
    instance.status = ExecutionStatus.Stopped
    await this.store.create(instance)
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

    if (instance.status !== ExecutionStatus.Paused) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: `Cannot resume execution in ${instance.status} status`,
      })
    }

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

    if (instance.status !== ExecutionStatus.Paused) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'Execution must be paused to step',
      })
    }

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

  private createEventHandlers(instance: ExecutionInstance): ExecutionEventHandler<any> {
    return createExecutionEventHandler({
      [ExecutionEventEnum.FLOW_COMPLETED]: async () => {
        instance.status = ExecutionStatus.Completed
        instance.completedAt = new Date()
        await this.store.create(instance)
      },

      [ExecutionEventEnum.FLOW_FAILED]: async (data) => {
        instance.status = ExecutionStatus.Failed
        instance.completedAt = new Date()
        instance.error = {
          message: data.error.message,
        }
        await this.store.create(instance)
      },

      [ExecutionEventEnum.FLOW_CANCELLED]: async () => {
        instance.status = ExecutionStatus.Stopped
        instance.completedAt = new Date()
        await this.store.create(instance)
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
      eventHandler(event, instance.context)
      // Publish event to queue for subscribers
      eventQueue.publish(event)
    })

    eventQueue.onClose(() => {
      unsubscribe()
      this.eventQueues.delete(instance.id)
    })

    return eventQueue
  }

  async dispose(id: string): Promise<void> {
    const eventQueue = this.eventQueues.get(id)
    if (eventQueue) {
      await eventQueue.close()
    }

    await this.store.delete(id)
  }

  async shutdown(): Promise<void> {
    this.cleanupService.stop()

    // Cleanup all active executions
    const executions = await this.store.list()
    await Promise.all(
      executions.map(execution => this.dispose(execution.id)),
    )
  }
}
