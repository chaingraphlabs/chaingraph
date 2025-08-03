/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { Edge, IEdge } from '../edge'
import type { INode } from '../node'
import type { JSONValue } from '../utils/json'
import type { FlowEvent } from './events'
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
  addNode: (node: INode, disableEvents?: boolean) => INode

  /**
   * Adds multiple nodes to the flow.
   * @param nodes The nodes to add.
   * @param disableEvents If true, events will not be triggered for each node added.
   * @returns An array of added nodes.
   */
  addNodes: (nodes: INode[], disableEvents?: boolean) => INode[]

  /**
   * Updates a node in the flow and triggers an event.
   * @param node
   */
  updateNode: (node: INode) => void

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
   * Remove a port from a node, including all child ports and their connections
   * @param nodeId
   * @param portId
   */
  removePort: (nodeId: string, portId: string) => void

  /**
   * Connects two nodes via their ports.
   * @param sourceNodeId The ID of the source node.
   * @param sourcePortId The ID of the source port.
   * @param targetNodeId The ID of the target node.
   * @param targetPortId The ID of the target port.
   */
  connectPorts: (
    sourceNodeId: string,
    sourcePortId: string,
    targetNodeId: string,
    targetPortId: string
  ) => Promise<Edge>

  /**
   * Validates the entire flow.
   * @returns A promise that resolves to true if the flow is valid.
   */
  validate: () => Promise<boolean>

  /**
   * Disposes the flow and its resources.
   */
  dispose: () => Promise<void>

  /**
   * Subscribe to flow events
   * @param handler Event handler function
   */
  onEvent: (handler: (event: FlowEvent) => | Promise<void>) => () => void

  /**
   * Clone the flow
   * @returns A new instance of the flow
   */
  clone: () => IFlow

  /**
   * Serialize the flow to JSON
   * @returns JSON representation of the flow
   */
  serialize: () => JSONValue

  /**
   * Deserialize the flow from JSON
   * @param data JSON data to deserialize
   * @returns Deserialized flow instance
   */
  deserialize: (data: JSONValue) => IFlow

  getIncomingEdges: (node: INode) => IEdge[]

  getOutgoingEdges: (node: INode) => IEdge[]

  filterEdges: (predicate: (edge: IEdge) => boolean) => IEdge[]
}
