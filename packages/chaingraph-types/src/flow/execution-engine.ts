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

  // Port-level resolution tracking (using composite keys "nodeId:portId")
  private readonly resolvedPorts: Set<string> = new Set()
  private readonly sourcePortToWaitingNodes: Map<string, Set<string>> = new Map()
  private readonly nodeInputPorts: Map<string, Set<string>> = new Map()
  private readonly portEdgeSources: Map<string, Set<string>> = new Map()

  // Event-bound node tracking for EventListener scopes
  private readonly eventListenerNodeIds: Set<string> = new Set()
  private readonly eventBoundNodes: Set<string> = new Set()
  // Maps event-bound node ID to the set of event names it's associated with
  private readonly eventBoundNodeEvents: Map<string, Set<string>> = new Map()

  // private readonly eventQueue: EventQueue<ExecutionEvent>
  private readonly eventQueue: EventQueue<ExecutionEventImpl>
  private eventIndex: number = 0
  private onEventCallback?: (context: ExecutionContext) => Promise<void>
  private pendingEventPublishes: Promise<void>[] = []

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
          await this.publishEventTracked(ExecutionEventEnum.DEBUG_BREAKPOINT_HIT, { node: node.clone() })
          onBreakpointHit?.(node)
        },
      )
    }

    // Initialize the transfer service with the flow
    this.transferService = new EdgeTransferService(this.flow)

    // Set up node lookup functions for context
    this.context.getNodeById = (nodeId: string) => this.flow.nodes.get(nodeId)
    this.context.findNodes = (predicate: (node: INode) => boolean) => {
      return Array.from(this.flow.nodes.values()).filter(predicate)
    }

    // Set up port resolution callback
    this.context.setOnPortResolved(this.handlePortResolved.bind(this))
  }

  /**
   * Helper to create composite port key for flow-level uniqueness.
   * Port IDs are only unique within a node, so we use "nodeId:portId" format.
   */
  private portKey(nodeId: string, portId: string): string {
    return `${nodeId}:${portId}`
  }

  /**
   * Handle port resolution event from execution context.
   * When a port is resolved, check if any waiting nodes can now execute.
   *
   * @param nodeId The node ID that resolved the port
   * @param portId The port ID that was resolved
   */
  private handlePortResolved(nodeId: string, portId: string): void {
    const key = this.portKey(nodeId, portId)
    if (this.resolvedPorts.has(key)) {
      return // Already resolved
    }
    this.resolvedPorts.add(key)

    // Find all nodes waiting on this source port
    const waitingNodes = this.sourcePortToWaitingNodes.get(key)
    if (!waitingNodes) {
      return
    }

    for (const waitingNodeId of waitingNodes) {
      if (this.isNodeReady(waitingNodeId)) {
        const node = this.flow.nodes.get(waitingNodeId)
        if (node && !this.executingNodes.has(waitingNodeId) && !this.completedNodes.has(waitingNodeId)) {
          this.executingNodes.add(waitingNodeId)
          this.readyQueue.enqueue(this.executeNode.bind(this, node))
        }
      }
    }
  }

  /**
   * Check if all input ports of a node have at least one resolved source.
   *
   * @param nodeId The node ID to check
   * @returns true if all input ports are resolved, false otherwise
   */
  private isNodeReady(nodeId: string): boolean {
    const inputPortKeys = this.nodeInputPorts.get(nodeId)
    if (!inputPortKeys || inputPortKeys.size === 0) {
      return true // No inputs = ready
    }

    for (const targetPortKey of inputPortKeys) {
      const sourcePorts = this.portEdgeSources.get(targetPortKey)
      if (!sourcePorts || sourcePorts.size === 0) {
        continue
      }

      // Need ALL sources to be resolved for this input port
      const allSourcesResolved = Array.from(sourcePorts).every(
        sourceKey => this.resolvedPorts.has(sourceKey),
      )
      if (!allSourcesResolved) {
        return false
      }
    }
    return true
  }

  /**
   * Identifies all nodes that are "event-bound" - meaning they are part of
   * an EventListener chain and should only execute when the corresponding
   * event is triggered.
   *
   * Algorithm:
   * 1. Find all EventListener nodes and their event names
   * 2. Traverse BACKWARDS from each EventListener to mark all upstream nodes
   * 3. Traverse FORWARDS from each EventListener to mark downstream nodes
   *    (and their upstream dependencies like nodeF)
   * 4. Track which events each event-bound node is associated with
   */
  private identifyEventBoundNodes(): void {
    // Step 1: Identify all EventListener nodes and their event names
    for (const [nodeId, node] of this.flow.nodes) {
      const nodeType = node.metadata?.type
      if (nodeType === 'EventListenerNode' || nodeType === 'EventListenerNodeV2') {
        this.eventListenerNodeIds.add(nodeId)
        this.eventBoundNodes.add(nodeId)
        // Track event name for this listener
        const eventName = (node as any).eventName as string
        if (eventName) {
          if (!this.eventBoundNodeEvents.has(nodeId)) {
            this.eventBoundNodeEvents.set(nodeId, new Set())
          }
          this.eventBoundNodeEvents.get(nodeId)!.add(eventName)
        }
      }
    }

    // Step 2: Traverse backwards from EventListeners to mark upstream nodes
    for (const listenerId of this.eventListenerNodeIds) {
      const listenerNode = this.flow.nodes.get(listenerId)
      const eventName = listenerNode ? (listenerNode as any).eventName as string : undefined
      this.markUpstreamNodesAsEventBound(listenerId, new Set(), eventName)
    }

    // Step 3: Traverse forwards from EventListeners to mark downstream nodes
    // This also marks upstream dependencies of downstream nodes (like nodeF)
    for (const listenerId of this.eventListenerNodeIds) {
      const listenerNode = this.flow.nodes.get(listenerId)
      const eventName = listenerNode ? (listenerNode as any).eventName as string : undefined
      this.markDownstreamNodesAsEventBound(listenerId, new Set(), eventName)
    }
  }

  /**
   * Recursively marks all upstream nodes (nodes that feed into this node) as event-bound
   * and associates them with the given event name.
   *
   * @param skipEventListeners - When true, stops at EventListener nodes without marking them.
   *   This is used when marking upstream from downstream nodes to avoid marking other
   *   EventListeners that happen to feed into the same downstream node.
   */
  private markUpstreamNodesAsEventBound(nodeId: string, visited: Set<string>, eventName?: string, skipEventListeners = false): void {
    if (visited.has(nodeId))
      return // Prevent infinite loops
    visited.add(nodeId)

    const node = this.flow.nodes.get(nodeId)
    if (!node)
      return

    // Get all incoming edges to find upstream nodes
    const incomingEdges = this.flow.getIncomingEdges(node)

    for (const edge of incomingEdges) {
      const sourceNodeId = edge.sourceNode.id
      const sourceNode = this.flow.nodes.get(sourceNodeId)

      // Skip EventListener nodes when called from downstream traversal
      // This prevents marking other EventListeners that share a downstream node
      if (skipEventListeners && sourceNode) {
        const sourceNodeType = sourceNode.metadata?.type
        if (sourceNodeType === 'EventListenerNode' || sourceNodeType === 'EventListenerNodeV2') {
          continue
        }
      }

      this.eventBoundNodes.add(sourceNodeId)
      // Track event name association for this node
      if (eventName) {
        if (!this.eventBoundNodeEvents.has(sourceNodeId)) {
          this.eventBoundNodeEvents.set(sourceNodeId, new Set())
        }
        this.eventBoundNodeEvents.get(sourceNodeId)!.add(eventName)
      }
      // Recursively mark sources of source
      this.markUpstreamNodesAsEventBound(sourceNodeId, visited, eventName, skipEventListeners)
    }
  }

  /**
   * Recursively marks all downstream nodes (nodes fed by this node) as event-bound.
   * Also marks upstream dependencies of those downstream nodes (catches nodes like nodeF
   * that feed into downstream nodes but aren't directly connected to EventListener).
   */
  private markDownstreamNodesAsEventBound(nodeId: string, visited: Set<string>, eventName?: string): void {
    if (visited.has(nodeId))
      return
    visited.add(nodeId)

    const node = this.flow.nodes.get(nodeId)
    if (!node)
      return

    // Get all outgoing edges to find downstream nodes
    const outgoingEdges = this.flow.getOutgoingEdges(node)

    for (const edge of outgoingEdges) {
      const targetNodeId = edge.targetNode.id

      // Mark downstream node as event-bound
      this.eventBoundNodes.add(targetNodeId)
      if (eventName) {
        if (!this.eventBoundNodeEvents.has(targetNodeId)) {
          this.eventBoundNodeEvents.set(targetNodeId, new Set())
        }
        this.eventBoundNodeEvents.get(targetNodeId)!.add(eventName)
      }

      // Mark upstream feeder nodes of this downstream node (catches nodeF)
      // Skip EventListeners to avoid marking other event chains that share this downstream
      this.markUpstreamNodesAsEventBound(targetNodeId, new Set([nodeId]), eventName, true)

      // Recursively process further downstream nodes
      this.markDownstreamNodesAsEventBound(targetNodeId, visited, eventName)
    }
  }

  /**
   * Checks if an event-bound node should execute for the given event name
   */
  private isEventBoundNodeForEvent(nodeId: string, eventName: string): boolean {
    const associatedEvents = this.eventBoundNodeEvents.get(nodeId)
    return associatedEvents ? associatedEvents.has(eventName) : false
  }

  async execute(
    onComplete?: (context: ExecutionContext, eventQueue: EventQueue<ExecutionEventImpl>) => Promise<void>,
  ): Promise<void> {
    // Handle context NODE_DEBUG_LOG_STRING events and send it to execution events queue
    const contextEventsQueueCancel
      = this.context.getEventsQueue().subscribe(createExecutionEventHandler({
        [ExecutionEventEnum.NODE_DEBUG_LOG_STRING]: async (data) => {
          await this.publishEventTracked(ExecutionEventEnum.NODE_DEBUG_LOG_STRING, data)
        },
      }))

    const startTime = Date.now()
    try {
      // Emit flow started event
      await this.publishEventTracked(ExecutionEventEnum.FLOW_STARTED, { flowMetadata: { ...this.flow.metadata } })

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

      // Emit flow completed event
      await this.publishEventTracked(ExecutionEventEnum.FLOW_COMPLETED, {
        flowMetadata: this.flow.metadata,
        executionTime: Date.now() - startTime,
      })
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
        await this.publishEventTracked(ExecutionEventEnum.FLOW_CANCELLED, {
          flowMetadata: this.flow.metadata,
          reason: this.context.abortSignal.reason ?? ExecutionCancelledReason,
          executionTime: Date.now() - startTime,
        })
      } else {
        // Emit flow failed event
        await this.publishEventTracked(ExecutionEventEnum.FLOW_FAILED, {
          flowMetadata: this.flow.metadata,
          error: error as Error,
          executionTime: Date.now() - startTime,
        })
      }

      return Promise.reject(error)
    } finally {
      // Wait for all pending event publishes to complete
      if (this.pendingEventPublishes.length > 0) {
        await Promise.allSettled(this.pendingEventPublishes)
      }

      // NOW close the event queue - all events are in!
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

      // Build port-level dependency tracking
      const inputPortKeys = new Set<string>()
      for (const edge of incomingEdges) {
        const targetPortKey = this.portKey(edge.targetNode.id, edge.targetPort.id)
        const sourcePortKey = this.portKey(edge.sourceNode.id, edge.sourcePort.id)

        // Track input ports for this node
        inputPortKeys.add(targetPortKey)

        // Track which sources can satisfy each target port
        if (!this.portEdgeSources.has(targetPortKey)) {
          this.portEdgeSources.set(targetPortKey, new Set())
        }
        this.portEdgeSources.get(targetPortKey)!.add(sourcePortKey)

        // Track which nodes are waiting for each source port (reverse mapping)
        if (!this.sourcePortToWaitingNodes.has(sourcePortKey)) {
          this.sourcePortToWaitingNodes.set(sourcePortKey, new Set())
        }
        this.sourcePortToWaitingNodes.get(sourcePortKey)!.add(edge.targetNode.id)
      }

      // Store input ports for this node
      if (inputPortKeys.size > 0) {
        this.nodeInputPorts.set(node.id, inputPortKeys)
      }

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

    // Identify event-bound nodes (nodes upstream of EventListeners)
    this.identifyEventBoundNodes()

    // Enqueue initial nodes (nodes with no dependencies)
    let nodesEnqueued = 0
    for (const [nodeId, dependencies] of this.nodeDependencies.entries()) {
      if (dependencies === 0) {
        const node = this.flow.nodes.get(nodeId)
        if (node) {
          const metadata = node.metadata
          const isAutoExecutionDisabled = metadata?.flowPorts?.disabledAutoExecution === true
          const isEventBound = this.eventBoundNodes.has(nodeId)

          // ┌─────────────────────────────────────────────────────────────────────┐
          // │ EXECUTION RULES:                                                     │
          // │                                                                       │
          // │ WITH eventData (child spawn OR external API event):                   │
          // │   • EventListeners → execute if event name matches                    │
          // │   • Event-bound nodes → execute if upstream of matching listener      │
          // │   • Regular nodes → skip (only event chains execute)                  │
          // │                                                                       │
          // │ WITHOUT eventData (normal root execution):                            │
          // │   • EventListeners → skip (no event to listen for)                    │
          // │   • Event-bound nodes → skip (they feed EventListeners)               │
          // │   • Regular nodes → execute normally                                  │
          // └─────────────────────────────────────────────────────────────────────┘
          if (this.context.eventData) {
            const incomingEventName = this.context.eventData.eventName
            if (isAutoExecutionDisabled) {
              // EventListener nodes: must match event name
              const nodeType = metadata?.type
              if (nodeType !== 'EventListenerNode' && nodeType !== 'EventListenerNodeV2') {
                continue
              }
              const listenerEventName = (node as any).eventName
              if (incomingEventName !== listenerEventName) {
                continue
              }
            } else if (isEventBound) {
              // Event-bound upstream nodes: only if associated with this event
              if (!this.isEventBoundNodeForEvent(nodeId, incomingEventName)) {
                continue
              }
            } else {
              // Regular nodes: skip in event-driven execution
              continue
            }
          } else {
            // Normal execution: skip all event-related nodes
            if (isAutoExecutionDisabled || isEventBound) {
              continue
            }
          }

          this.executingNodes.add(node.id)
          this.readyQueue.enqueue(this.executeNode.bind(this, node))
          nodesEnqueued++
        }
      }
    }

    // If no nodes were enqueued for execution, complete gracefully
    // This can happen in root context when all nodes are event-bound,
    // or in child context when no EventListeners match the event
    if (nodesEnqueued === 0) {
      this.readyQueue.close()
      this.completedQueue.close()
      return
    }

    // Emit node status changed events for initial nodes
    const promises: Promise<void>[] = []

    for (const nodeId of this.executingNodes) {
      const node = this.flow.nodes.get(nodeId)
      if (node) {
        const promise = this.publishEventTracked(ExecutionEventEnum.NODE_STATUS_CHANGED, {
          nodeId: node.id,
          oldStatus: NodeStatus.Idle,
          newStatus: NodeStatus.Initialized,
        })

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
    // Handle parent-child relationships
    const parentNodeId = completedNode.metadata.parentNodeId
    if (parentNodeId) {
      const remainingChildren = (this.nodeDependencies.get(parentNodeId) ?? 1) - 1
      this.nodeDependencies.set(parentNodeId, remainingChildren)

      // Check if parent is now ready (all children complete + all input ports resolved)
      if (remainingChildren === 0) {
        const parentNode = this.flow.nodes.get(parentNodeId)
        if (parentNode && this.isNodeReady(parentNodeId)) {
          if (!this.executingNodes.has(parentNodeId) && !this.completedNodes.has(parentNodeId)) {
            this.executingNodes.add(parentNodeId)
            this.readyQueue.enqueue(this.executeNode.bind(this, parentNode))
          }
        }
      }
    }

    // Handle event-driven execution rules
    const dependents = this.dependentsMap.get(completedNode.id) ?? []

    for (const dependentNode of dependents) {
      if (this.context.abortSignal.aborted)
        break

      // Check if node should be skipped due to event-driven execution rules
      const metadata = dependentNode.metadata
      const isAutoExecutionDisabled = metadata?.flowPorts?.disabledAutoExecution === true
      const isEventBound = this.eventBoundNodes.has(dependentNode.id)

      let shouldSkip = false

      if (this.context.eventData) {
        const incomingEventName = this.context.eventData.eventName
        if (isAutoExecutionDisabled) {
          const nodeType = metadata?.type
          if (nodeType !== 'EventListenerNode' && nodeType !== 'EventListenerNodeV2') {
            shouldSkip = true
          } else {
            const listenerEventName = (dependentNode as any)?.eventName
            if (incomingEventName !== listenerEventName) {
              shouldSkip = true
            }
          }
        } else if (isEventBound) {
          if (!this.isEventBoundNodeForEvent(dependentNode.id, incomingEventName)) {
            shouldSkip = true
          }
        } else {
          shouldSkip = true
        }
      } else {
        if (isAutoExecutionDisabled || isEventBound) {
          shouldSkip = true
        }
      }

      if (shouldSkip) {
        // Mark as completed without executing so their dependents can proceed
        this.completedNodes.add(dependentNode.id)
        this.completedQueue.enqueue(dependentNode)
      }

      // NOTE: Actual dependency checking happens via port resolution
      // handlePortResolved() is called when ports resolve and enqueues ready nodes
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
      // Use tracked publish to ensure this event is captured
      this.publishEventTracked(ExecutionEventEnum.NODE_STATUS_CHANGED, {
        nodeId: node.id,
        oldStatus: event.oldStatus,
        newStatus: event.newStatus,
      })
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
        await this.publishEventTracked(ExecutionEventEnum.NODE_STARTED, { node: node.clone() })
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
              await this.publishEventTracked(ExecutionEventEnum.EDGE_TRANSFER_COMPLETED, {
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
              })
            }
          } catch (error) {
            // Only publish event if the execution wasn't aborted
            if (!this.context.abortSignal.aborted) {
              await this.publishEventTracked(ExecutionEventEnum.EDGE_TRANSFER_FAILED, {
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
              })
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

        console.log(`[ExecutionEngine] Node ${node.id} has parent ${nodeParent.id} which is not a group. Marking node as completed without execution:`, JSON.stringify(node.serialize(), null, 2))
        console.log(`[ExecutionEngine] Node ${node.id} has parent ${nodeParent.id} which is not a group. Marking node as completed without execution:`, JSON.stringify(nodeParent.serialize(), null, 2))

        // find in the parent node the port which contains:
        // "nodeSchemaCapture": {
        //   "enabled": true,
        //   "capturedNodeId": THE CURRENT NODE ID
        // }
        // and mark this port as resolved
        nodeParent.findPort((port) => {
          const portConfig = port.getConfig()
          // is object port
          if (!portConfig.type || portConfig.type !== 'object') {
            return false
          }

          const nodeSchemaCapture = portConfig.ui?.nodeSchemaCapture
          if (nodeSchemaCapture && nodeSchemaCapture.enabled === true && nodeSchemaCapture.capturedNodeId === node.id) {
            this.handlePortResolved(nodeParent.id, port.id)
            return true
          }
          return false
        })

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

      // Execute node (no background actions in new design)
      await withTimeout(
        node.executeWithSystemPorts(this.context),
        nodeTimeoutMs,
        `Node ${node.id} execution timed out after ${nodeTimeoutMs} ms.`,
      )

      // Check if execution succeeded based on flowOut port
      if (node.getFlowOutPort()?.getValue() !== true) {
        // Node did not complete successfully
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
   * Checks if an edge can transfer data based on port-level resolution.
   * A port can transfer if it has been explicitly resolved via context.resolvePort()
   * or auto-resolved when the node completed.
   */
  private canEdgeTransfer(edge: IEdge): boolean {
    const sourceKey = this.portKey(edge.sourceNode.id, edge.sourcePort.id)
    return this.resolvedPorts.has(sourceKey)
  }

  private async setNodeCompleted(node: INode, nodeStartTime: number): Promise<void> {
    // Auto-resolve all non-error output/passthrough ports that weren't already resolved
    for (const port of node.ports.values()) {
      const config = port.getConfig()
      const direction = config.direction
      const isErrorPort = config.metadata?.portCategory === 'error'
      const isOutputOrPassthrough = direction === 'output' || direction === 'passthrough'

      if (isOutputOrPassthrough && !isErrorPort) {
        const key = this.portKey(node.id, port.id)
        if (!this.resolvedPorts.has(key)) {
          this.handlePortResolved(node.id, port.id)
        }
      }
    }

    node.setStatus(NodeStatus.Completed, true)
    await this.publishEventTracked(ExecutionEventEnum.NODE_COMPLETED, {
      node: node.clone(),
      executionTime: Date.now() - nodeStartTime,
    })

    if (!this.completedQueue.isClosed()) {
      this.completedQueue.enqueue(node)
    }
  }

  private async setNodeSkipped(node: INode, reason: string) {
    node.setStatus(NodeStatus.Skipped, true)
    await this.publishEventTracked(ExecutionEventEnum.NODE_SKIPPED, {
      nodeId: node.id,
      reason,
    })

    if (!this.completedQueue.isClosed()) {
      this.completedQueue.enqueue(node)
    }
  }

  private async setNodeError(node: INode, error: unknown, nodeStartTime: number) {
    // Resolve error ports when node errors
    const errorPort = node.getErrorPort()
    const errorMessagePort = node.getErrorMessagePort()
    if (errorPort) {
      this.handlePortResolved(node.id, errorPort.id)
    }
    if (errorMessagePort) {
      this.handlePortResolved(node.id, errorMessagePort.id)
    }

    node.setStatus(NodeStatus.Error, true)

    await this.publishEventTracked(ExecutionEventEnum.NODE_FAILED, {
      node: node.clone(),
      error: error as Error,
      executionTime: Date.now() - nodeStartTime,
    })

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

  // Helper method to publish and track event promises
  private async publishEventTracked<T extends ExecutionEventEnum>(
    type: T,
    data: ExecutionEventData[T],
  ): Promise<void> {
    const promise = this.eventQueue.publish(
      this.createEvent(type, data),
    )
    this.pendingEventPublishes.push(promise)

    try {
      await promise
    } finally {
      // Remove from pending list after completion
      const index = this.pendingEventPublishes.indexOf(promise)
      if (index > -1) {
        this.pendingEventPublishes.splice(index, 1)
      }
    }
  }
}
