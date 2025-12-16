/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { EdgeData } from '@/store/edges/types'
import { combine } from 'effector'
import { $edges } from '@/store/edges'
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
 *
 * OPTIMIZED: Now only depends on $edges, not $nodes!
 * This prevents recalculation during node position/drag updates.
 */
export const $nodePortEdgesMap = combine(
  $edges,
  (edges) => {
    const nodePortEdges: NodePortEdgesMap = {}

    // Helper to ensure node and port structure exists
    const ensurePortArray = (nodeId: string, portId: string) => {
      if (!nodePortEdges[nodeId]) {
        nodePortEdges[nodeId] = {}
      }
      if (!nodePortEdges[nodeId][portId]) {
        nodePortEdges[nodeId][portId] = []
      }
    }

    // Build map directly from edges - no node iteration needed!
    edges.forEach((edge) => {
      // Add edge to source node's port
      ensurePortArray(edge.sourceNodeId, edge.sourcePortId)
      nodePortEdges[edge.sourceNodeId][edge.sourcePortId].push(edge)

      // Add edge to target node's port
      ensurePortArray(edge.targetNodeId, edge.targetPortId)
      nodePortEdges[edge.targetNodeId][edge.targetPortId].push(edge)
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
