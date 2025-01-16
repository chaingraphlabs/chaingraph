import type { DebuggerController } from '@chaingraph/types/flow/debugger-types'
import type {
  AllExecutionEvents,
  ExecutionEvent,
  ExecutionEventData,
} from '@chaingraph/types/flow/execution-events'
import type { INode, NodeStatusChangeEvent } from '../node'
import type { ExecutionContext } from './execution-context'
import type { Flow } from './flow'
import { FlowDebugger } from '@chaingraph/types/flow/debugger'
import { ExecutionEventEnum } from '@chaingraph/types/flow/execution-events'
import { NodeStatus } from '@chaingraph/types/node/node-enums'
import { EventQueue } from '@chaingraph/types/utils/event-queue'
import { NodeEventType } from '../node'
import { AsyncQueue } from '../utils/async-queue'
import { Semaphore } from '../utils/semaphore'
import { withTimeout } from '../utils/timeout'

const DEFAULT_MAX_CONCURRENCY = 10
const DEFAULT_NODE_TIMEOUT_MS = 60000
const DEFAULT_FLOW_TIMEOUT_MS = 300000

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
  private readonly readyQueue: AsyncQueue<INode>
  private readonly completedQueue: AsyncQueue<INode>
  private readonly executingNodes: Set<string>
  private readonly completedNodes: Set<string>
  private readonly nodeDependencies: Map<string, number>
  private readonly dependentsMap: Map<string, INode[]>
  private readonly semaphore: Semaphore
  private readonly debugger: FlowDebugger | null = null

  private readonly eventQueue: EventQueue<AllExecutionEvents>
  private eventIndex: number = 0

  constructor(
    private readonly flow: Flow,
    private readonly context: ExecutionContext,
    private readonly options?: ExecutionEngineOptions,
  ) {
    this.readyQueue = new AsyncQueue<INode>()
    this.completedQueue = new AsyncQueue<INode>()
    this.executingNodes = new Set()
    this.completedNodes = new Set()
    this.nodeDependencies = new Map()
    this.dependentsMap = new Map()
    this.semaphore = new Semaphore(this.options?.execution?.maxConcurrency || DEFAULT_MAX_CONCURRENCY)
    this.eventQueue = new EventQueue<AllExecutionEvents>()

    if (options?.debug) {
      this.debugger = new FlowDebugger(
        async (node) => {
          this.eventQueue.publish(
            this.createEvent(ExecutionEventEnum.DEBUG_BREAKPOINT_HIT, { node }),
          )
        },
      )
    }
  }

  protected createEvent<T extends ExecutionEventEnum>(
    type: T,
    data: ExecutionEventData[T],
  ): ExecutionEvent<T> {
    return {
      index: this.eventIndex++,
      type,
      timestamp: new Date(),
      context: this.context,
      data,
    }
  }

  async execute(): Promise<void> {
    const startTime = Date.now()
    try {
      // Emit flow started event
      // this.eventEmitter.emit(ExecutionEventEnum.FLOW_STARTED, { flow: this.flow })
      this.eventQueue.publish(
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
      this.eventQueue.publish(this.createEvent(ExecutionEventEnum.FLOW_COMPLETED, {
        flow: this.flow,
        executionTime: Date.now() - startTime,
      }))
    } catch (error) {
      // Ensure queues are closed on error
      this.readyQueue.close()
      this.completedQueue.close()
      this.context.abortController.abort()

      // check if execution was cancelled or failed
      if (this.context.abortSignal.aborted) {
        // Emit flow cancelled event
        this.eventQueue.publish(this.createEvent(ExecutionEventEnum.FLOW_CANCELLED, {
          flow: this.flow,
          reason: 'Execution cancelled',
          executionTime: Date.now() - startTime,
        }))
      } else {
        // Emit flow failed event
        this.eventQueue.publish(this.createEvent(ExecutionEventEnum.FLOW_FAILED, {
          flow: this.flow,
          error: error as Error,
          executionTime: Date.now() - startTime,
        }))
      }

      throw error
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
          this.readyQueue.enqueue(node)
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
    const maxConcurrency = this.options?.execution?.maxConcurrency || DEFAULT_MAX_CONCURRENCY
    const workerPromises: Promise<void>[] = []

    for (let i = 0; i < maxConcurrency; i++) {
      workerPromises.push(
        this.workerLoop().catch((error) => {
          this.context.abortController.abort()
          throw error
        }),
      )
    }

    return workerPromises
  }

  private async runMainExecutionProcess(): Promise<void> {
    const startTime = Date.now()
    const flowTimeoutMs = this.options?.execution?.flowTimeoutMs || DEFAULT_FLOW_TIMEOUT_MS

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
      throw new Error(this.context.abortSignal.reason || 'Execution cancelled')
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
    const dependents = this.dependentsMap.get(completedNode.id) || []

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
        this.readyQueue.enqueue(dependentNode)
      }
    }
  }

  private async workerLoop(): Promise<void> {
    while (!this.context.abortSignal.aborted) {
      // Wait for a node to become available
      const node = await this.readyQueue.dequeue(this.context.abortSignal)
      if (!node)
        break // Queue closed or execution aborted

      const onStatusChange = (event: NodeStatusChangeEvent) => {
        this.eventQueue.publish(this.createEvent(ExecutionEventEnum.NODE_STATUS_CHANGED, {
          node,
          oldStatus: event.oldStatus,
          newStatus: event.newStatus,
        }))
      }
      const cancel = node.on(NodeEventType.StatusChange, onStatusChange)

      try {
        await this.semaphore.acquire()
        await this.executeNode(node)
        // Add to completed queue
        this.completedQueue.enqueue(node)
      } catch (error) {
        // Release semaphore on error
        if (this.context.abortSignal.aborted) {
          break
        }
        throw error
      } finally {
        this.semaphore.release()
        cancel()
      }
    }
  }

  private async executeNode(node: INode): Promise<void> {
    if (this.context.abortSignal.aborted) {
      throw new Error(this.context.abortSignal.reason || 'Execution cancelled')
    }
    const nodeStartTime = Date.now()

    try {
      this.eventQueue.publish(this.createEvent(ExecutionEventEnum.NODE_STARTED, { node }))

      node.setStatus(NodeStatus.Executing)

      // Debug point - before execution
      if (this.debugger) {
        const command = await this.debugger.waitForCommand(node)
        if (command === 'stop') {
          this.eventQueue.publish(this.createEvent(ExecutionEventEnum.FLOW_CANCELLED, {
            flow: this.flow,
            reason: 'Stopped by debugger',
            executionTime: Date.now() - nodeStartTime,
          }))

          this.context.abortController.abort('Execution stopped by debugger') // Abort execution
          throw new Error('Execution stopped by debugger')
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

      const nodeTimeoutMs = this.options?.execution?.nodeTimeoutMs || DEFAULT_NODE_TIMEOUT_MS
      await withTimeout(
        node.execute(this.context),
        nodeTimeoutMs,
        `Node ${node.id} execution timed out after ${nodeTimeoutMs} ms.`,
      )

      node.setStatus(NodeStatus.Completed)
      this.eventQueue.publish(this.createEvent(ExecutionEventEnum.NODE_COMPLETED, {
        node,
        executionTime: Date.now() - nodeStartTime,
      }))
    } catch (error) {
      node.setStatus(NodeStatus.Error)

      this.eventQueue.publish(this.createEvent(ExecutionEventEnum.NODE_FAILED, {
        node,
        error: error as Error,
        executionTime: Date.now() - nodeStartTime,
      }))
      throw error
    }
  }

  public getDebugger(): DebuggerController | null {
    return this.debugger
  }

  public on<T extends ExecutionEventEnum>(
    type: T,
    handler: (event: ExecutionEvent<T>) => void,
  ): () => void {
    return this.eventQueue.subscribe((event) => {
      if (event.type === type) {
        handler(event as ExecutionEvent<T>)
      }
    })
  }

  public onAll(handler: (event: AllExecutionEvents) => void): () => void {
    return this.eventQueue.subscribe(handler)
  }
}
