/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { INode } from '@badaitech/chaingraph-types'
import { useStoreMap, useUnit } from 'effector-react'
import { $draggingNodes, $nodes } from '../stores'

// export function useNode2(nodeId: string) {
//   const nodes = useUnit($nodes)
//   return useMemo(
//     () => nodes[nodeId],
//     [nodes, nodeId],
//   )
// }

export function useNode(nodeId: string) {
  return useStoreMap({
    store: $nodes,
    keys: [nodeId],
    fn: (nodes, [nodeId]) => {
      // Handle empty/undefined nodeId gracefully
      if (!nodeId) return undefined
      return nodes[nodeId]
    },
    updateFilter: (prev, next) => {
      // Handle empty nodeId case
      if (!nodeId) {
        return false
      }

      // If node doesn't exist or was added/removed
      if (!prev || !next) {
        return true
      }

      // Check if the node version has changed
      const prevVersion = prev.getVersion()
      const nextVersion = next.getVersion()
      if (prevVersion !== nextVersion) {
        return true
      }

      // Check if UI properties changed
      const prevUi = prev.getUI()
      const nextUi = next.getUI()

      if (
        prevUi?.position?.x !== nextUi?.position?.x
        || prevUi?.position?.y !== nextUi?.position?.y
        || prevUi?.dimensions?.width !== nextUi?.dimensions?.width
        || prevUi?.dimensions?.height !== nextUi?.dimensions?.height
        || prevUi?.parentId !== nextUi?.parentId
        || prevUi?.selected !== nextUi?.selected
        || prevUi?.type !== nextUi?.type
        || prevUi?.zIndex !== nextUi?.zIndex
      ) {
        return true
      }

      // No changes detected - skip re-render
      return false
    },
  })
}

/**
 * Hook to get IDs of all nodes that are currently being dragged
 * @returns An array of node IDs that are currently being dragged
 */
export function useDraggingNodes() {
  return useUnit($draggingNodes)
}

/**
 * Hook to get all nodes that are currently being dragged
 * @returns An array of node objects that are currently being dragged
 */
export function useDraggingNodeObjects(): Record<string, INode> {
  return useStoreMap({
    store: $nodes,
    keys: [useUnit($draggingNodes)],
    fn: (nodes, [draggingIds]) => {
      return draggingIds.map(id => nodes[id]).filter(Boolean)
    },
  })
}

/**
 * Hook to get all nodes as an array
 * @returns An array of all node objects
 */
export function useAllNodes() {
  return useStoreMap({
    store: $nodes,
    keys: [],
    fn: nodes => Object.values(nodes),
  })
}
