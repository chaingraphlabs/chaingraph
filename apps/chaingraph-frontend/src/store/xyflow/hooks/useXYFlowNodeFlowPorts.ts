/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import { useStoreMap } from 'effector-react'
import { $xyflowNodeRenderMap } from '../stores'

/**
 * Granular hook for NodeFlowPorts component
 *
 * Only subscribes to flow port IDs (2 fields out of 30+)
 * Prevents re-renders when unrelated fields change (execution state, position, etc.)
 *
 * Performance benefit:
 * - Component only re-renders when flowInputPortId or flowOutputPortId changes
 * - Ignores changes to execution style, position, dimensions, etc.
 * - 93% reduction in subscription surface area (2 fields vs 30+)
 *
 * @param nodeId - The ID of the node to get flow port IDs for
 * @returns Object with flowInputPortId and flowOutputPortId, or undefined if node not found
 */
export function useXYFlowNodeFlowPorts(nodeId: string) {
  return useStoreMap({
    store: $xyflowNodeRenderMap,
    keys: [nodeId],
    fn: (map, [id]) => {
      const data = map[id]
      return data
        ? {
            flowInputPortId: data.flowInputPortId,
            flowOutputPortId: data.flowOutputPortId,
          }
        : undefined
    },
    updateFilter: (prev, next) => {
      // No change if both undefined
      if (!prev && !next)
        return false

      // Change if one is undefined
      if (!prev || !next)
        return true

      // Only re-render if flow port IDs changed
      return (
        prev.flowInputPortId !== next.flowInputPortId
        || prev.flowOutputPortId !== next.flowOutputPortId
      )
    },
  })
}
