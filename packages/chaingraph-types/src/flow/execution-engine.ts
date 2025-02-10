/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { ExecutionContext } from '../execution/execution-context'
import type { INode, NodeStatusChangeEvent } from '../node'
import type { DebuggerController } from './debugger-types'
import type { ExecutionEventData } from './execution-events'
import type { Flow } from './flow'
import { NodeEventType, NodeStatus } from '../node'
import { EventQueue } from '../utils'
import { AsyncQueue } from '../utils/async-queue'
import { Semaphore } from '../utils/semaphore'
import { withTimeout } from '../utils/timeout'
import { FlowDebugger } from './debugger'
import { ExecutionEventEnum, ExecutionEventImpl } from './execution-events'

const DEFAULT_MAX_CONCURRENCY = 10
const DEFAULT_NODE_TIMEOUT_MS = 60000
const DEFAULT_FLOW_TIMEOUT_MS = 300000

export const ExecutionCancelledReason = 'Execution cancelled'
export const ExecutionStoppedByDebugger = 'Stopped by debugger'

export interface ExecutionOptions {
  maxConcurrency?: number
  nodeTimeoutMs?: number
  flowTimeoutMs?: number
}

export interface ExecutionEngineOptions {
  execution?: ExecutionOptions
  debug?: boolean
}

export class ExecutionEngine {
  private readonly readyQueue: AsyncQueue<() => Promise<void>>
  private readonly completedQueue: AsyncQueue<INode>
  private readonly executingNodes: Set<string>
  private readonly completedNodes: Set<string>
  private readonly nodeDependencies: Map<string, number>
  private readonly dependentsMap: Map<string, INode[]>
  private readonly semaphore: Semaphore
  private readonly debugger: FlowDebugger | null = null

  // private readonly eventQueue: EventQueue<ExecutionEvent>
  private readonly eventQueue: EventQueue<ExecutionEventImpl>
  private eventIndex: number = 0

  constructor(
    private readonly flow: Flow,
    private readonly context: ExecutionContext,
    private readonly options?: ExecutionEngineOptions,
    onBreakpointHit?: (node: INode) => void,
  ) {
    this.readyQueue = new AsyncQueue()
    this.completedQueue = new AsyncQueue<INode>()
    this.executingNodes = new Set()
    this.completedNodes = new Set()
    this.nodeDependencies = new Map()
    this.dependentsMap = new Map()
    this.semaphore = new Semaphore(this.options?.execution?.maxConcurrency ?? DEFAULT_MAX_CONCURRENCY)
    this.eventQueue = new EventQueue<ExecutionEventImpl>()

    if (options?.debug) {
      this.debugger = new FlowDebugger(
        async (node) => {
          this.eventQueue.publish(
            this.createEvent(ExecutionEventEnum.DEBUG_BREAKPOINT_HIT, { node }),
          )
          onBreakpointHit?.(node)
        },
      )
    }
  }

  async execute(): Promise<void> {
    const startTime = Date.now()
    try {
      // Emit flow started event
      // this.eventEmitter.emit(ExecutionEventEnum.FLOW_STARTED, { flow: this.flow })
      await this.eventQueue.publish(
        this.createEvent(ExecutionEventEnum.FLOW_STARTED, { flow: this.flow }),
      )

      // Initialize dependency tracking
      this.initializeDependencies()

      // Start worker processes
      const workerPromises = this.startWorkers()

      // Start main execution process
      await this.runMainExecutionProcess()

      // Clean up
      this.readyQueue.close()
      this.completedQueue.close()

      // Wait for all workers to complete
      await Promise.all(workerPromises)

      // Emit flow completed event
      await this.eventQueue.publish(this.createEvent(ExecutionEventEnum.FLOW_COMPLETED, {
        flow: this.flow,
        executionTime: Date.now() - startTime,
      }))
    } catch (error) {
      // Ensure queues are closed on error
      this.readyQueue.close()
      this.completedQueue.close()
      this.context.abortController?.abort()

      const isAborted = this.context.abortSignal.aborted
      const isAbortedDueToError
        = isAborted && this.context.abortSignal.reason instanceof Error

      const isAbortedDueToDebugger = isAborted && this.context.abortSignal.reason instanceof Error
        && this.context.abortSignal.reason.message === ExecutionStoppedByDebugger

      // check if execution was cancelled or failed
      if (this.context.abortSignal.aborted && (!isAbortedDueToError || isAbortedDueToDebugger)) {
        // Emit flow cancelled event
        await this.eventQueue.publish(this.createEvent(ExecutionEventEnum.FLOW_CANCELLED, {
          flow: this.flow,
          reason: this.context.abortSignal.reason ?? ExecutionCancelledReason,
          executionTime: Date.now() - startTime,
        }))
      } else {
        // Emit flow failed event
        await this.eventQueue.publish(this.createEvent(ExecutionEventEnum.FLOW_FAILED, {
          flow: this.flow,
          error: error as Error,
          executionTime: Date.now() - startTime,
        }))
      }

      return Promise.reject(error)
    } finally {
      await this.eventQueue.close()
    }
  }

