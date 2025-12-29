/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

/**
 * Combined Nodes List
 *
 * This file exists to break a circular dependency:
 *   xyflow-nodes-list → anchor-nodes → edges/stores → xyflow → xyflow-nodes-list
 *
 * By having the combination logic in a separate "leaf" module that nothing
 * else imports from (except UI components), we avoid the cycle.
 */

import type { Node } from '@xyflow/react'
import { combine } from 'effector'
import { $anchorXYFlowNodes } from '@/store/edges/anchor-nodes'
import { $nodeLayerDepth } from '@/store/nodes/stores'
import { $xyflowNodesList } from './xyflow-nodes-list'

/**
 * Combined XYFlow nodes list that includes both regular nodes and anchor nodes.
 *
 * Anchor nodes are XYFlow nodes used as edge waypoints. They:
 * - Are stored separately from regular INodes (no ports, execution, etc.)
 * - Get native XYFlow selection, drag, and parenting for free
 * - Are appended to the regular nodes list for rendering
 *
 * Z-Index calculation:
 * - Anchor zIndex is calculated based on parent depth to support nested groups
 * - This ensures anchors inside groups render at the correct layer
 */
export const $combinedXYFlowNodesList = combine(
  $xyflowNodesList,
  $anchorXYFlowNodes,
  $nodeLayerDepth,
  (regularNodes, anchorNodes, layerDepths): Node[] => {
    // Calculate zIndex for anchor nodes based on parent depth
    // This ensures anchors inside groups render at the correct layer
    // IMPORTANT: Base zIndex must be high (1000+) to render ABOVE edges
    // XYFlow edges typically render at z-index 0-100 range
    const anchorsWithZIndex = anchorNodes.map((anchor) => {
      // Base zIndex for root-level anchors - must be above edges (which are ~0-100)
      let zIndex = 1000
      if (anchor.parentId) {
        // If anchor has a parent group, use parent's depth + offset
        // This keeps anchors above their parent's edges but below nested groups
        const parentDepth = layerDepths[anchor.parentId] ?? 0
        zIndex = 1000 + (parentDepth + 1) * 10 // e.g., depth 0 = 1010, depth 1 = 1020, etc.
      }
      return { ...anchor, zIndex }
    })

    // Anchor nodes come after regular nodes (rendered on top within same zIndex)
    return [...regularNodes, ...anchorsWithZIndex]
  },
)
