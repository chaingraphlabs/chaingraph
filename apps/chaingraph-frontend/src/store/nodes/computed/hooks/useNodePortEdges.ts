/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { EdgeData } from '@/store/edges/types'
import { useStoreMap } from 'effector-react'
import { $nodeEdgesMap, $nodePortEdgesMap } from '../port-edges'

/**
 * Hook to get all edges for a specific node
 * Only re-renders when edges for this node change
 */
export function useNodeEdges(nodeId: string): EdgeData[] {
  return useStoreMap({
    store: $nodeEdgesMap,
    keys: [nodeId],
    fn: (nodeEdges, [nodeId]) => {
      return nodeEdges[nodeId] ?? []
    },
    updateFilter: (prev, next) => {
      // Compare array lengths first (quick check)
      if (prev.length !== next.length)
        return true

      // Compare edge IDs (assuming edges are immutable)
      const prevIds = prev.map(e => e.edgeId).sort().join(',')
      const nextIds = next.map(e => e.edgeId).sort().join(',')

      return prevIds !== nextIds
    },
  })
}

/**
 * Hook to get edges for a specific port in a node
 * Ultra-optimized to only re-render when port's edges change
 */
export function usePortEdges(nodeId: string, portId: string): EdgeData[] {
  return useStoreMap({
    store: $nodePortEdgesMap,
    keys: [nodeId, portId],
    fn: (portEdgesMap, [nodeId, portId]) => {
      return portEdgesMap[nodeId]?.[portId] ?? []
    },
    updateFilter: (prev, next) => {
      // Compare array lengths first
      if (prev.length !== next.length)
        return true

      // Deep compare only if needed
      const prevIds = prev.map(e => e.edgeId).sort().join(',')
      const nextIds = next.map(e => e.edgeId).sort().join(',')

      return prevIds !== nextIds
    },
  })
}

/**
 * Hook to get the edges map for all ports in a node
 * Returns the entire port edges mapping for a node
 */
export function useNodePortEdgesMap(nodeId: string): Record<string, EdgeData[]> {
  return useStoreMap({
    store: $nodePortEdgesMap,
    keys: [nodeId],
    fn: (portEdgesMap, [nodeId]) => {
      return portEdgesMap[nodeId] ?? {}
    },
    updateFilter: (prev, next) => {
      // Check if port count changed
      const prevPorts = Object.keys(prev)
      const nextPorts = Object.keys(next)

      if (prevPorts.length !== nextPorts.length)
        return true

      // Check if any port's edges changed
      for (const portId of prevPorts) {
        const prevEdges = prev[portId] ?? []
        const nextEdges = next[portId] ?? []

        if (prevEdges.length !== nextEdges.length)
          return true

        const prevIds = prevEdges.map(e => e.edgeId).sort().join(',')
        const nextIds = nextEdges.map(e => e.edgeId).sort().join(',')

        if (prevIds !== nextIds)
          return true
      }

      return false
    },
  })
}
