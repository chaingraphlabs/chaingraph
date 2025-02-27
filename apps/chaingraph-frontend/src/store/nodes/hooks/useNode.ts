/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import { $nodes } from '@/store/nodes'
import { useStoreMap } from 'effector-react'

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
    //   return prev.getVersion() !== next.getVersion()
    // },
  })
}
