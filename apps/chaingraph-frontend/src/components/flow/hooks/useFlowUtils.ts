/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { INode } from '@badaitech/chaingraph-types'

/**
 * Utility functions for flow operations
 */

export function isPointInBounds(
  point: { x: number, y: number },
  bounds: { x: number, y: number, width: number, height: number },
) {
  return point.x >= bounds.x
    && point.x <= bounds.x + bounds.width
    && point.y >= bounds.y
    && point.y <= bounds.y + bounds.height
}

export function isValidPosition(pos: any): pos is { x: number, y: number } {
  return pos
    && typeof pos.x === 'number'
    && typeof pos.y === 'number'
    && !Number.isNaN(pos.x)
    && !Number.isNaN(pos.y)
    && Number.isFinite(pos.x)
    && Number.isFinite(pos.y)
}

export function roundPosition(pos: { x: number, y: number }, precision = 1) {
  return {
    x: Math.round(pos.x / precision) * precision,
    y: Math.round(pos.y / precision) * precision,
  }
}

/**
 * Calculate the depth of a node in the parent-child hierarchy
 * Root nodes have depth 0, children have depth 1, etc.
 */
export function calculateNodeDepth(nodeId: string, nodes: Record<string, INode>): number {
  const node = nodes[nodeId]
  if (!node)
    return 0

  let depth = 0
  let currentNode = node

  // Traverse up the parent chain
  while (currentNode.metadata.parentNodeId) {
    const parentNode = nodes[currentNode.metadata.parentNodeId]
    if (!parentNode)
      break // Avoid infinite loops with invalid parents

    depth++
    currentNode = parentNode

    // Safety check to prevent infinite loops
    if (depth > 10) {
      console.warn('Maximum depth reached, possible circular parent reference')
      break
    }
  }

  return depth
}

/**
 * Calculate priority for drop targets
 * Schema drops get base priority + depth, groups get just depth
 */
export function calculateDropPriority(target: { type: 'group' | 'schema', depth: number }): number {
  const basePriority = target.type === 'schema' ? 1000 : 0 // Schema drops have much higher base priority
  return basePriority + target.depth
}

/**
 * Check if setting a parent would create a circular dependency
 * Returns true if the proposed parent relationship would create a cycle
 */
export function wouldCreateCircularDependency(
  nodeId: string,
  proposedParentId: string,
  nodes: Record<string, INode>,
): boolean {
  // Can't be parent of yourself
  if (nodeId === proposedParentId)
    return true

  // Check if the proposed parent is actually a descendant of the node
  let currentNode = nodes[proposedParentId]
  const visited = new Set<string>()

  while (currentNode && currentNode.metadata.parentNodeId) {
    const parentId = currentNode.metadata.parentNodeId

    // Found a cycle
    if (parentId === nodeId)
      return true

    // Prevent infinite loops with circular references
    if (visited.has(parentId))
      break
    visited.add(parentId)

    currentNode = nodes[parentId]
  }

  return false
}
