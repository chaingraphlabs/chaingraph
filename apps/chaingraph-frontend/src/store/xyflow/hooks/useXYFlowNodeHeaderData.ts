/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { CategoryMetadata } from '@badaitech/chaingraph-types'
import type { NodeExecutionStatus } from '../types'
import { useStoreMap } from 'effector-react'
import { $xyflowNodeRenderMap } from '../stores'

export interface NodeHeaderData {
  title: string
  status: NodeExecutionStatus
  categoryMetadata: CategoryMetadata
}

/**
 * Granular hook for NodeHeader component
 *
 * Only subscribes to header-specific fields (3 out of 30+):
 * - title: for EditableNodeTitle
 * - status: for NodeStatusBadge
 * - categoryMetadata: for LazyNodeDocTooltip
 *
 * Performance benefit:
 * - Component only re-renders when these specific fields change
 * - Ignores changes to position, dimensions, execution style, etc.
 * - 90% reduction in subscription surface area (3 fields vs 30+)
 *
 * @param nodeId - The ID of the node to get header data for
 * @returns Object with title, status, and categoryMetadata, or undefined if node not found
 */
export function useXYFlowNodeHeaderData(nodeId: string): NodeHeaderData | undefined {
  return useStoreMap({
    store: $xyflowNodeRenderMap,
    keys: [nodeId],
    fn: (map, [id]) => {
      const data = map[id]
      return data
        ? {
          title: data.title,
          status: data.status,
          categoryMetadata: data.categoryMetadata,
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

      // Only re-render if header-specific fields changed
      return (
        prev.title !== next.title
        || prev.status !== next.status
        || prev.categoryMetadata?.id !== next.categoryMetadata?.id
      )
    },
  })
}
