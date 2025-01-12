import type { IEdge, INode } from '@chaingraph/types'
import type { IFlow } from './interface'

import type { FlowMetadata } from './types'
import { EventEmitter } from 'node:events'
import { Edge } from '@chaingraph/types'
import { v4 as uuidv4 } from 'uuid'

export class Flow implements IFlow {
  readonly id: string
  readonly metadata: FlowMetadata
  readonly nodes: Map<string, INode>
  readonly edges: Map<string, IEdge>

  private eventEmitter = new EventEmitter()

  constructor(metadata: Partial<FlowMetadata> = {}) {
    this.id = uuidv4()
    this.metadata = {
      name: metadata.name || 'Untitled Flow',
      description: metadata.description || '',
      createdAt: new Date(),
      updatedAt: new Date(),
      ...metadata,
    }
    this.nodes = new Map()
    this.edges = new Map()
  }

  addNode(node: INode): void {
    if (this.nodes.has(node.id)) {
      throw new Error(`Node with ID ${node.id} already exists in the flow.`)
    }
    this.nodes.set(node.id, node)
  }

  removeNode(nodeId: string): void {
    if (!this.nodes.delete(nodeId)) {
      throw new Error(`Node with ID ${nodeId} does not exist in the flow.`)
    }

    // Remove any edges connected to this node
    for (const [edgeId, edge] of this.edges.entries()) {
      if (edge.sourceNode.id === nodeId || edge.targetNode.id === nodeId) {
        this.edges.delete(edgeId)
      }
    }
  }

  addEdge(edge: IEdge): void {
    if (this.edges.has(edge.id)) {
      throw new Error(`Edge with ID ${edge.id} already exists in the flow.`)
    }
    this.edges.set(edge.id, edge)
  }

  removeEdge(edgeId: string): void {
    if (!this.edges.delete(edgeId)) {
      throw new Error(`Edge with ID ${edgeId} does not exist in the flow.`)
    }
  }

  async connectPorts(
    sourceNodeId: string,
    sourcePortId: string,
    targetNodeId: string,
    targetPortId: string,
  ): Promise<void> {
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

  dispose(): Promise<void> {
    // Clean up resources
    this.nodes.clear()
    this.edges.clear()
    this.eventEmitter.removeAllListeners()
    return Promise.resolve()
  }
}
