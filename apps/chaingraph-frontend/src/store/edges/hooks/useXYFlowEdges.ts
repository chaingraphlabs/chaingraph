/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import { useStoreMap } from 'effector-react'
import { useMemo } from 'react'
import { $xyflowEdges } from '../stores'

/**
 * Hook that returns XYFlow edges with optimized re-rendering.
 * Only updates when there are meaningful changes to the edges.
 */
export function useXYFlowEdges() {
  const edges = useStoreMap({
    store: $xyflowEdges,
    keys: [],
    fn: edges => edges,
    updateFilter: (prevEdges, nextEdges) => {
      // return false
      // Quick checks first
      // if (prevEdges === nextEdges)
      //   return false

      if (prevEdges.length !== nextEdges.length)
        return true

      // Check for changes in edge properties that affect rendering
      for (let i = 0; i < prevEdges.length; i++) {
        const prev = prevEdges[i]
        const next = nextEdges[i]

        // Check if it's the same edge ID
        if (prev.id !== next.id)
          return true

        // Check if core properties changed
        if (prev.source !== next.source || prev.target !== next.target)
          return true
        if (prev.sourceHandle !== next.sourceHandle || prev.targetHandle !== next.targetHandle)
          return true

        // Check if type changed (affects rendering logic)
        if (prev.type !== next.type)
          return true

        // Check if animation state changed
        if (prev.data?.animated !== next.data?.animated)
          return true

        // Check if styling changed
        const prevStyle = prev.style || {}
        const nextStyle = next.style || {}
        if (
          prevStyle.stroke !== nextStyle.stroke
          || prevStyle.strokeWidth !== nextStyle.strokeWidth
          || prevStyle.strokeOpacity !== nextStyle.strokeOpacity
        ) {
          return true
        }

        // Check data version (captures changes in source/target nodes)
        // if (prev.data?.version !== next.data?.version)
        //   return true
      }

      // No meaningful changes detected
      return false
    },
  })

  // Memoize length separately
  const edgesLength = useMemo(() => edges.length, [edges])

  // Memoize the composite key separately
  const edgesKey = useMemo(() =>
    edges.map(e =>
      `${e.id}-${e.type}-${e.data?.animated}-${e.style?.strokeOpacity}-${e.data?.version}`,
    ).join('|'), [edges])

  // Final memoization using simple dependencies
  return useMemo(() => edges, [edges])
}