  private initializeDependencies(): void {
    // Initialize dependency counts
    for (const node of this.flow.nodes.values()) {
      const incomingEdges = this.flow.getIncomingEdges(node)
      this.nodeDependencies.set(node.id, incomingEdges.length)
    }

    // Build dependents map
    for (const node of this.flow.nodes.values()) {
      for (const edge of this.flow.getOutgoingEdges(node)) {
        if (!this.dependentsMap.has(node.id)) {
          this.dependentsMap.set(node.id, [])
        }
        this.dependentsMap.get(node.id)!.push(edge.targetNode)
      }
    }

    // Enqueue initial nodes (nodes with no dependencies)
    for (const [nodeId, dependencies] of this.nodeDependencies.entries()) {
      if (dependencies === 0) {
        const node = this.flow.nodes.get(nodeId)
        if (node) {
          this.executingNodes.add(node.id)
          this.readyQueue.enqueue(this.executeNode.bind(this, node))
        }
      }
    }

    // Emit node status changed events for initial nodes
    for (const nodeId of this.executingNodes) {
      const node = this.flow.nodes.get(nodeId)
      if (node) {
        this.eventQueue.publish(this.createEvent(ExecutionEventEnum.NODE_STATUS_CHANGED, {
          node,
          oldStatus: NodeStatus.Idle,
          newStatus: NodeStatus.Initialized,
        }))
      }
    }
  }

  private startWorkers(): Promise<void>[] {
    const maxConcurrency = this.options?.execution?.maxConcurrency ?? DEFAULT_MAX_CONCURRENCY
    const workerPromises: Promise<void>[] = []

    for (let i = 0; i < maxConcurrency; i++) {
      workerPromises.push(
        this.workerLoop().catch((error) => {
          this.context.abortController?.abort(error)
          throw error // TODO: do we need to throw here?
        }),
      )
    }

    return workerPromises
  }

  private async runMainExecutionProcess(): Promise<void> {
    const startTime = Date.now()
    const flowTimeoutMs = this.options?.execution?.flowTimeoutMs ?? DEFAULT_FLOW_TIMEOUT_MS

    while (!this.context.abortSignal.aborted) {
      // Check for timeout
      if (Date.now() - startTime > flowTimeoutMs) {
        throw new Error(`Flow execution timed out after ${flowTimeoutMs} ms`)
      }

      // Wait for a completed node
      const completedNode = await this.completedQueue.dequeue(this.context.abortSignal)
      if (!completedNode)
        break // Queue closed or execution aborted

      // Update execution state
      this.executingNodes.delete(completedNode.id)
      this.completedNodes.add(completedNode.id)

      // Process dependents and potentially enqueue new nodes
      await this.processDependents(completedNode)

      // Check if execution is complete based on the new requirements
      if (await this.isExecutionComplete()) {
        break
      }
    }

    if (this.context.abortSignal.aborted) {
      if (this.context.abortSignal.reason instanceof Error) {
        throw this.context.abortSignal.reason
      }
      throw new Error(this.context.abortSignal.reason ?? ExecutionCancelledReason)
    }
  }

  private async isExecutionComplete(): Promise<boolean> {
    // First, check if there are any nodes currently executing
    if (this.executingNodes.size > 0) {
      return false
    }

    // Then check if there are any nodes ready for execution
    const hasReadyNodes = !this.readyQueue.isEmpty()
    return !hasReadyNodes
  }

  private async processDependents(completedNode: INode): Promise<void> {
    const dependents = this.dependentsMap.get(completedNode.id) ?? []

    for (const dependentNode of dependents) {
      if (this.context.abortSignal.aborted)
        break

      // Skip if node is already completed or executing
      // TODO: Do we really need this check?
      // if (this.completedNodes.has(dependentNode.id)
      //   || this.executingNodes.has(dependentNode.id)) {
      //   continue
      // }

      const remainingDeps = this.nodeDependencies.get(dependentNode.id)! - 1
      this.nodeDependencies.set(dependentNode.id, remainingDeps)

      if (remainingDeps === 0) {
        // Node is ready for execution
        this.executingNodes.add(dependentNode.id)
        this.readyQueue.enqueue(this.executeNode.bind(this, dependentNode))
      }
    }
  }

  private async workerLoop(): Promise<void> {
    while (!this.context.abortSignal.aborted) {
      // Wait for a workload to become available
      const workload = await this.readyQueue.dequeue(this.context.abortSignal)
      if (!workload) {
        break // Queue closed or execution aborted
      }

      try {
        await this.semaphore.acquire()
        await workload()
      } catch (error) {
        // Release semaphore on error
        if (this.context.abortSignal.aborted && !(this.context.abortSignal.reason instanceof Error)) {
          break
        }

        throw error
      } finally {
        this.semaphore.release()
      }
    }
  }

