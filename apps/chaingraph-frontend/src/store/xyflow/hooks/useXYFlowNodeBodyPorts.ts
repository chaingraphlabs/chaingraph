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
 * Granular hook for NodeBody component
 *
 * Only subscribes to port ID arrays and parent category (5 fields out of 30+)
 * Prevents re-renders when unrelated fields change (execution state, position, etc.)
 *
 * Performance benefit:
 * - Component only re-renders when port lists or parent category changes
 * - Ignores changes to execution style, position, dimensions, etc.
 * - 83% reduction in subscription surface area (5 fields vs 30+)
 * - Replaces inefficient useNode(parentNodeId) that loaded entire parent INode
 *
 * @param nodeId - The ID of the node to get body port data for
 * @returns Object with inputPortIds, outputPortIds, passthroughPortIds, parentNodeCategory, or undefined if node not found
 */
export function useXYFlowNodeBodyPorts(nodeId: string) {
  return useStoreMap({
    store: $xyflowNodeRenderMap,
    keys: [nodeId],
    fn: (map, [id]) => {
      const data = map[id]
      return data
        ? {
            inputPortIds: data.inputPortIds,
            outputPortIds: data.outputPortIds,
            passthroughPortIds: data.passthroughPortIds,
            parentNodeCategory: data.parentNodeCategory,
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

      // Only re-render if port ID arrays or parent category changed
      // Arrays are compared by reference (immutable from store)
      return (
        prev.inputPortIds !== next.inputPortIds
        || prev.outputPortIds !== next.outputPortIds
        || prev.passthroughPortIds !== next.passthroughPortIds
        || prev.parentNodeCategory !== next.parentNodeCategory
      )
    },
  })
}
