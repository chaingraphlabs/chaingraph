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
      return nodes[nodeId]
    },
    // TODO: we could use this to update the node only when the version changes
    // TODO: but before we needs to implement local version changes in the node
    // TODO: so this local version have to be updated when the local node state changes
    // updateFilter: (prev, next) => {
    //   if (!prev || !next)
    //     return true
    //
    //   // Check if the node version has changed
    //   if (prev.getVersion() !== next.getVersion())
    //     return true
    //
    //   const prevUi = prev.getUI()
    //   const nextUi = next.getUI()
    //
    //   // Quick checks for common updates
    //   if (
    //     prevUi?.position?.x !== nextUi?.position?.x
    //     || prevUi?.position?.y !== nextUi?.position?.y
    //     || prevUi?.dimensions?.width !== nextUi?.dimensions?.width
    //     || prevUi?.dimensions?.height !== nextUi?.dimensions?.height
    //     || prevUi?.parentId !== nextUi?.parentId
    //     || prevUi?.selected !== nextUi?.selected
    //     || prevUi?.type !== nextUi?.type
    //     || prevUi?.zIndex !== nextUi?.zIndex
    //   ) {
    //     return true
    //   }
    //
    //   return false
    //   // const prevJson = JSON.stringify(prev.metadata)
    //   // const nextJson = JSON.stringify(next.metadata)
    //   //
    //   // return prevJson !== nextJson
    // },
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
