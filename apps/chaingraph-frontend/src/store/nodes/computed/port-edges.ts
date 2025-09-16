/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { EdgeData } from '@/store/edges/types'
import { $edges } from '@/store/edges'
import { combine } from 'effector'
import { $nodes } from '../stores'

export interface PortEdgesMap {
  [portId: string]: EdgeData[]
}

export interface NodePortEdgesMap {
  [nodeId: string]: PortEdgesMap
}

/**
 * Pre-computed mapping of edges for each port in each node
 * This eliminates the need to filter edges on every render
 */
export const $nodePortEdgesMap = combine(
  $nodes,
  $edges,
  (nodes, edges) => {
    const nodePortEdges: NodePortEdgesMap = {}

    // Initialize empty maps for all nodes
    Object.keys(nodes).forEach((nodeId) => {
      nodePortEdges[nodeId] = {}
      const node = nodes[nodeId]

      // Initialize empty arrays for all ports
      if (node && node.ports) {
        node.ports.forEach((port) => {
          nodePortEdges[nodeId][port.id] = []
        })
      }
    })

    // Populate edges for each port
    edges.forEach((edge) => {
      // Add edge to source node's port
      if (nodePortEdges[edge.sourceNodeId]) {
        if (!nodePortEdges[edge.sourceNodeId][edge.sourcePortId]) {
          nodePortEdges[edge.sourceNodeId][edge.sourcePortId] = []
        }
        nodePortEdges[edge.sourceNodeId][edge.sourcePortId].push(edge)
      }

      // Add edge to target node's port
      if (nodePortEdges[edge.targetNodeId]) {
        if (!nodePortEdges[edge.targetNodeId][edge.targetPortId]) {
          nodePortEdges[edge.targetNodeId][edge.targetPortId] = []
        }
        nodePortEdges[edge.targetNodeId][edge.targetPortId].push(edge)
      }
    })

    return nodePortEdges
  },
)

/**
 * Get all edges connected to a specific node
 * Pre-computed for performance
 */
export const $nodeEdgesMap = combine(
  $edges,
  (edges) => {
    const nodeEdges: Record<string, EdgeData[]> = {}

    edges.forEach((edge) => {
      // Add edge to source node
      if (!nodeEdges[edge.sourceNodeId]) {
        nodeEdges[edge.sourceNodeId] = []
      }
      nodeEdges[edge.sourceNodeId].push(edge)

      // Add edge to target node
      if (!nodeEdges[edge.targetNodeId]) {
        nodeEdges[edge.targetNodeId] = []
      }
      nodeEdges[edge.targetNodeId].push(edge)
    })

    return nodeEdges
  },
)