  private async executeNode(node: INode): Promise<void> {
    if (this.context.abortSignal.aborted) {
      throw new Error(this.context.abortSignal.reason || 'Execution cancelled')
    }
    const nodeStartTime = Date.now()

    const onStatusChange = (event: NodeStatusChangeEvent) => {
      this.eventQueue.publish(this.createEvent(ExecutionEventEnum.NODE_STATUS_CHANGED, {
        node,
        oldStatus: event.oldStatus,
        newStatus: event.newStatus,
      }))
    }
    const cancel = node.on(NodeEventType.StatusChange, onStatusChange)

    try {
      this.eventQueue.publish(this.createEvent(ExecutionEventEnum.NODE_STARTED, { node }))

      node.setStatus(NodeStatus.Executing, true)

      // Debug point - before execution
      if (this.debugger) {
        const command = await this.debugger.waitForCommand(node)
        if (command === 'stop') {
          const error = new Error(ExecutionStoppedByDebugger)
          this.context.abortController?.abort(error) // Abort execution
          throw error
        }
      }

      // Transfer data from incoming edges
      for (const edge of this.flow.getIncomingEdges(node)) {
        const transferStartTime = Date.now()
        this.eventQueue.publish(this.createEvent(ExecutionEventEnum.EDGE_TRANSFER_STARTED, { edge }))

        try {
          await edge.transfer()
        } catch (error) {
          this.eventQueue.publish(this.createEvent(ExecutionEventEnum.EDGE_TRANSFER_FAILED, {
            edge,
            error: error as Error,
          }))
          throw error
        }
        this.eventQueue.publish(this.createEvent(ExecutionEventEnum.EDGE_TRANSFER_COMPLETED, {
          edge,
          transferTime: Date.now() - transferStartTime,
        }))
      }

      const nodeTimeoutMs = this.options?.execution?.nodeTimeoutMs ?? DEFAULT_NODE_TIMEOUT_MS
      const { backgroundActions } = await withTimeout(
        node.execute(this.context),
        nodeTimeoutMs,
        `Node ${node.id} execution timed out after ${nodeTimeoutMs} ms.`,
      )

      const hasBackgroundActions = backgroundActions && backgroundActions.length > 0
      if (hasBackgroundActions) {
        let completedActions = 0
        for (const action of backgroundActions) {
          this.readyQueue.enqueue(
            () => action()
              .then(() => {
                if (node.status !== NodeStatus.Backgrounding) {
                  return
                }

                if (++completedActions === backgroundActions.length) {
                  this.setNodeCompleted(node, nodeStartTime)
                }
              })
              .catch(e => this.setNodeError(node, e, nodeStartTime)),
          )
        }

        node.setStatus(NodeStatus.Backgrounding, true)
        this.eventQueue.publish(this.createEvent(ExecutionEventEnum.NODE_BACKGROUNDED, {
          node,
        }))
      } else {
        this.setNodeCompleted(node, nodeStartTime)
      }

      this.completedQueue.enqueue(node)
    } catch (error) {
      this.setNodeError(node, error, nodeStartTime)
    } finally {
      cancel()
    }
  }

  private setNodeCompleted(node: INode, nodeStartTime: number) {
    node.setStatus(NodeStatus.Completed, true)
    this.eventQueue.publish(this.createEvent(ExecutionEventEnum.NODE_COMPLETED, {
      node,
      executionTime: Date.now() - nodeStartTime,
    }))
  }

  private setNodeError(node: INode, error: unknown, nodeStartTime: number) {
    node.setStatus(NodeStatus.Error, true)

    this.eventQueue.publish(this.createEvent(ExecutionEventEnum.NODE_FAILED, {
      node,
      error: error as Error,
      executionTime: Date.now() - nodeStartTime,
    }))

    throw error
  }

  public getDebugger(): DebuggerController | null {
    return this.debugger
  }

  public on<T extends ExecutionEventEnum>(
    type: T,
    handler: (event: ExecutionEventImpl<T>) => void,
  ): () => void {
    return this.eventQueue.subscribe((event) => {
      if (event.type === type) {
        handler(event as ExecutionEventImpl<T>)
      }
    })
  }

  public onAll(handler: (event: ExecutionEventImpl) => void): () => void {
    return this.eventQueue.subscribe(handler)
  }

  // protected createEvent<T extends ExecutionEventEnum>(
  //   type: T,
  //   data: ExecutionEventData[T],
  // ): ExecutionEvent<T> {
  //   return {
  //     index: this.eventIndex++,
  //     type,
  //     timestamp: new Date(),
  //     context: this.context,
  //     data,
  //   }
  // }
  protected createEvent<T extends ExecutionEventEnum>(
    type: T,
    data: ExecutionEventData[T],
  ): ExecutionEventImpl<T> {
    return new ExecutionEventImpl(
      this.eventIndex++,
      type,
      new Date(),
      data,
    )
  }
}
