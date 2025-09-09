/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { IEdge } from '../edge'
import type { ExecutionContext } from '../execution/execution-context'
import type { INode, NodeStatusChangeEvent } from '../node'
import type { DebuggerController } from './debugger-types'
import type { ExecutionEventData } from './execution-events'
import type { Flow } from './flow'
import { z } from 'zod'
import { createExecutionEventHandler } from '../flow/execution-handlers'
import { NodeEventType, NodeStatus } from '../node'
import { EventQueue } from '../utils'
import { AsyncQueue } from '../utils/async-queue'
import { Semaphore } from '../utils/semaphore'
import { withTimeout } from '../utils/timeout'
import { FlowDebugger } from './debugger'
import { EdgeTransferService } from './edge-transfer-service'
import { ExecutionEventEnum, ExecutionEventImpl } from './execution-events'

const DEFAULT_MAX_CONCURRENCY = 100
const DEFAULT_NODE_TIMEOUT_MS = 60000
const DEFAULT_FLOW_TIMEOUT_MS = 300000

export const ExecutionCancelledReason = 'Execution cancelled'
export const ExecutionStoppedByDebugger = 'Stopped by debugger'

export const ExecutionOptionsSchema = z.object({
  execution: z.object({
    maxConcurrency: z.number().optional(),
    nodeTimeoutMs: z.number().optional(),
    flowTimeoutMs: z.number().optional(),
  }).optional(),
  debug: z.boolean().optional(),
  breakpoints: z.array(z.string()).optional(),
})

export type ExecutionOptions = z.infer<typeof ExecutionOptionsSchema>

export class ExecutionEngine {
  private readonly readyQueue: AsyncQueue<() => Promise<void>>
  private readonly completedQueue: AsyncQueue<INode>
  private readonly executingNodes: Set<string>
  private readonly completedNodes: Set<string>
  private readonly nodeDependencies: Map<string, number>
  private readonly dependentsMap: Map<string, INode[]>
  private readonly semaphore: Semaphore
  private readonly debugger: FlowDebugger | null = null
  private readonly transferService: EdgeTransferService

  // private readonly eventQueue: EventQueue<ExecutionEvent>
  private readonly eventQueue: EventQueue<ExecutionEventImpl>
  private eventIndex: number = 0
  private onEventCallback?: (context: ExecutionContext) => Promise<void>

