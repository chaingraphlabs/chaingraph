/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { IEdge } from '../edge'
import type { INode, NodeEvent, PortUpdateEvent } from '../node'
import type { IPort } from '../port'
import type { JSONValue } from '../utils/json'
import type {
  FlowEvent,
  NodeParentUpdatedEventData,
  NodeUIChangedEventData,
  NodeUIDimensionsChangedEventData,
  NodeUIPositionChangedEventData,
  PortCreatedEventData,
  PortRemovedEventData,
  PortUpdatedEventData,
} from './events'
import type { IFlow } from './interface'
import type { FlowMetadata } from './types'
import { customAlphabet } from 'nanoid'
import { nolookalikes } from 'nanoid-dictionary'
import { NodeRegistry } from '../decorator'
import { Edge } from '../edge'
import { filterPorts, NodeEventType } from '../node'
import { deepCopy, EventQueue } from '../utils'
import {
  FlowEventType,
  newEvent,
} from './events'
import { PropagationEngine } from './propagation'

function generateFlowID(): string {
  return `V2${customAlphabet(nolookalikes, 24)()}`
}

function generateEdgeID(): string {
  return `ED${customAlphabet(nolookalikes, 18)()}`
}

export class Flow implements IFlow {
  readonly id: string
  readonly metadata: FlowMetadata
  readonly nodes: Map<string, INode>
  readonly edges: Map<string, IEdge>

  // TODO: store nodes as adjacency list
  // TODO: add known object types schemas
  // TODO: split implementation into multiple files

  // private eventEmitter = new EventEmitter()
  protected eventQueue = new EventQueue<FlowEvent>()
  private eventIndex: number = 1

  private readonly cancelGlobalHandler: () => void

  /**
   * Flag to indicate if the flow is currently disabled for propagation events
   * @protected
   */
  private _isDisabledPropagationEvents: boolean = false

  /**
   * Map to store node event handlers
   * Key: nodeId, Value: event handler function
   */
  private nodeEventHandlersCancel: Map<string, () => void> = new Map()

  /**
   * Propagation engine for handling flow events
   */
  private propagationEngine = new PropagationEngine()

  constructor(metadata: Partial<FlowMetadata> = {}) {
    this.id = metadata.id || generateFlowID()
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

    // Subscribe to all flow events
    this.cancelGlobalHandler = this.onEvent(async (flowEvent: FlowEvent): Promise<void> => {
      if (this._isDisabledPropagationEvents) {
        // If the flow is currently executing, skip handling the event
        return
      }

      return this.propagationEngine.handleEvent(flowEvent, this).then(() => {})
    })
  }

  addNodeSync(node: INode): INode {
    if (this.nodes.has(node.id)) {
      throw new Error(`Node with ID ${node.id} already exists in the flow.`)
    }
    this.nodes.set(node.id, node)

    // Create handler for this specific node
    const cancel = node.onAll(async (event: NodeEvent) => {
      return this.handleNodeEvent(node, event)
    })

    // Store the handler and subscribe to node events
    this.nodeEventHandlersCancel.set(node.id, cancel)

    return node
  }

  async addNode(node: INode, disableEvents?: boolean): Promise<INode> {
    this.addNodeSync(node)

    // Emit NodeAdded event
    if (!disableEvents) {
      await this.emitEvent(newEvent(
        this.getNextEventIndex(),
        this.id,
        FlowEventType.NodeAdded,
        { node: node.clone() },
      ))
    }

    return node
  }

  async addNodes(nodes: INode[], disableEvents?: boolean): Promise<INode[]> {
    if (nodes.length === 0) {
      return []
    }

    const addedNodes = await Promise.all(
      nodes.map(node => this.addNode(node, disableEvents)),
    )

    // Emit NodesAdded event
    if (!disableEvents) {
      await this.emitEvent(newEvent(
        this.getNextEventIndex(),
        this.id,
        FlowEventType.NodesAdded,
        { nodes: addedNodes.map(n => n.clone()) },
      ))
    }

    return addedNodes
  }

