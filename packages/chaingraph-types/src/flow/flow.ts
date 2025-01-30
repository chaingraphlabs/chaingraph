import type { IEdge, INode, NodeEvent } from '@chaingraph/types'
import type {
  FlowEvent,
  NodeParentUpdatedEventData,
  NodeUIDimensionsChangedEventData,
  NodeUIEventData,
  NodeUIPositionChangedEventData,
} from '@chaingraph/types/flow/events'
import type { IFlow } from './interface'
import type { FlowMetadata } from './types'
import { Edge, NodeEventType } from '@chaingraph/types'
import {
  FlowEventType,
  newEvent,
} from '@chaingraph/types/flow/events'

import { EventQueue } from '@chaingraph/types/utils/event-queue'
import { v4 as uuidv4 } from 'uuid'

export class Flow implements IFlow {
  readonly id: string
  readonly metadata: FlowMetadata
  readonly nodes: Map<string, INode>
  readonly edges: Map<string, IEdge>
  // TODO: add known object types schemas

  // private eventEmitter = new EventEmitter()
  protected eventQueue = new EventQueue<FlowEvent>()
  private eventIndex: number = 1

  /**
   * Map to store node event handlers
   * Key: nodeId, Value: event handler function
   */
  private nodeEventHandlersCancel: Map<string, () => void> = new Map()

  constructor(metadata: Partial<FlowMetadata> = {}) {
    this.id = metadata.id || uuidv4()
    if (metadata.id !== this.id) {
      metadata.id = this.id
    }

    this.metadata = {
      name: metadata.name || 'Untitled Flow',
      description: metadata.description || '',
      createdAt: metadata.createdAt || new Date(),
      updatedAt: metadata.updatedAt || new Date(),
      ...metadata,
    }
    this.nodes = new Map()
    this.edges = new Map()
  }

  addNode(node: INode): INode {
    if (this.nodes.has(node.id)) {
      throw new Error(`Node with ID ${node.id} already exists in the flow.`)
    }
    this.nodes.set(node.id, node)

    // Create handler for this specific node
    const cancel = node.onAll((event: NodeEvent) => {
      this.handleNodeEvent(node, event)
    })

    // Store the handler and subscribe to node events
    this.nodeEventHandlersCancel.set(node.id, cancel)

    // Emit NodeAdded event
    this.emitEvent(newEvent(
      this.getNextEventIndex(),
      this.id,
      FlowEventType.NodeAdded,
      { node },
    ))

    return node
  }

  removeNode(nodeId: string): void {
    const node = this.nodes.get(nodeId)
    if (!node) {
      throw new Error(`Node with ID ${nodeId} does not exist in the flow.`)
    }

    // Unsubscribe from node events
    const cancel = this.nodeEventHandlersCancel.get(nodeId)
    if (cancel) {
      cancel()
      this.nodeEventHandlersCancel.delete(nodeId)
    }

    this.nodes.delete(nodeId)

    // Remove any edges connected to this node
    const edgesToRemove = []
    for (const [edgeId, edge] of this.edges.entries()) {
      if (edge.sourceNode.id === nodeId || edge.targetNode.id === nodeId) {
        edgesToRemove.push(edgeId)
      }
    }
    for (const edgeId of edgesToRemove) {
      this.removeEdge(edgeId)
    }

    // Emit NodeRemoved event
    // const event: FlowEvent<FlowEventType.NodeRemoved, NodeRemovedEventData> = {
    //   index: this.getNextEventIndex(),
    //   flowId: this.id,
    //   type: FlowEventType.NodeRemoved,
    //   timestamp: new Date(),
    //   data: {
    //     nodeId,
    //   },
    // }
    this.emitEvent(newEvent(
      this.getNextEventIndex(),
      this.id,
      FlowEventType.NodeRemoved,
      { nodeId },
    ))
  }

  addEdge(edge: IEdge): void {
    if (this.edges.has(edge.id)) {
      throw new Error(`Edge with ID ${edge.id} already exists in the flow.`)
    }
    this.edges.set(edge.id, edge)
  }

  removeEdge(edgeId: string): void {
    const edge = this.edges.get(edgeId)
    if (!edge) {
      throw new Error(`Edge with ID ${edgeId} does not exist in the flow.`)
    }
    this.edges.delete(edgeId)

    this.emitEvent(newEvent(
      this.getNextEventIndex(),
      this.id,
      FlowEventType.EdgeRemoved,
      { edgeId },
    ))
  }

  async connectPorts(
    sourceNodeId: string,
    sourcePortId: string,
    targetNodeId: string,
    targetPortId: string,
  ): Promise<Edge> {
    const sourceNode = this.nodes.get(sourceNodeId)
    const targetNode = this.nodes.get(targetNodeId)

    if (!sourceNode) {
      throw new Error(`Source node with ID ${sourceNodeId} does not exist.`)
    }
    if (!targetNode) {
      throw new Error(`Target node with ID ${targetNodeId} does not exist.`)
    }

    const sourcePort = sourceNode.getPort(sourcePortId)
    const targetPort = targetNode.getPort(targetPortId)

    if (!sourcePort) {
      throw new Error(`Source port with ID ${sourcePortId} does not exist on node ${sourceNodeId}.`)
    }
    if (!targetPort) {
      throw new Error(`Target port with ID ${targetPortId} does not exist on node ${targetNodeId}.`)
    }

    // TODO: Check dead loops

    // Optionally check for port compatibility here

    const edge = new Edge(
      uuidv4(),
      sourceNode,
      sourcePort,
      targetNode,
      targetPort,
    )
    await edge.initialize()
    this.addEdge(edge)

    this.emitEvent(newEvent(
      this.getNextEventIndex(),
      this.id,
      FlowEventType.EdgeAdded,
      {
        edgeId: edge.id,
        sourceNodeId,
        sourcePortId,
        targetNodeId,
        targetPortId,
        metadata: edge.metadata,
      },
    ))

    return edge
  }

