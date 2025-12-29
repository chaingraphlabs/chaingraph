/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { INode } from '@badaitech/chaingraph-types'
import type { AnchorNodeState } from '../edges/anchor-nodes'
import type { EdgeData } from '../edges/types'

export interface Position {
  x: number
  y: number
}

/**
 * Get all children of a node recursively
 */
export function getAllChildrenRecursive(nodeId: string, nodes: Record<string, INode>): INode[] {
  const children: INode[] = []

  Object.values(nodes).forEach((node) => {
    if (node.metadata.parentNodeId === nodeId) {
      children.push(node)
      children.push(...getAllChildrenRecursive(node.id, nodes))
    }
  })

  return children
}

/**
 * Calculate absolute position of a node including all parent positions
 */
export function getAbsolutePosition(node: INode, nodes: Record<string, INode>): Position {
  const position = { ...(node.metadata.ui?.position || { x: 0, y: 0 }) }
  let currentNode = node

  while (currentNode.metadata.parentNodeId) {
    const parent = nodes[currentNode.metadata.parentNodeId]
    if (!parent)
      break

    const parentPos = parent.metadata.ui?.position || { x: 0, y: 0 }
    position.x += parentPos.x
    position.y += parentPos.y

    currentNode = parent
  }

  return position
}

/**
 * Get selected nodes and include all their children
 */
export function getSelectedNodesWithChildren(
  selectedNodes: INode[],
  nodes: Record<string, INode>,
): INode[] {
  const nodesWithChildren = new Map<string, INode>()

  selectedNodes.forEach((node) => {
    nodesWithChildren.set(node.id, node)
  })

  selectedNodes.forEach((node) => {
    const children = getAllChildrenRecursive(node.id, nodes)
    children.forEach((child) => {
      nodesWithChildren.set(child.id, child)
    })
  })

  return Array.from(nodesWithChildren.values())
}

/**
 * Calculate virtual origin (top-left corner of bounding box)
 * Only uses root nodes to avoid double-counting
 */
export function calculateVirtualOrigin(nodes: INode[]): Position {
  if (nodes.length === 0) {
    return { x: 0, y: 0 }
  }

  let rootNodes = nodes.filter(node => !node.metadata.parentNodeId)
  if (rootNodes.length === 0) {
    rootNodes = nodes
  }

  let minX = Infinity
  let minY = Infinity

  for (const node of rootNodes) {
    const position = node.metadata.ui?.position || { x: 0, y: 0 }
    minX = Math.min(minX, position.x)
    minY = Math.min(minY, position.y)
  }

  return { x: minX, y: minY }
}

/**
 * Get internal edges (edges where both source and target are in the node set)
 */
export function getInternalEdges(nodeIds: Set<string>, edges: EdgeData[]): EdgeData[] {
  return edges.filter(edge =>
    nodeIds.has(edge.sourceNodeId) && nodeIds.has(edge.targetNodeId),
  )
}

/**
 * Adjust positions of orphaned nodes (nodes whose parents aren't in selection)
 */
export function adjustOrphanedNodePositions(
  nodes: INode[],
  selectedNodeIds: Set<string>,
  allNodes: Record<string, INode>,
): INode[] {
  return nodes.map((node) => {
    const clonedNode = node.clone()

    if (node.metadata.parentNodeId && !selectedNodeIds.has(node.metadata.parentNodeId)) {
      const absolutePosition = getAbsolutePosition(node, allNodes)
      clonedNode.setPosition(absolutePosition, false)
      clonedNode.metadata.parentNodeId = undefined
    }

    return clonedNode
  })
}

/**
 * Get anchors for a set of edges
 */
export function getAnchorsForEdges(
  edgeIds: Set<string>,
  anchorNodes: Map<string, AnchorNodeState>,
): Record<string, AnchorNodeState[]> {
  const anchorsByEdge: Record<string, AnchorNodeState[]> = {}

  for (const anchor of anchorNodes.values()) {
    if (edgeIds.has(anchor.edgeId)) {
      if (!anchorsByEdge[anchor.edgeId]) {
        anchorsByEdge[anchor.edgeId] = []
      }
      anchorsByEdge[anchor.edgeId].push(anchor)
    }
  }

  // Sort anchors by index
  for (const edgeId in anchorsByEdge) {
    anchorsByEdge[edgeId].sort((a, b) => a.index - b.index)
  }

  return anchorsByEdge
}