  addNodesSync(nodes: INode[]): INode[] {
    if (nodes.length === 0) {
      return []
    }

    return nodes.map((node) => {
      return this.addNodeSync(node)
    })
  }

  async updateNode(node: INode): Promise<void> {
    if (!this.nodes.has(node.id)) {
      throw new Error(`Node with ID ${node.id} does not exist in the flow.`)
    }

    // Commit any pending batch updates before updating the node
    // This ensures all collected port updates are emitted before the flow update
    await node.commitBatchUpdate({ sourceOfUpdate: 'flow:updateNode' })

    // cancel the previous event handler if it exists
    const oldCancel = this.nodeEventHandlersCancel.get(node.id)

    this.nodes.set(node.id, node)

    const newCancel = node.onAll(async (event: NodeEvent) => {
      return this.handleNodeEvent(node, event)
    })

    if (oldCancel) {
      oldCancel()
      this.nodeEventHandlersCancel.delete(node.id)
    }

    // Store the handler and subscribe to node events
    this.nodeEventHandlersCancel.set(node.id, newCancel)

    // Emit NodeUpdated event
    return this.emitEvent(newEvent(
      this.getNextEventIndex(),
      this.id,
      FlowEventType.NodeUpdated,
      { node: node.clone() },
    ))
  }

  async removeNode(nodeId: string): Promise<void> {
    const node = this.nodes.get(nodeId)
    if (!node) {
      throw new Error(`Node with ID ${nodeId} does not exist in the flow.`)
    }

    // Commit any pending batch updates before removing the node
    await node.commitBatchUpdate({ sourceOfUpdate: 'flow:removeNode' })

    // find all child nodes and remove them
    await Promise.all(
      Array.from(this.nodes.values())
        .filter((n) => {
          return n.metadata.parentNodeId === nodeId
        })
        .map((n) => {
          return this.removeNode(n.id)
        }),
    )

    // Unsubscribe from node events
    const cancel = this.nodeEventHandlersCancel.get(nodeId)
    if (cancel) {
      cancel()
      this.nodeEventHandlersCancel.delete(nodeId)
    }

    this.nodes.delete(nodeId)

    // Remove any edges connected to this node
    const edgesToRemove: string[] = []
    for (const [edgeId, edge] of this.edges.entries()) {
      if (edge.sourceNode.id === nodeId || edge.targetNode.id === nodeId) {
        edgesToRemove.push(edgeId)
      }
    }

    // Remove edges
    await Promise.all(
      edgesToRemove.map(edgeId => this.removeEdge(edgeId)),
    )

    // Emit NodeRemoved event
    return this.emitEvent(newEvent(
      this.getNextEventIndex(),
      this.id,
      FlowEventType.NodeRemoved,
      { nodeId },
    ))
  }

  /**
   * Remove a port from a node, including all child ports and their connections
   * @param nodeId
   * @param portId
   */
  async removePort(nodeId: string, portId: string): Promise<void> {
    const node = this.nodes.get(nodeId)
    if (!node) {
      throw new Error(`Node with ID ${nodeId} does not exist in the flow.`)
    }

    const port = node.getPort(portId)
    if (!port) {
      throw new Error(`Port with ID ${portId} does not exist on node ${nodeId}.`)
    }

    // find all child ports including the port itself
    const childPorts = this.findAllChildPorts(node, portId)

    // first remove every connection to all found ports
    const promiseList: Promise<void>[] = []

    childPorts.forEach((port) => {
      for (const [edgeId, edge] of this.edges.entries()) {
        if (edge.sourceNode.id === nodeId && edge.sourcePort.id === port.id) {
          promiseList.push(this.removeEdge(edgeId))
        }
        if (edge.targetNode.id === nodeId && edge.targetPort.id === port.id) {
          promiseList.push(this.removeEdge(edgeId))
        }
      }
    })

    // then remove the ports
    childPorts.forEach((port) => {
      node.removePort(port.id)
    })

    return Promise.all(promiseList).then(() => {})
  }

