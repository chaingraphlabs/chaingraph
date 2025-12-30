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
import { $selectedEdgeId } from '@/store/edges/selection'
import { $edgeDepths } from '@/store/edges/stores'
import { calculateZIndex } from '../z-index-constants'
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
 * - Anchor zIndex is calculated based on EDGE depth (not parent group depth!)
 * - This ensures anchors render ABOVE their edges but BELOW nodes at same depth
 * - Selected anchors get boosted to 100,200 (SELECTION_BASE + 200)
 *
 * PERFORMANCE: Uses $edgeDepths (lightweight store) instead of $edgeRenderMap (hot path)
 * $edgeDepths only updates on edge add/remove or node reparenting (rare events)
 */
export const $combinedXYFlowNodesList = combine(
  $xyflowNodesList,
  $anchorXYFlowNodes,
  $selectedEdgeId,
  $edgeDepths,
  (regularNodes, anchorNodes, selectedEdgeId, edgeDepths): Node[] => {
    // Calculate zIndex for anchor nodes based on EDGE depth
    // Z-Index formula: depth * 1000 + 200 (anchors layer within depth band)
    // Selected anchors: 100,200 (floats above entire canvas)
    const anchorsWithZIndex = anchorNodes.map((anchor) => {
      // Get pre-computed edge depth (O(1) lookup)
      // This ensures anchor depth matches its edge's depth, NOT parent group's depth
      // Falls back to 0 if edge not found
      const anchorDepth = edgeDepths.get(anchor.data.edgeId) ?? 0

      // Anchor gets selection boost if:
      // 1. Anchor itself is selected, OR
      // 2. Anchor's parent edge is selected (so anchors stay above selected edge)
      const isAnchorSelected = anchor.selected ?? false
      const isParentEdgeSelected = anchor.data.edgeId === selectedEdgeId
      const shouldBoost = isAnchorSelected || isParentEdgeSelected

      const zIndex = calculateZIndex('anchor', anchorDepth, shouldBoost)

      // TEMP: Let XYFlow handle z-index natively (don't override)
      // return { ...anchor, zIndex }
      return anchor
    })

    // Anchor nodes come after regular nodes (rendered on top within same zIndex)
    return [...regularNodes, ...anchorsWithZIndex]
  },
)
