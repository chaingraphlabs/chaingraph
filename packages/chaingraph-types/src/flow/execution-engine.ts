import type { INode } from '../node'
import type { ExecutionContext } from './execution-context'
import type { ExecutionOptions, Flow } from './flow'
import { AsyncQueue } from '../utils/async-queue'
import { Semaphore } from '../utils/semaphore'
import { withTimeout } from '../utils/timeout'

const DEFAULT_MAX_CONCURRENCY = 10
const DEFAULT_NODE_TIMEOUT_MS = 60000
const DEFAULT_FLOW_TIMEOUT_MS = 300000

export class ExecutionEngine {
  private readonly readyQueue: AsyncQueue<INode>
  private readonly completedQueue: AsyncQueue<INode>
  private readonly executingNodes: Set<string>
  private readonly completedNodes: Set<string>
  private readonly nodeDependencies: Map<string, number>
  private readonly dependentsMap: Map<string, INode[]>
  private readonly semaphore: Semaphore

  constructor(
    private readonly flow: Flow,
    private readonly context: ExecutionContext,
    private readonly options?: ExecutionOptions,
  ) {
    this.readyQueue = new AsyncQueue<INode>()
    this.completedQueue = new AsyncQueue<INode>()
    this.executingNodes = new Set()
    this.completedNodes = new Set()
    this.nodeDependencies = new Map()
    this.dependentsMap = new Map()
    this.semaphore = new Semaphore(this.options?.maxConcurrency || DEFAULT_MAX_CONCURRENCY)
  }

  async execute(): Promise<void> {
    try {
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
    } catch (error) {
      // Ensure queues are closed on error
      this.readyQueue.close()
      this.completedQueue.close()
      this.context.abortController.abort()
      throw error
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
  }

  private startWorkers(): Promise<void>[] {
    const maxConcurrency = this.options?.maxConcurrency || DEFAULT_MAX_CONCURRENCY
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
    const flowTimeoutMs = this.options?.flowTimeoutMs || DEFAULT_FLOW_TIMEOUT_MS

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

      try {
        await this.semaphore.acquire()
        await this.executeNode(node)
        // Add to completed queue
        this.completedQueue.enqueue(node)
      } finally {
        this.semaphore.release()
      }
    }
  }

  private async executeNode(node: INode): Promise<void> {
    if (this.context.abortSignal.aborted) {
      throw new Error('Execution cancelled')
    }

    try {
      node.setStatus('executing')

      // Transfer data from incoming edges
      for (const edge of this.flow.getIncomingEdges(node)) {
        await edge.transfer()
      }

      const nodeTimeoutMs = this.options?.nodeTimeoutMs || DEFAULT_NODE_TIMEOUT_MS
      await withTimeout(
        node.execute(this.context),
        nodeTimeoutMs,
        `Node ${node.id} execution timed out after ${nodeTimeoutMs} ms.`,
      )

      node.setStatus('completed')
    } catch (error) {
      node.setStatus('error')
      throw error
    }
  }
}
