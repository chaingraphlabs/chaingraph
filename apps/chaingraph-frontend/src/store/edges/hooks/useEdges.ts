/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { EdgeData } from '@/store/edges/types'
import { $edges } from '@/store/edges/stores'
import { useUnit } from 'effector-react'
import { useMemo } from 'react'

export function useEdgesForPort(portId: string): EdgeData[] {
  const edges = useUnit($edges)

  // Filter the edges to return only those that are connected to the given port.
  // We check if either the sourcePortId or the targetPortId match the provided port id.
  return useMemo(() => {
    return edges.filter(
      edge =>
        edge.sourcePortId === portId
        || edge.targetPortId === portId,
    )
  }, [edges, portId])
}

export function useEdgesForNode(nodeId: string): EdgeData[] {
  const edges = useUnit($edges)

  // Filter the edges to return only those that are connected to the given node.
  // We check if either the sourceNodeId or the targetNodeId match the provided node id.
  return useMemo(() => {
    return edges.filter(
      edge =>
        edge.sourceNodeId === nodeId
        || edge.targetNodeId === nodeId,
    )
  }, [edges, nodeId])
}

// export function useEdgesForNode(nodeId: string): EdgeData[] {
//   // Using useStoreMap instead of useUnit + useMemo is more efficient
//   // for extracting a subset of data from a large store
//   return useStoreMap({
//     store: $edges,
//     keys: [nodeId],
//     fn: (edges, [currentNodeId]) => {
//       // Filter edges connected to the node
//       return edges.filter(
//         edge =>
//           edge.sourceNodeId === currentNodeId
//           || edge.targetNodeId === currentNodeId,
//       )
//     },
//     updateFilter: (newEdges, oldEdges) => {
//       // Important: updateFilter function prevents unnecessary updates
//       // Only compare edges related to the node we're interested in
//
//       // The equals method compares two collections of node edges
//       const equals = (a: EdgeData[], b: EdgeData[]) => {
//         if (a.length !== b.length)
//           return false
//
//         // Create sets of edge IDs for quick comparison
//         const aIds = new Set(a.map(e => e.edgeId))
//         const bIds = new Set(b.map(e => e.edgeId))
//
//         // Quick check if the sets are identical
//         if (aIds.size !== bIds.size)
//           return false
//
//         // Check that all IDs from the first set exist in the second
//         for (const id of aIds) {
//           if (!bIds.has(id))
//             return false
//         }
//
//         return true
//       }
//
//       return equals(newEdges, oldEdges)
//     },
//   })
// }
