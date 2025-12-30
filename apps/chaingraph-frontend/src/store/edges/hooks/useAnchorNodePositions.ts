/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { INode } from '@badaitech/chaingraph-types'
import { combine } from 'effector'
import { useStoreMap } from 'effector-react'
import { ANCHOR_NODE_OFFSET } from '@/components/flow/nodes/AnchorNode/types'
import { $anchorNodes } from '@/store/edges/anchor-nodes'
import { $nodes } from '@/store/nodes/stores'

/**
 * Combined store for anchor positions with absolute coordinates
 * Combines anchor nodes with regular nodes to calculate absolute positions for parented anchors
 */
const $anchorPositionsWithNodes = combine(
  $anchorNodes,
  $nodes,
  (anchorNodes, nodes) => ({ anchorNodes, nodes }),
)

/**
 * Calculate absolute position for a node by traversing parent chain
 */
function getAbsoluteNodePosition(
  nodeId: string,
  nodes: Record<string, INode>,
): { x: number, y: number } {
  const node = nodes[nodeId]
  if (!node?.metadata.ui?.position) {
    return { x: 0, y: 0 }
  }

  let absPos = { ...node.metadata.ui.position }
  let current = node

  // Traverse up parent chain
  while (current.metadata.parentNodeId) {
    const parent = nodes[current.metadata.parentNodeId]
    if (!parent?.metadata.ui?.position)
      break
    absPos = {
      x: absPos.x + parent.metadata.ui.position.x,
      y: absPos.y + parent.metadata.ui.position.y,
    }
    current = parent
  }

  return absPos
}

/**
 * Hook to get anchor positions for a specific edge.
 *
 * Returns positions as ABSOLUTE center coordinates (for path calculation).
 * When anchors are parented to groups, their local coords are converted to absolute.
 * Uses selective subscription to only re-render when THIS edge's anchors change.
 */
export function useAnchorNodePositions(edgeId: string): Array<{ x: number, y: number, id: string, index: number }> {
  return useStoreMap({
    store: $anchorPositionsWithNodes,
    keys: [edgeId],
    fn: ({ anchorNodes, nodes }, [eid]) => {
      const result: Array<{ x: number, y: number, id: string, index: number }> = []

      for (const anchor of anchorNodes.values()) {
        if (anchor.edgeId === eid) {
          // Start with local position + offset to get center
          let x = anchor.x + ANCHOR_NODE_OFFSET
          let y = anchor.y + ANCHOR_NODE_OFFSET

          // If anchor has a parent, convert to absolute coordinates
          if (anchor.parentNodeId) {
            const parentAbsPos = getAbsoluteNodePosition(anchor.parentNodeId, nodes)
            x += parentAbsPos.x
            y += parentAbsPos.y
          }

          result.push({
            id: anchor.id,
            index: anchor.index,
            x,
            y,
          })
        }
      }

      // Sort by index
      result.sort((a, b) => a.index - b.index)
      return result
    },
    updateFilter: (prev, next) => {
      // Shallow array comparison
      if (prev.length !== next.length)
        return true
      for (let i = 0; i < prev.length; i++) {
        if (prev[i].x !== next[i].x || prev[i].y !== next[i].y || prev[i].id !== next[i].id) {
          return true
        }
      }
      return false
    },
  })
}
