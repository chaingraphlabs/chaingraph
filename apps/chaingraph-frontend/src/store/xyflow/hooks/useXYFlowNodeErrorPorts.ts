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
 * Granular hook for NodeErrorPorts component
 *
 * Only subscribes to error port IDs, collapse state, and version (4 fields out of 30+)
 * Prevents re-renders when unrelated fields change (execution state, position, etc.)
 *
 * Performance benefit:
 * - Component only re-renders when error ports or collapse state changes
 * - Ignores changes to execution style, position, dimensions, etc.
 * - 87% reduction in subscription surface area (4 fields vs 30+)
 *
 * @param nodeId - The ID of the node to get error port data for
 * @returns Object with errorPortId, errorMessagePortId, isErrorPortCollapsed, version, or undefined if node not found
 */
export function useXYFlowNodeErrorPorts(nodeId: string) {
  return useStoreMap({
    store: $xyflowNodeRenderMap,
    keys: [nodeId],
    fn: (map, [id]) => {
      const data = map[id]
      return data
        ? {
          errorPortId: data.errorPortId,
          errorMessagePortId: data.errorMessagePortId,
          isErrorPortCollapsed: data.isErrorPortCollapsed,
          version: data.version,
        }
        : {
          errorPortId: undefined,
          errorMessagePortId: undefined,
          isErrorPortCollapsed: undefined,
          version: undefined,
        }
    },
    updateFilter: (prev, next) => {
      // No change if both undefined
      if (!prev && !next)
        return false

      // Change if one is undefined
      if (!prev || !next)
        return true

      // Only re-render if error ports, collapse state, or version changed
      return (
        prev.errorPortId !== next.errorPortId
        || prev.errorMessagePortId !== next.errorMessagePortId
        || prev.isErrorPortCollapsed !== next.isErrorPortCollapsed
        || prev.version !== next.version
      )
    },
  })
}
