/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { EdgeData } from '@/store/edges/types'
import type { INode } from '@badaitech/chaingraph-types'
import { useCallback } from 'react'

/**
 * Position coordinates
 */
export interface Position {
  x: number
  y: number
}

/**
 * Node selection utilities
 */
export interface NodeSelectionUtilities {
  /** Get all children of a node recursively */
  getAllChildrenRecursive: (nodeId: string) => INode[]
  /** Calculate absolute position including all parent positions */
  getAbsolutePosition: (node: INode) => Position
  /** Get selected nodes and automatically include their children */
  getSelectedNodesWithChildren: (selectedNodes: INode[]) => INode[]
  /** Calculate the virtual origin (top-left corner) using only root nodes */
  calculateVirtualOrigin: (nodes: INode[]) => Position
  /** Get internal edges between a set of nodes */
  getInternalEdges: (nodeIds: Set<string>, edges: EdgeData[]) => EdgeData[]
  /** Adjust positions of nodes whose parents aren't included in selection */
  adjustOrphanedNodePositions: (nodes: INode[], selectedNodeIds: Set<string>) => INode[]
}

/**
 * Hook parameters
 */
export interface UseNodeSelectionParams {
  /** All nodes in the flow */
  nodes: Record<string, INode>
}

/**
 * Hook for node selection utilities shared between copy/paste and export/import operations.
 *
 * This hook provides common functions for:
 * - Traversing node hierarchies (getting children recursively)
 * - Calculating positions (absolute positions including parent offsets)
 * - Handling node selections (including automatic child inclusion)
 * - Managing orphaned nodes (nodes whose parents aren't in the selection)
 *
 * @param params - Hook parameters
 * @returns Node selection utilities
 */
export function useNodeSelection({ nodes }: UseNodeSelectionParams): NodeSelectionUtilities {
  /**
   * Get all children of a node recursively.
   * Traverses the entire node tree to find all descendants of a given node.
   *
   * @param nodeId - The ID of the parent node
   * @returns Array of all child nodes (direct and indirect)
   */
  const getAllChildrenRecursive = useCallback((nodeId: string): INode[] => {
    const children: INode[] = []

    // Find direct children
    Object.values(nodes).forEach((node) => {
      if (node.metadata.parentNodeId === nodeId) {
        children.push(node)
        // Recursively get children of this child
        children.push(...getAllChildrenRecursive(node.id))
      }
    })

    return children
  }, [nodes])

  /**
   * Calculate the absolute position of a node including all parent positions.
   * Traverses up the parent chain and sums all positions to get the global position.
   *
   * @param node - The node to calculate position for
   * @returns Absolute position in the flow
   */
  const getAbsolutePosition = useCallback((node: INode): Position => {
    const position = { ...(node.metadata.ui?.position || { x: 0, y: 0 }) }
    let currentNode = node

    // Traverse up the parent chain and sum positions
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
  }, [nodes])

  /**
   * Get selected nodes and automatically include all their children.
   * This ensures that when a parent is selected, all its descendants are included.
   *
   * @param selectedNodes - Array of initially selected nodes
   * @returns Array of selected nodes plus all their children
   */
  const getSelectedNodesWithChildren = useCallback((selectedNodes: INode[]): INode[] => {
    const nodesWithChildren = new Map<string, INode>()

    // Add all selected nodes
    selectedNodes.forEach((node) => {
      nodesWithChildren.set(node.id, node)
    })

    // Add all children of selected nodes
    selectedNodes.forEach((node) => {
      const children = getAllChildrenRecursive(node.id)
      children.forEach((child) => {
        nodesWithChildren.set(child.id, child)
      })
    })

    return Array.from(nodesWithChildren.values())
  }, [getAllChildrenRecursive])

  /**
   * Calculate the virtual origin (top-left corner of bounding box).
   * Only uses root nodes (nodes without parents) for calculation to avoid
   * double-counting positions of nested nodes.
   *
   * @param nodes - Array of nodes to calculate origin for
   * @returns Virtual origin position
   */
  const calculateVirtualOrigin = useCallback((nodes: INode[]): Position => {
    if (nodes.length === 0) {
      return { x: 0, y: 0 }
    }

    // Find root nodes (nodes without parents)
    let rootNodes = nodes.filter(node => !node.metadata.parentNodeId)

    // If no root nodes exist (e.g., only copying child nodes),
    // use all nodes as the root layer
    if (rootNodes.length === 0) {
      rootNodes = nodes
    }

    let minX = Infinity
    let minY = Infinity

    // Calculate virtual origin only from root nodes
    for (const node of rootNodes) {
      const position = node.metadata.ui?.position || { x: 0, y: 0 }
      minX = Math.min(minX, position.x)
      minY = Math.min(minY, position.y)
    }

    return { x: minX, y: minY }
  }, [])

  /**
   * Get internal edges - edges where both source and target are in the provided node set.
   * Useful for copying/exporting only the edges that connect selected nodes.
   *
   * @param nodeIds - Set of node IDs to check
   * @param edges - All edges to filter from
   * @returns Array of internal edges
   */
  const getInternalEdges = useCallback((nodeIds: Set<string>, edges: EdgeData[]): EdgeData[] => {
    return edges.filter(edge =>
      nodeIds.has(edge.sourceNodeId) && nodeIds.has(edge.targetNodeId),
    )
  }, [])

  /**
   * Adjust positions of orphaned nodes (nodes whose parents aren't included in selection).
   * When a child node is selected but its parent isn't, the child's position needs to be
   * converted from relative (to parent) to absolute (in flow).
   *
   * @param nodes - Array of nodes to process
   * @param selectedNodeIds - Set of selected node IDs
   * @returns Array of nodes with adjusted positions (cloned to avoid mutations)
   */
  const adjustOrphanedNodePositions = useCallback((nodes: INode[], selectedNodeIds: Set<string>): INode[] => {
    return nodes.map((node) => {
      // Clone the node to avoid modifying the original
      const clonedNode = node.clone()

      // Check if this node has a parent that's not in the selection
      if (node.metadata.parentNodeId && !selectedNodeIds.has(node.metadata.parentNodeId)) {
        // Calculate absolute position for this node
        const absolutePos = getAbsolutePosition(node)
        clonedNode.metadata.ui = {
          ...clonedNode.metadata.ui,
          position: absolutePos,
        }
        // Remove parent reference since parent is not included
        clonedNode.metadata.parentNodeId = undefined
      }

      return clonedNode
    })
  }, [getAbsolutePosition])

  return {
    getAllChildrenRecursive,
    getAbsolutePosition,
    getSelectedNodesWithChildren,
    calculateVirtualOrigin,
    getInternalEdges,
    adjustOrphanedNodePositions,
  }
}
