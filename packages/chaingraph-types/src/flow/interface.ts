import type { IEdge } from '@chaingraph/types/edge'
import type { ExecutionContext } from '@chaingraph/types/flow/execution-context'
import type { INode } from '@chaingraph/types/node'
import type { FlowMetadata } from './types'

/**
 * Interface representing a flow (graph) that contains nodes and edges.
 */
export interface IFlow {
  /** Unique identifier for the flow */
  readonly id: string

  /** Metadata about the flow */
  readonly metadata: FlowMetadata

  /** Map of nodes in the flow */
  readonly nodes: Map<string, INode>

  /** Map of edges in the flow */
  readonly edges: Map<string, IEdge>

  /**
   * Adds a node to the flow.
   * @param node The node to add.
   */
  addNode: (node: INode) => void

  /**
   * Removes a node from the flow.
   * @param nodeId The ID of the node to remove.
   */
  removeNode: (nodeId: string) => void

  /**
   * Adds an edge to the flow.
   * @param edge The edge to add.
   */
  addEdge: (edge: IEdge) => void

  /**
   * Removes an edge from the flow.
   * @param edgeId The ID of the edge to remove.
   */
  removeEdge: (edgeId: string) => void

  /**
   * Connects two nodes via their ports.
   * @param sourceNodeId The ID of the source node.
   * @param sourcePortId The ID of the source port.
   * @param targetNodeId The ID of the target node.
   * @param targetPortId The ID of the target port.
   */
  connectNodes: (
    sourceNodeId: string,
    sourcePortId: string,
    targetNodeId: string,
    targetPortId: string
  ) => Promise<void>

  /**
   * Validates the entire flow.
   * @returns A promise that resolves to true if the flow is valid.
   */
  validate: () => Promise<boolean>

  /**
   * Executes the flow.
   */
  execute: (context: ExecutionContext) => Promise<void>

  /**
   * Disposes the flow and its resources.
   */
  dispose: () => Promise<void>
}