  /**
   * Recursively find all child ports of a given port
   * Returns an array of all child ports including the port itself
   *
   * @param node
   * @param portId
   * @private
   */
  private findAllChildPorts(node: INode, portId: string): IPort[] {
    // recursively find all child ports
    const childPorts: IPort[] = []
    const portToFind = node.getPort(portId)
    if (!portToFind) {
      return childPorts
    }

    childPorts.push(portToFind)

    if (portToFind.getConfig().type === 'object') {
      filterPorts(node, (port) => {
        return port.getConfig().parentId === portToFind.id
      }).forEach((childPort) => {
        childPorts.push(...this.findAllChildPorts(node, childPort.id))
      })
    }

    return childPorts
  }

  addEdgeSync(edge: IEdge): void {
    if (this.edges.has(edge.id)) {
      throw new Error(`Edge with ID ${edge.id} already exists in the flow.`)
    }

    if (edge.sourcePort && edge.targetPort) {
      edge.sourcePort.addConnection(edge.targetNode.id, edge.targetPort.id)
      edge.targetPort.addConnection(edge.sourceNode.id, edge.sourcePort.id)
    }

    this.edges.set(edge.id, edge)
  }

  async addEdge(edge: IEdge, disableEvents?: boolean): Promise<void> {
    if (this.edges.has(edge.id)) {
      throw new Error(`Edge with ID ${edge.id} already exists in the flow.`)
    }

    if (edge.sourcePort && edge.targetPort) {
      edge.sourcePort.addConnection(edge.targetNode.id, edge.targetPort.id)
      edge.targetPort.addConnection(edge.sourceNode.id, edge.sourcePort.id)
    }

    if (!disableEvents) {
      await Promise.all([
        edge.targetNode.emit({
          type: NodeEventType.PortConnected,
          sourceNode: edge.targetNode.clone(),
          sourcePort: edge.targetPort.clone(),
          targetNode: edge.sourceNode.clone(),
          targetPort: edge.sourcePort.clone(),
          nodeId: edge.targetNode.id,
          timestamp: new Date(),
          version: edge.targetNode.getVersion(),
        }),

        edge.sourceNode.emit({
          type: NodeEventType.PortConnected,
          sourceNode: edge.sourceNode.clone(),
          sourcePort: edge.sourcePort.clone(),
          targetNode: edge.targetNode.clone(),
          targetPort: edge.targetPort.clone(),
          nodeId: edge.sourceNode.id,
          timestamp: new Date(),
          version: edge.sourceNode.getVersion(),
        }),
      ])
    }

    this.edges.set(edge.id, edge)
  }

  /**
   * Replace an existing edge with a new one.
   * This is useful when updating edge references after transfer.
   * @param edgeId The ID of the edge to replace
   * @param newEdge The new edge to replace with
   */
  replaceEdge(edgeId: string, newEdge: IEdge): void {
    if (!this.edges.has(edgeId)) {
      throw new Error(`Edge with ID ${edgeId} does not exist in the flow.`)
    }
    if (newEdge.id !== edgeId) {
      throw new Error(`New edge ID ${newEdge.id} does not match the edge being replaced ${edgeId}`)
    }
    this.edges.set(edgeId, newEdge)
  }