  constructor(
    private readonly flow: Flow,
    private readonly context: ExecutionContext,
    private readonly options?: ExecutionOptions,
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
          await this.eventQueue.publish(
            this.createEvent(ExecutionEventEnum.DEBUG_BREAKPOINT_HIT, { node: node.clone() }),
          )
          onBreakpointHit?.(node)
        },
      )
    }

    // Initialize the transfer service with the flow
    this.transferService = new EdgeTransferService(this.flow)
  }

  async execute(
    onComplete?: (context: ExecutionContext, eventQueue: EventQueue<ExecutionEventImpl>) => Promise<void>,
  ): Promise<void> {
    // Handle context NODE_DEBUG_LOG_STRING events and send it to execution events queue
    const contextEventsQueueCancel
      = this.context.getEventsQueue().subscribe(createExecutionEventHandler({
        [ExecutionEventEnum.NODE_DEBUG_LOG_STRING]: async (data) => {
          await this.eventQueue.publish(
            this.createEvent(ExecutionEventEnum.NODE_DEBUG_LOG_STRING, data),
          )
        },
      }))

    const startTime = Date.now()
    try {
      // Emit flow started event
      await this.eventQueue.publish(
        this.createEvent(ExecutionEventEnum.FLOW_STARTED, { flowMetadata: { ...this.flow.metadata } }),
      )

      // Initialize dependency tracking
      await this.initializeDependencies()

      // Start worker processes
      const workerPromises = this.startWorkers()

      // Start main execution process
      await this.runMainExecutionProcess()

      // Clean up
      this.readyQueue.close()
      this.completedQueue.close()

      // Wait for all workers to complete
      await Promise.all(workerPromises)

      console.log(`[ExecutionEngine] All workers completed successfully, total nodes executed: ${this.completedNodes.size}`)

      // Emit flow completed event
      await this.eventQueue.publish(this.createEvent(ExecutionEventEnum.FLOW_COMPLETED, {
        flowMetadata: this.flow.metadata,
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
          flowMetadata: this.flow.metadata,
          reason: this.context.abortSignal.reason ?? ExecutionCancelledReason,
          executionTime: Date.now() - startTime,
        }))
      } else {
        // Emit flow failed event
        await this.eventQueue.publish(this.createEvent(ExecutionEventEnum.FLOW_FAILED, {
          flowMetadata: this.flow.metadata,
          error: error as Error,
          executionTime: Date.now() - startTime,
        }))
      }

      return Promise.reject(error)
    } finally {
      await this.eventQueue.close()
      contextEventsQueueCancel()

      if (onComplete) {
        await onComplete(this.context, this.eventQueue)
      }
    }
  }

  private async initializeDependencies(): Promise<void> {
    for (const node of this.flow.nodes.values()) {
      // Initialize dependency counts
      const incomingEdges = this.flow.getIncomingEdges(node)
      this.nodeDependencies.set(node.id, incomingEdges.length)

      // TODO: index for parent nodes
      // Get children nodes
      const children = Array.from(this.flow.nodes.values())
        .filter(n => n.metadata.parentNodeId === node.id)
      if (children.length > 0) {
        const currentNodeDependencies = this.nodeDependencies.get(node.id) ?? 0
        this.nodeDependencies.set(node.id, currentNodeDependencies + children.length)
      }

      // Build dependents map
      for (const edge of this.flow.getOutgoingEdges(node)) {
        if (!this.dependentsMap.has(node.id)) {
          this.dependentsMap.set(node.id, [])
        }
        this.dependentsMap.get(node.id)!.push(edge.targetNode)
      }

      // check if the node has a parent node then add it to the parent node's dependents
      const parentNodeId = node.metadata.parentNodeId
      if (parentNodeId) {
        const parentNode = this.flow.nodes.get(parentNodeId)
        if (!parentNode) {
          console.warn(`[ExecutionEngine] Parent node ${parentNodeId} for node ${node.id} not found`)
          continue
        }

        if (!this.dependentsMap.has(node.id)) {
          this.dependentsMap.set(node.id, [])
        }
        this.dependentsMap.get(node.id)!.push(parentNode)
      }
    }

    // Enqueue initial nodes (nodes with no dependencies)
    let nodesEnqueued = 0
    for (const [nodeId, dependencies] of this.nodeDependencies.entries()) {
      if (dependencies === 0) {
        const node = this.flow.nodes.get(nodeId)
        if (node) {
          // Check if node has disabledAutoExecution
          const metadata = node.metadata
          const isAutoExecutionDisabled = metadata?.flowPorts?.disabledAutoExecution === true

          // Skip nodes with disabledAutoExecution based on context
          if (isAutoExecutionDisabled) {
            if (!this.context.isChildExecution) {
              // In parent context, skip nodes with disabledAutoExecution
              console.log(`Skipping node ${node.id} - auto-execution disabled in parent context`)
              continue
            }
            // In child context with event data, only execute if this is an EventListenerNode
            // that matches the event
            if (this.context.isChildExecution && this.context.eventData) {
              const nodeType = metadata?.type
              if (nodeType !== 'EventListenerNode') {
                console.log(`Skipping node ${node.id} - not an EventListenerNode in child context`)
                continue
              }

              // Check if the event name matches the listener's event name
              const eventName = this.context.eventData.eventName
              const listenerEventName = (node as any).eventName
              if (eventName !== listenerEventName) {
                // console.log(`Skipping EventListenerNode ${node.id} - event name mismatch: expected "${listenerEventName}", got "${eventName}"`)
                continue
              }
            }
          } else {
            // For nodes WITHOUT disabledAutoExecution in child context
            // Skip them to prevent re-running the entire flow
            if (this.context.isChildExecution && this.context.eventData) {
              console.log(`Skipping node ${node.id} - regular node in event-driven child context`)
              continue
            }
          }

          this.executingNodes.add(node.id)
          this.readyQueue.enqueue(this.executeNode.bind(this, node))
          nodesEnqueued++
        }
      }
    }

    // Check if any nodes were enqueued for execution in child context
    // If no matching EventListenerNodes were found, complete execution successfully
    if (this.context.isChildExecution && this.context.eventData && nodesEnqueued === 0) {
      console.log(`[ExecutionEngine] No matching EventListenerNodes found for event "${this.context.eventData.eventName}" - completing child execution successfully`)

      // Close queues to signal completion (no error - this is normal behavior)
      this.readyQueue.close()
      this.completedQueue.close()
      return
    }

    // Emit node status changed events for initial nodes
    const promises: Promise<void>[] = []

    for (const nodeId of this.executingNodes) {
      const node = this.flow.nodes.get(nodeId)
      if (node) {
        const promise = this.eventQueue.publish(this.createEvent(ExecutionEventEnum.NODE_STATUS_CHANGED, {
          nodeId: node.id,
          oldStatus: NodeStatus.Idle,
          newStatus: NodeStatus.Initialized,
        }))

        promises.push(promise)
      }
    }

    // Wait for all initial node status changed events to be published
    await Promise.all(promises)

  //   console.log(`[ExecutionEngine] Debug state:
  // - Dependencies: ${JSON.stringify(Object.fromEntries(this.nodeDependencies), null, 2)}
  // - Dependents: ${JSON.stringify(Array.from(this.dependentsMap.entries()).map(([id, nodes]) => [id, nodes.map(n => n.id)]), null, 2)}
  // - Executing nodes: ${JSON.stringify(Array.from(this.executingNodes))}`)
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

      // Check for emitted events after node completion
      if (this.onEventCallback && this.context.emittedEvents && this.context.emittedEvents.length > 0) {
        const unprocessedEvents = this.context.emittedEvents.filter(e => !e.processed)
        if (unprocessedEvents.length > 0) {
          await this.onEventCallback(this.context)
        }
      }

      // Check if execution is complete
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
        // Check if node has disabledAutoExecution
        const metadata = dependentNode.metadata
        const isAutoExecutionDisabled = metadata?.flowPorts?.disabledAutoExecution === true

        // Skip nodes based on execution context
        let shouldSkip = false
        if (isAutoExecutionDisabled) {
          if (!this.context.isChildExecution) {
            // In parent context, skip nodes with disabledAutoExecution
            console.log(`Skipping dependent node ${dependentNode.id} - auto-execution disabled in parent context`)
            shouldSkip = true
          } else if (this.context.isChildExecution && this.context.eventData) {
            // In child context, only EventListenerNodes should have disabledAutoExecution
            const nodeType = metadata?.type
            if (nodeType !== 'EventListenerNode') {
              console.log(`Skipping dependent node ${dependentNode.id} - not an EventListenerNode in child context`)
              shouldSkip = true
            } else {
              // Check if the event name matches the listener's event name
              const eventName = this.context.eventData.eventName
              const listenerEventName = (dependentNode as any).eventName
              if (eventName !== listenerEventName) {
                // console.log(`Skipping dependent EventListenerNode ${dependentNode.id} - event name mismatch: expected "${listenerEventName}", got "${eventName}"`)
                shouldSkip = true
              }
            }
          }
        } else {
          // For nodes WITHOUT disabledAutoExecution in child context
          // Skip them if this is an event-driven child execution and they're not downstream of a listener
          if (this.context.isChildExecution && this.context.eventData) {
            // This is tricky - we need to allow nodes downstream of EventListeners to execute
            // For now, we'll let them through and rely on the initial node filtering
          }
        }

        if (shouldSkip) {
          // Mark as completed without executing so dependents can proceed
          this.completedNodes.add(dependentNode.id)
          // Need to enqueue it to the completed queue so processDependents gets called
          this.completedQueue.enqueue(dependentNode)
          continue
        }

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
      return this.eventQueue.publish(this.createEvent(ExecutionEventEnum.NODE_STATUS_CHANGED, {
        nodeId: node.id,
        oldStatus: event.oldStatus,
        newStatus: event.newStatus,
      }))
    }
    const cancel = node.on(NodeEventType.StatusChange, onStatusChange)

    try {
      const incomingEdges = this.flow.getIncomingEdges(node)
      let transferableEdges: IEdge[] = []

      if (node.shouldExecute(this.context)) {
        // Resolve which edges can actually transfer based on port-based resolution
        const { transferableEdges: resolvedEdges, unresolvedPorts } = this.resolveTransferableEdges(incomingEdges)

        // Skip if any target port cannot be resolved
        if (unresolvedPorts.length > 0) {
          await this.setNodeSkipped(node, `there are unresolved input ports`)
          return
        }

        // Store transferable edges for later use
        transferableEdges = resolvedEdges

        // Set node to executing
        node.setStatus(NodeStatus.Executing, true)
        await this.eventQueue.publish(this.createEvent(ExecutionEventEnum.NODE_STARTED, { node: node.clone() }))
      }

      // Debug point - before execution
      if (this.debugger) {
        const command = await this.debugger.waitForCommand(node)
        if (command === 'stop') {
          const error = new Error(ExecutionStoppedByDebugger)
          this.context.abortController?.abort(error) // Abort execution
          throw error
        }
      }

      // Prepare transfer functions that properly preserve context
      // Only transfer the resolvable edges, not all incoming edges
      const edgesToTransfer = node.shouldExecute(this.context) ? transferableEdges : incomingEdges
      const transferFunctions = edgesToTransfer.map((edge) => {
        return async () => {
          const transferStartTime = Date.now()
          try {
            // Use the transfer service instead of edge.transfer()
            // This ensures we always use fresh node and port instances from the flow
            const updatedEdge = await this.transferService.transfer(edge)

            // Replace the old edge with the updated one in the flow
            this.flow.replaceEdge(edge.id, updatedEdge)

            // Only publish event if the execution wasn't aborted
            if (!this.context.abortSignal.aborted) {
              await this.eventQueue.publish(this.createEvent(ExecutionEventEnum.EDGE_TRANSFER_COMPLETED, {
                serializedEdge: {
                  id: updatedEdge.id,
                  metadata: { ...updatedEdge.metadata },
                  status: updatedEdge.status,
                  sourceNodeId: updatedEdge.sourceNode.id,
                  sourcePortId: updatedEdge.sourcePort.id,
                  targetNodeId: updatedEdge.targetNode.id,
                  targetPortId: updatedEdge.targetPort.id,
                },
                transferTime: Date.now() - transferStartTime,
              }))
            }
          } catch (error) {
            // Only publish event if the execution wasn't aborted
            if (!this.context.abortSignal.aborted) {
              await this.eventQueue.publish(this.createEvent(ExecutionEventEnum.EDGE_TRANSFER_FAILED, {
                serializedEdge: {
                  id: edge.id,
                  metadata: { ...edge.metadata },
                  status: edge.status,
                  sourceNodeId: edge.sourceNode.id,
                  sourcePortId: edge.sourcePort.id,
                  targetNodeId: edge.targetNode.id,
                  targetPortId: edge.targetPort.id,
                },
                error: error as Error,
              }))
            }
            throw error // Rethrow to be caught by Promise.all
          }
        }
      })

      // Execute all transfers in parallel
      try {
        await Promise.all(transferFunctions.map(fn => fn()))
      } catch (error) {
        // If any transfer failed, skip the node
        await this.setNodeSkipped(node, 'edge transfer failed')
        return
      }

      const nodeParent = this.flow.nodes.get(node.metadata.parentNodeId ?? '')
      if (nodeParent && nodeParent.metadata.category !== 'group') {
        // If the node has a parent that is not a group, mark it completed without actually executing
        await this.setNodeCompleted(node, nodeStartTime)
        return
      }

      // check weathers node should execute
      if (!node.shouldExecute(this.context)) {
        await this.setNodeSkipped(node, 'node skipped because shouldExecute returned false')
        return
      }

      const nodeTimeoutMs = this.options?.execution?.nodeTimeoutMs ?? DEFAULT_NODE_TIMEOUT_MS

      // Track current executing node for event emission
      this.context.currentNodeId = node.id

      const { backgroundActions } = await withTimeout(
        node.executeWithSystemPorts(this.context),
        nodeTimeoutMs,
        `Node ${node.id} execution timed out after ${nodeTimeoutMs} ms.`,
      )

      const hasBackgroundActions = backgroundActions && backgroundActions.length > 0
      if (hasBackgroundActions) {
        await this.setNodeBackgrounding(node, nodeStartTime)

        let completedActions = 0
        for (const action of backgroundActions) {
          this.readyQueue.enqueue(
            () => action()
              .then(async () => {
                if (node.status !== NodeStatus.Backgrounding) {
                  return
                }

                if (++completedActions === backgroundActions.length) {
                  await this.setNodeCompleted(node, nodeStartTime)
                }
              })
              .catch(async (e) => {
                await this.setNodeError(node, e, nodeStartTime)
              }),
          )
        }
      } else {
        if (node.getFlowOutPort()?.getValue() !== true) {
          // this means the node has not completed successfully
          const error = node.getErrorPort()?.getValue()
          const errorMessage = node.getErrorMessagePort()?.getValue()
          if (error === true && errorMessage) {
            await this.setNodeError(node, new Error(errorMessage.toString()), nodeStartTime)
          } else {
            await this.setNodeError(node, new Error('node did not complete successfully'), nodeStartTime)
          }
        } else {
          await this.setNodeCompleted(node, nodeStartTime)
        }
      }
    } catch (error) {
      await this.setNodeError(node, error, nodeStartTime)
    } finally {
      cancel()
      // Clear current node ID after execution
      this.context.currentNodeId = undefined
    }
  }

  /**
   * Resolves which edges can transfer data based on port-based resolution rules:
   * - Groups edges by target port
   * - For each port, finds at least one edge that can transfer
   * - System error ports can transfer from Error status nodes
   */
  private resolveTransferableEdges(edges: IEdge[]): {
    transferableEdges: IEdge[]
    unresolvedPorts: string[]
  } {
    // Group edges by target port
    const portGroups = new Map<string, IEdge[]>()

    for (const edge of edges) {
      const portKey = `${edge.targetNode.id}:${edge.targetPort.id}`
      if (!portGroups.has(portKey)) {
        portGroups.set(portKey, [])
      }
      portGroups.get(portKey)!.push(edge)
    }

    // Find at least one transferable edge per port
    const transferableEdges: IEdge[] = []
    const unresolvedPorts: string[] = []

    for (const [portKey, portEdges] of portGroups) {
      const resolvedEdge = portEdges.find(edge => this.canEdgeTransfer(edge))
      if (resolvedEdge) {
        transferableEdges.push(resolvedEdge)
      } else {
        unresolvedPorts.push(portKey)
      }
    }

    return { transferableEdges, unresolvedPorts }
  }

  /**
   * Checks if an edge can transfer data based on source node status
   * and port type (system error ports have special rules)
   */
  private canEdgeTransfer(edge: IEdge): boolean {
    const { sourceNode, sourcePort } = edge
    const isErrorPort = sourcePort.isSystemError()

    // System error ports can transfer from Error status
    if (isErrorPort && sourceNode.status === NodeStatus.Error) {
      return true
    }

    // All ports can transfer from Completed/Backgrounding
    return sourceNode.status === NodeStatus.Completed
      || sourceNode.status === NodeStatus.Backgrounding
  }

  private async setNodeCompleted(node: INode, nodeStartTime: number): Promise<void> {
    node.setStatus(NodeStatus.Completed, true)
    await this.eventQueue.publish(this.createEvent(ExecutionEventEnum.NODE_COMPLETED, {
      node: node.clone(),
      executionTime: Date.now() - nodeStartTime,
    }))

    if (!this.completedQueue.isClosed()) {
      this.completedQueue.enqueue(node)
    }
  }

  private async setNodeBackgrounding(node: INode, nodeStartTime: number) {
    node.setStatus(NodeStatus.Backgrounding, true)
    await this.eventQueue.publish(this.createEvent(ExecutionEventEnum.NODE_BACKGROUNDED, {
      node: node.clone(),
    }))

    if (!this.completedQueue.isClosed()) {
      this.completedQueue.enqueue(node)
    }
  }

  private async setNodeSkipped(node: INode, reason: string) {
    node.setStatus(NodeStatus.Skipped, true)
    await this.eventQueue.publish(this.createEvent(ExecutionEventEnum.NODE_SKIPPED, {
      nodeId: node.id,
      reason,
    }))

    if (!this.completedQueue.isClosed()) {
      this.completedQueue.enqueue(node)
    }
  }

  private async setNodeError(node: INode, error: unknown, nodeStartTime: number) {
    node.setStatus(NodeStatus.Error, true)

    await this.eventQueue.publish(this.createEvent(ExecutionEventEnum.NODE_FAILED, {
      node: node.clone(),
      error: error as Error,
      executionTime: Date.now() - nodeStartTime,
    }))

    if (!this.completedQueue.isClosed()) {
      this.completedQueue.enqueue(node)
    }
  }

  public getDebugger(): DebuggerController | null {
    return this.debugger
  }

  public getOptions(): ExecutionOptions | undefined {
    return this.options
  }

  public on<T extends ExecutionEventEnum>(
    type: T,
    handler: (event: ExecutionEventImpl<T>) => void | Promise<void>,
  ): () => void {
    return this.eventQueue.subscribe(async (event) => {
      if (event.type === type) {
        const res = handler(event as ExecutionEventImpl<T>)
        if (res instanceof Promise) {
          await res
        }
      }
    })
  }

  public onAll(handler: (event: ExecutionEventImpl) => void | Promise<void>): () => void {
    return this.eventQueue.subscribe(handler)
  }

  /**
   * Set a callback to be called when events are emitted
   */
  public setEventCallback(callback: (context: ExecutionContext) => Promise<void>): void {
    this.onEventCallback = callback
  }

  public createEvent<T extends ExecutionEventEnum>(
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
