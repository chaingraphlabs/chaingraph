/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

/*
 * Anchor Coordinate Transformation Utilities
 * Handles conversion between absolute and relative coordinates for anchors with parent groups
 *
 * CRITICAL: Uses NodePositionData (minimal subset) instead of full INode
 * This allows the functions to work with specialized $nodePositionData store
 * for maximum performance (99% fewer updates)
 */

import type { EdgeAnchor, Position } from '@badaitech/chaingraph-types'
import type { NodePositionData } from '@/store/nodes/derived-stores'
import { getNodePositionInFlow, getNodePositionInsideParent } from '@/components/flow/utils/node-position'

/**
 * Get absolute position of anchor (accounting for parent chain)
 *
 * CRITICAL: Handles nested groups by traversing up the parent chain
 *
 * @param anchor - Anchor to get absolute position for
 * @param nodePositionData - Map of minimal node position data
 * @returns Absolute position in flow coordinate space
 */
export function getAnchorAbsolutePosition(
  anchor: EdgeAnchor,
  nodePositionData: Map<string, NodePositionData>,
): Position {
  // No parent → already absolute
  if (!anchor.parentNodeId) {
    return { x: anchor.x, y: anchor.y }
  }

  const parent = nodePositionData.get(anchor.parentNodeId)
  if (!parent) {
    console.warn(`[anchor-coordinates] Parent node ${anchor.parentNodeId} not found for anchor ${anchor.id}`)
    return { x: anchor.x, y: anchor.y }
  }

  // Get parent's absolute position (handles nested groups recursively)
  const parentAbsolutePos = getAbsoluteNodePosition(anchor.parentNodeId, nodePositionData)
  if (!parentAbsolutePos) {
    return { x: anchor.x, y: anchor.y }
  }

  // Convert relative to absolute: absolute = relative + parentAbsolute
  return {
    x: parentAbsolutePos.x + anchor.x,
    y: parentAbsolutePos.y + anchor.y,
  }
}

/**
 * Convert anchor from absolute to relative coordinates
 *
 * @param anchorAbsolutePos - Anchor's absolute position
 * @param parentNodeId - Parent group node ID
 * @param nodePositionData - Map of minimal node position data
 * @returns Relative position inside parent
 */
export function makeAnchorRelative(
  anchorAbsolutePos: Position,
  parentNodeId: string,
  nodePositionData: Map<string, NodePositionData>,
): Position {
  const parent = nodePositionData.get(parentNodeId)
  if (!parent) {
    console.warn(`[anchor-coordinates] Parent node ${parentNodeId} not found`)
    return anchorAbsolutePos
  }

  const parentAbsolutePos = getAbsoluteNodePosition(parentNodeId, nodePositionData)
  if (!parentAbsolutePos) {
    return anchorAbsolutePos
  }

  // Convert absolute to relative: relative = absolute - parentAbsolute
  return getNodePositionInsideParent(anchorAbsolutePos, parentAbsolutePos)
}

/**
 * Get absolute position of node (handles nested groups)
 *
 * @param nodeId - Node ID
 * @param nodePositionData - Map of minimal node position data
 * @returns Absolute position or null if not found
 */
export function getAbsoluteNodePosition(
  nodeId: string,
  nodePositionData: Map<string, NodePositionData>,
): Position | null {
  const node = nodePositionData.get(nodeId)
  if (!node)
    return null

  let absolutePosition = { ...node.position }
  let currentNodeId = nodeId

  // Traverse up parent chain, accumulating positions
  while (true) {
    const current = nodePositionData.get(currentNodeId)
    if (!current?.parentNodeId)
      break

    const parent = nodePositionData.get(current.parentNodeId)
    if (!parent)
      break

    absolutePosition = getNodePositionInFlow(absolutePosition, parent.position)
    currentNodeId = current.parentNodeId
  }

  return absolutePosition
}

/**
 * Calculate depth of a node in the parent hierarchy
 * Used for drop priority calculations
 *
 * @param nodeId - Node ID
 * @param nodePositionData - Map of minimal node position data
 * @returns Depth level (0 = root, higher = deeper nested)
 */
export function calculateNodeDepth(
  nodeId: string,
  nodePositionData: Map<string, NodePositionData>,
): number {
  let depth = 0
  let currentId = nodeId

  while (true) {
    const node = nodePositionData.get(currentId)
    if (!node?.parentNodeId)
      break
    depth++
    currentId = node.parentNodeId
  }

  return depth
}