  async validate(): Promise<boolean> {
    // Validate all nodes and edges
    for (const node of this.nodes.values()) {
      const valid = await node.validate()
      if (!valid) {
        return false
      }
    }

    for (const edge of this.edges.values()) {
      const valid = await edge.validate()
      if (!valid) {
        return false
      }
    }

    return true
  }

  public getIncomingEdges(node: INode): IEdge[] {
    return [...this.edges.values()].filter(edge => edge.targetNode.id === node.id)
  }

  public getOutgoingEdges(node: INode): IEdge[] {
    return [...this.edges.values()].filter(edge => edge.sourceNode.id === node.id)
  }

  async dispose(): Promise<void> {
    // Unsubscribe from all node events
    for (const [nodeId, cancel] of this.nodeEventHandlersCancel) {
      const node = this.nodes.get(nodeId)
      if (node) {
        cancel()
      }
    }
    this.nodeEventHandlersCancel.clear()

    // Clear all nodes and edges
    this.nodes.clear()
    this.edges.clear()
    await this.eventQueue.close()

    return Promise.resolve()
  }

  /**
   * Emit a flow event
   * @param event The event to emit
   */
  private emitEvent<T extends FlowEvent>(event: T): Promise<void> {
    return this.eventQueue.publish(event)
  }

  /**
   * Subscribe to flow events
   * @param handler The event handler
   */
  public onEvent(handler: (event: FlowEvent) => void): () => void {
    return this.eventQueue.subscribe(handler)
  }

  /**
   * Generate a new event index
   */
  private getNextEventIndex(): number {
    return this.eventIndex++
  }

  /**
   * Handle events emitted by nodes
   * @param node The node emitting the event
   * @param nodeEvent The event emitted by the node
   */
  private handleNodeEvent = (node: INode, nodeEvent: NodeEvent): void => {
    // Map node events to flow events
    let flowEvent: FlowEvent | null = null

    switch (nodeEvent.type) {
      case NodeEventType.UIPositionChange:
        {
          const nodeUIPositionEventData: NodeUIPositionChangedEventData = {
            nodeId: node.id,
            oldPosition: (nodeEvent as any).oldPosition,
            newPosition: (nodeEvent as any).newPosition,
            version: nodeEvent.version,
          }

          flowEvent = newEvent(
            this.getNextEventIndex(),
            this.id,
            this.mapNodeUIEventToFlowEvent(nodeEvent.type),
            nodeUIPositionEventData,
          )
        }
        break

      case NodeEventType.ParentChange:
        {
          const nodeUpdatedEventData: NodeParentUpdatedEventData = {
            nodeId: node.id,
            oldParentNodeId: (nodeEvent as any).oldParentNodeId,
            newParentNodeId: (nodeEvent as any).newParentNodeId,
            oldPosition: (nodeEvent as any).oldPosition,
            newPosition: (nodeEvent as any).newPosition,
            version: nodeEvent.version,
          }

          flowEvent = newEvent(
            this.getNextEventIndex(),
            this.id,
            this.mapNodeUIEventToFlowEvent(nodeEvent.type),
            nodeUpdatedEventData,
          )
        }
        break

      case NodeEventType.UIDimensionsChange:
        {
        // Handle node dimensions change event
          const nodeUIDimensionsEventData: NodeUIDimensionsChangedEventData = {
            nodeId: node.id,
            oldDimensions: (nodeEvent as any).oldDimensions,
            newDimensions: (nodeEvent as any).newDimensions,
            version: nodeEvent.version,
          }
          flowEvent = newEvent(
            this.getNextEventIndex(),
            this.id,
            this.mapNodeUIEventToFlowEvent(nodeEvent.type),
            nodeUIDimensionsEventData,
          )
        }
        break

      case NodeEventType.StatusChange:
      case NodeEventType.UIStateChange:
      case NodeEventType.UIStyleChange:
      {
        const nodeUIEventData: NodeUIEventData = {
          nodeId: node.id,
          oldValue: (nodeEvent as any).oldValue,
          newValue: (nodeEvent as any).newValue,
          version: nodeEvent.version,
        }
        flowEvent = newEvent(
          this.getNextEventIndex(),
          this.id,
          this.mapNodeUIEventToFlowEvent(nodeEvent.type),
          nodeUIEventData,
        )

        break
      }

      // Handle other node events if needed

      default:
        // Ignore other events
        break
    }

    if (flowEvent) {
      this.emitEvent(flowEvent)
    }
  }

  /**
   * Map node UI event types to flow event types
   */
  private mapNodeUIEventToFlowEvent(nodeEventType: NodeEventType): FlowEventType {
    switch (nodeEventType) {
      case NodeEventType.ParentChange:
        return FlowEventType.NodeParentUpdated
      case NodeEventType.UIPositionChange:
        return FlowEventType.NodeUIPositionChanged
      case NodeEventType.UIDimensionsChange:
        return FlowEventType.NodeUIDimensionsChanged
      case NodeEventType.UIStateChange:
        return FlowEventType.NodeUIStateChanged
      case NodeEventType.UIStyleChange:
        return FlowEventType.NodeUIStyleChanged
      default:
        throw new Error(`Unsupported node event type: ${nodeEventType}`)
    }
  }
}
