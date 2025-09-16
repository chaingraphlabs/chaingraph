/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import { $highlightedNodeId } from '@/store/execution'
import { useStoreMap } from 'effector-react'

/**
 * Hook to check if a specific node is highlighted
 * Only re-renders when highlight state for this node changes
 */
export function useIsNodeHighlighted(nodeId: string): boolean {
  return useStoreMap({
    store: $highlightedNodeId,
    keys: [nodeId],
    fn: (highlightedIds, [nodeId]) => {
      return highlightedIds !== null && highlightedIds.includes(nodeId)
    },
    updateFilter: (prev, next) => {
      // Only update if the highlight state changed for this specific node
      return prev !== next
    },
  })
}

/**
 * Hook to check if any nodes are highlighted
 * Returns true if highlighting is active
 */
export function useHasHighlightedNodes(): boolean {
  return useStoreMap({
    store: $highlightedNodeId,
    keys: [],
    fn: highlightedIds => highlightedIds !== null,
    updateFilter: (prev, next) => prev !== next,
  })
}
