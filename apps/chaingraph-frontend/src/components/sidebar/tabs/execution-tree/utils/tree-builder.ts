/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { ExecutionTreeNode } from '@badaitech/chaingraph-executor/types'

/**
 * Build a tree structure from flat execution nodes
 * This is used when we have fetched a complete tree from getExecutionsTree
 * and need to organize it hierarchically
 */
export function buildExecutionTree(nodes: ExecutionTreeNode[]): ExecutionTreeNode[] {
  // Find root nodes (nodes without parent or with parent not in the list)
  const nodeIds = new Set(nodes.map(n => n.id))
  const rootNodes = nodes.filter(node => 
    !node.parentId || !nodeIds.has(node.parentId)
  )
  
  return rootNodes
}

/**
 * Get immediate children of a node
 */
export function getNodeChildren(nodes: ExecutionTreeNode[], parentId: string): ExecutionTreeNode[] {
  return nodes.filter(node => node.parentId === parentId)
}

/**
 * Count total descendants of a node
 */
export function countDescendants(nodes: ExecutionTreeNode[], nodeId: string): number {
  const children = getNodeChildren(nodes, nodeId)
  let count = children.length
  
  for (const child of children) {
    count += countDescendants(nodes, child.id)
  }
  
  return count
}

/**
 * Get max depth level from a node
 */
export function getMaxDepth(nodes: ExecutionTreeNode[], nodeId: string, currentDepth = 0): number {
  const children = getNodeChildren(nodes, nodeId)
  
  if (children.length === 0) {
    return currentDepth
  }
  
  let maxDepth = currentDepth
  for (const child of children) {
    const childDepth = getMaxDepth(nodes, child.id, currentDepth + 1)
    maxDepth = Math.max(maxDepth, childDepth)
  }
  
  return maxDepth
}