  async removeEdge(edgeId: string): Promise<void> {
    const edge = this.edges.get(edgeId)
    if (!edge) {
      throw new Error(`Edge with ID ${edgeId} does not exist in the flow.`)
    }

    const sourceNode = this.nodes.get(edge.sourceNode.id) ?? edge.sourceNode
    const targetNode = this.nodes.get(edge.targetNode.id) ?? edge.targetNode

    const sourcePort = sourceNode.getPort(edge.sourcePort.id) ?? edge.sourcePort
    const targetPort = targetNode.getPort(edge.targetPort.id) ?? edge.targetPort

    // Remove connections from ports
    if (sourcePort && targetPort) {
      sourcePort.removeConnection(targetNode.id, targetPort.id)
      targetPort.removeConnection(sourceNode.id, sourcePort.id)
    }

    // if target port is an any port type then remove the underlying type
    // if (targetPort instanceof AnyPort) {
    //   targetPort.setUnderlyingType(undefined)
    //   targetPort.setValue(undefined)
    //   targetNode.refreshAnyPortUnderlyingPorts(targetPort as IPort, true)
    // targetNode.updatePort(targetPort)
    // }

    await Promise.all([
      targetNode.emit({
        type: NodeEventType.PortDisconnected,
        sourceNode: targetNode.clone(),
        sourcePort: targetPort.clone(),
        targetNode: sourceNode.clone(),
        targetPort: sourcePort.clone(),
        nodeId: targetNode.id,
        timestamp: new Date(),
        version: targetNode.getVersion(),
      }),

      sourceNode.emit({
        type: NodeEventType.PortDisconnected,
        sourceNode: sourceNode.clone(),
        sourcePort: sourcePort.clone(),
        targetNode: targetNode.clone(),
        targetPort: targetPort.clone(),
        nodeId: sourceNode.id,
        timestamp: new Date(),
        version: sourceNode.getVersion(),
      }),
    ])

    this.edges.delete(edgeId)

    return this.emitEvent(newEvent(
      this.getNextEventIndex(),
      this.id,
      FlowEventType.EdgeRemoved,
      {
        edgeId,
        sourceNodeId: edge.sourceNode.id,
        sourcePortId: edge.sourcePort.id,
        targetNodeId: edge.targetNode.id,
        targetPortId: edge.targetPort.id,
        metadata: edge.metadata || {},
      },
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

    // check if such connection already exists
    const existingEdge = Array.from(this.edges.values()).find((edge) => {
      return (
        edge.sourceNode.id === sourceNodeId
        && edge.sourcePort.id === sourcePortId
        && edge.targetNode.id === targetNodeId
        && edge.targetPort.id === targetPortId
      )
    })
    if (existingEdge) {
      throw new Error(`Edge from ${sourceNodeId}:${sourcePortId} to ${targetNodeId}:${targetPortId} already exists.`)
    }

    // TODO: Check dead loops

    const edge = new Edge(
      generateEdgeID(),
      sourceNode,
      sourcePort,
      targetNode,
      targetPort,
    )

    // Edge initialization also validates the edge and port types compatibility
    await edge.initialize()
    await this.removeAllChildConnections(targetNode, targetPort)
    await this.addEdge(edge)

    // Create and emit the port update event
    sourceNode.incrementVersion()
    targetNode.incrementVersion()

    await Promise.all([
      this.updateNode(sourceNode),
      this.updateNode(targetNode),
    ])

    await this.emitEvent(newEvent(
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

  /**
   * Disconnects two nodes via their ports.
   * @param sourceNodeId The ID of the source node.
   * @param sourcePortId The ID of the source port.
   * @param targetNodeId The ID of the target node.
   * @param targetPortId The ID of the target port.
   */
  disconnectPorts(
    sourceNodeId: string,
    sourcePortId: string,
    targetNodeId: string,
    targetPortId: string,
  ): Promise<void> {
    // find edge:
    const edge = Array.from(this.edges.values()).find((edge) => {
      return (
        edge.sourceNode.id === sourceNodeId
        && edge.sourcePort.id === sourcePortId
        && edge.targetNode.id === targetNodeId
        && edge.targetPort.id === targetPortId
      )
    })

    if (!edge) {
      throw new Error(`Edge from ${sourceNodeId}:${sourcePortId} to ${targetNodeId}:${targetPortId} does not exist.`)
    }

    return this.removeEdge(edge.id)
  }

  /**
   * Recursively remove all connections to all child ports of a given port
   * @param node
   * @param port
   * @private
   */
  private async removeAllChildConnections(node: INode, port: IPort): Promise<void> {
    // iterates over port children and check if there is any connections, if so - remove them
    // usually valid for the object ports in case when edge connects to the object port and we removing the child connections
    const recursiveFindChildConnections = (p: IPort) => {
      const connections: IEdge[] = []

      filterPorts(node, (port) => {
        if (typeof port !== 'object' || !port.getConfig()) {
          console.warn(`Port ${port.id} does not have a valid config: ${typeof port}`)
        }

        return port.getConfig().parentId === p.id
      }).forEach((port) => {
        // find connections to this port
        const childConnections = Array.from(this.edges.values()).filter((edge) => {
          return edge.targetNode.id === node.id && edge.targetPort.id === port.id
        })
        if (childConnections.length > 0) {
          connections.push(...childConnections)
        }

        const internalConnections = recursiveFindChildConnections(port)
        if (internalConnections.length > 0) {
          connections.push(...internalConnections)
        }
      })

      return connections
    }

    const targetPortConnections = recursiveFindChildConnections(port)
    if (targetPortConnections.length > 0) {
      const promises = targetPortConnections.map((edge) => {
        return this.removeEdge(edge.id)
      })
      return Promise.all(promises).then(() => {})
    }

    return Promise.resolve()
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

  public filterEdges(predicate: (edge: IEdge) => boolean): IEdge[] {
    return [...this.edges.values()].filter(predicate)
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

    // Unsubscribe from global flow events
    this.cancelGlobalHandler()

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
  public onEvent(handler: (event: FlowEvent) => void | Promise<void>): () => void {
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
  private async handleNodeEvent(node: INode, nodeEvent: NodeEvent): Promise<void> {
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

      case NodeEventType.UIChange:
        {
          // Handle node UI change event
          const nodeUIDimensionsEventData: NodeUIChangedEventData = {
            nodeId: node.id,
            ui: (nodeEvent as any).ui,
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

        // case NodeEventType.StatusChange:
        // case NodeEventType.UIStateChange:
        // case NodeEventType.UIStyleChange:
        // {
        //   const nodeUIEventData: NodeUIEventData = {
        //     nodeId: node.id,
        //     oldValue: (nodeEvent as any).oldValue,
        //     newValue: (nodeEvent as any).newValue,
        //     version: nodeEvent.version,
        //   }
        //   flowEvent = newEvent(
        //     this.getNextEventIndex(),
        //     this.id,
        //     this.mapNodeUIEventToFlowEvent(nodeEvent.type),
        //     nodeUIEventData,
        //   )
        //
        //   break
        // }

      case NodeEventType.PortUpdate: {
        const eventPort = (nodeEvent as PortUpdateEvent).port as IPort
        const portUpdateEventData: PortUpdatedEventData = {
          port: eventPort.clone(),
          nodeVersion: nodeEvent.version,
        }

        flowEvent = newEvent(
          this.getNextEventIndex(),
          this.id,
          FlowEventType.PortUpdated,
          portUpdateEventData,
        )

        // await this.updateNode(node)
        break
      }

      case NodeEventType.PortCreate: {
        const portCreateEventData: PortCreatedEventData = {
          port: (nodeEvent as any).port.clone(),
          nodeVersion: nodeEvent.version,
        }

        flowEvent = newEvent(
          this.getNextEventIndex(),
          this.id,
          FlowEventType.PortCreated,
          portCreateEventData,
        )
        await this.updateNode(node)
        break
      }

      case NodeEventType.PortDelete: {
        const portRemovedEventData: PortRemovedEventData = {
          port: (nodeEvent as any).port.clone(),
          nodeVersion: nodeEvent.version,
        }

        flowEvent = newEvent(
          this.getNextEventIndex(),
          this.id,
          FlowEventType.PortRemoved,
          portRemovedEventData,
        )
        await this.updateNode(node)
        break
      }

      default:
        // Ignore other events
        break
    }

    if (flowEvent) {
      return this.emitEvent(flowEvent)
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
      case NodeEventType.UIChange:
        return FlowEventType.NodeUIChanged
      default:
        throw new Error(`Unsupported node event type: ${nodeEventType}`)
    }
  }

  public async clone(): Promise<IFlow> {
    const newFlow = new Flow(deepCopy(this.metadata))

    // Clone nodes
    await Promise.all(this.nodes.values().map((node) => {
      return newFlow.addNode(node.clone(), true)
    }))

    // Clone edges
    const edgePromises: Promise<void>[] = []
    for (const edge of this.edges.values()) {
      // Find the source and target nodes in the new flow
      const sourceNode = newFlow.nodes.get(edge.sourceNode.id)
      const targetNode = newFlow.nodes.get(edge.targetNode.id)
      if (!sourceNode || !targetNode) {
        // ignore such edges
        continue
        // throw new Error(`Failed to clone edge ${edge.id}: source or target node not found.`)
      }

      // Find the source and target ports in the new flow
      const sourcePort = sourceNode.getPort(edge.sourcePort.id)
      const targetPort = targetNode.getPort(edge.targetPort.id)

      if (!sourcePort || !targetPort) {
        // ignore such edges
        continue
        // throw new Error(`Failed to clone edge ${edge.id}: source or target port not found.`)
      }

      const clonedEdge = new Edge(
        edge.id,
        sourceNode,
        sourcePort,
        targetNode,
        targetPort,
        { ...edge.metadata },
      )

      edgePromises.push(newFlow.addEdge(clonedEdge, true))
    }

    await Promise.all(edgePromises)

    return newFlow as IFlow
  }

  public serialize() {
    const nodes = Array.from(this.nodes.values()).map(
      node => node.serialize(),
    )
    const edges: JSONValue[] = []
    for (const edge of this.edges.values()) {
      edges.push({
        id: edge.id,
        sourceNodeId: edge.sourceNode.id,
        sourcePortId: edge.sourcePort.id,
        targetNodeId: edge.targetNode.id,
        targetPortId: edge.targetPort.id,
        metadata: edge.metadata,
      })
    }

    return {
      id: this.id,
      metadata: this.metadata,
      nodes,
      edges,
    }
  }

  public deserialize(data: JSONValue, nodeRegistry?: NodeRegistry): IFlow {
    const flowData = data as any

    if (!flowData.metadata) {
      throw new Error('Invalid flow data: missing metadata.')
    }

    const flow = new Flow({
      ...flowData.metadata,
      createdAt: new Date(flowData.metadata.createdAt ?? new Date()),
      updatedAt: new Date(flowData.metadata.updatedAt ?? new Date()),
    })

    const nodeRegistryInstance = nodeRegistry || NodeRegistry.getInstance()

    for (const nodeData of flowData.nodes) {
      try {
        const node = nodeRegistryInstance.createNode(
          nodeData.metadata.type,
          nodeData.id,
          nodeData.metadata,
        )

        flow.addNodeSync(node.deserialize(nodeData))
      } catch (error) {
        console.error(`[Flow] Failed to deserialize node: ${nodeData.id}`, error)
        console.error(`[Flow] Failed to deserialize node data: ${nodeData.id} ${JSON.stringify(nodeData)}`)
        // ignore the error and continue with the next node
      }
    }

    for (const edgeData of flowData.edges) {
      const sourceNode = flow.nodes.get(edgeData.sourceNodeId)
      const targetNode = flow.nodes.get(edgeData.targetNodeId)

      if (!sourceNode || !targetNode) {
        // throw new Error('Failed to deserialize flow: source or target node not found.')
        console.error(`[Flow] Failed to deserialize flow: source or target node not found, skiping`)
        continue
      }

      const sourcePort = sourceNode.getPort(edgeData.sourcePortId)
      const targetPort = targetNode.getPort(edgeData.targetPortId)

      if (!sourcePort || !targetPort) {
        console.error(`[Flow] Failed to deserialize edge: ${edgeData.id}`, {
          sourceNodeId: edgeData.sourceNodeId,
          targetNodeId: edgeData.targetNodeId,
          sourcePortId: edgeData.sourcePortId,
          targetPortId: edgeData.targetPortId,
        })
        continue
        // throw new Error('Failed to deserialize flow: source or target port not found.')
      }

      const edge = new Edge(
        edgeData.id,
        sourceNode,
        sourcePort,
        targetNode,
        targetPort,
        edgeData.metadata,
      )

      flow.addEdgeSync(edge)
    }

    return flow as IFlow
  }

  static deserialize(data: JSONValue, nodeRegistry?: NodeRegistry): IFlow {
    const flow = new Flow()
    return flow.deserialize(data, nodeRegistry)
  }

  public setIsDisabledPropagationEvents(value: boolean) {
    this._isDisabledPropagationEvents = value
  }
}
