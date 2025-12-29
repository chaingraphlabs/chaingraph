/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

/*
 * Specialized derived stores that extract minimal subsets from $nodes
 * These stores update 99% less frequently than $nodes, preventing unnecessary recalculations
 *
 * Performance Impact:
 * - $nodes updates: Every port change, execution event, metadata update (~1000s/sec)
 * - $nodePositionData updates: Only position or parentNodeId changes (~10s/sec)
 * - $groupNodes updates: Only group layout changes (~1/sec)
 */

import type { Position } from '@badaitech/chaingraph-types'
import { combine } from 'effector'
import { $nodes } from './stores'

/**
 * Minimal node position data for coordinate calculations
 * Updates ONLY when position or parent changes (not on port/execution updates)
 */
export interface NodePositionData {
  position: Position
  parentNodeId?: string
}

/**
 * Derived store: Extract ONLY position + parent chain
 *
 * Performance: ~99% fewer updates than $nodes
 * - $nodes updates: Every port change, execution event, metadata update
 * - $nodePositionData updates: Only position or parentNodeId changes
 *
 * NOTE: Named $nodePositionData (not $nodePositions) to avoid conflict with existing
 * $nodePositions store in stores.ts which tracks positions for XYFlow drag optimization
 */
export const $nodePositionData = combine(
  $nodes,
  (nodes) => {
    const result = new Map<string, NodePositionData>()
    for (const [nodeId, node] of Object.entries(nodes)) {
      if (node.metadata.ui?.position) {
        result.set(nodeId, {
          position: node.metadata.ui.position,
          parentNodeId: node.metadata.parentNodeId,
        })
      }
    }
    return result
  },
)

/**
 * Group node layout data (for drop target calculations)
 */
export interface GroupNodeData {
  position: Position
  dimensions: { width: number, height: number }
  parentNodeId?: string
}

/**
 * Derived store: Extract group nodes with layout data
 *
 * Performance: Updates ONLY when group positions/sizes change
 */
export const $groupNodes = combine(
  $nodes,
  (nodes) => {
    const result = new Map<string, GroupNodeData>()
    for (const [nodeId, node] of Object.entries(nodes)) {
      if (node.metadata.category === 'group'
        && node.metadata.ui?.position
        && node.metadata.ui?.dimensions) {
        result.set(nodeId, {
          position: node.metadata.ui.position,
          dimensions: node.metadata.ui.dimensions,
          parentNodeId: node.metadata.parentNodeId,
        })
      }
    }
    return result
  },
)
