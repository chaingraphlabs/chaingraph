/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { EdgeRenderData } from '../types'
import { useUnit } from 'effector-react'
import { useMemo } from 'react'
import { $edgeRenderMap, $xyflowEdgesList } from '../stores'

/**
 * Hook that returns XYFlow edges with optimized re-rendering.
 *
 * Leverages the new map-based architecture:
 * 1. Uses $xyflowEdgesList (already filtered to ready edges)
 * 2. Memoizes by version sum (avoids deep comparison)
 * 3. Falls back to reference equality when versions unchanged
 */
export function useXYFlowEdges() {
  const edges = useUnit($xyflowEdgesList)
  const edgeMap = useUnit($edgeRenderMap)

  // Compute version fingerprint for memoization
  // This is O(E) but avoids deep comparison of edge objects
  const versionSum = useMemo(() => {
    let sum = 0
    for (const renderData of edgeMap.values()) {
      sum += renderData.version
    }
    return sum
  }, [edgeMap])

  // Memoize edges array by version fingerprint
  // Only recomputes when version sum changes
  return useMemo(() => edges, [edges, versionSum])
}

/**
 * Hook for EdgeRenderData connected to a specific node
 * Uses the render map for efficient filtering
 *
 * NOTE: This returns EdgeRenderData, not EdgeData.
 * For EdgeData, use useEdgesForNode from useEdges.ts
 */
export function useEdgeRenderDataForNode(nodeId: string): EdgeRenderData[] {
  const edgeMap = useUnit($edgeRenderMap)

  return useMemo(() => {
    const result: EdgeRenderData[] = []
    for (const edge of edgeMap.values()) {
      if (edge.isReady && (edge.source === nodeId || edge.target === nodeId)) {
        result.push(edge)
      }
    }
    return result
  }, [edgeMap, nodeId])
}

/**
 * Hook for EdgeRenderData connected to a specific port
 * Uses the render map for efficient filtering
 *
 * NOTE: This returns EdgeRenderData, not EdgeData.
 * For EdgeData, use useEdgesForPort from useEdges.ts
 */
export function useEdgeRenderDataForPort(nodeId: string, portId: string): EdgeRenderData[] {
  const edgeMap = useUnit($edgeRenderMap)

  return useMemo(() => {
    const result: EdgeRenderData[] = []
    for (const edge of edgeMap.values()) {
      if (!edge.isReady) continue

      const isSourcePort = edge.source === nodeId && edge.sourceHandle === portId
      const isTargetPort = edge.target === nodeId && edge.targetHandle === portId

      if (isSourcePort || isTargetPort) {
        result.push(edge)
      }
    }
    return result
  }, [edgeMap, nodeId, portId])
}
