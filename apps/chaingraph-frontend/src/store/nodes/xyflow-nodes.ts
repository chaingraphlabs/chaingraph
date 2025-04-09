/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { INode } from '@badaitech/chaingraph-types'
import type { Node } from '@xyflow/react'
import { $nodes } from '@/store'
import { $categoryMetadata } from '@/store/categories/stores'
import { $nodePositions } from '@/store/nodes/node-positions'
import { NODE_CATEGORIES } from '@badaitech/chaingraph-nodes'
import { DefaultPosition } from '@badaitech/chaingraph-types'
import { combine } from 'effector'

/**
 * Enhanced store for XYFlow nodes that preserves node references when only positions change.
 * This significantly reduces unnecessary re-renders.
 */
export const $xyflowNodes = combine(
  $nodes,
  $categoryMetadata,
  $nodePositions,
  (nodes, categoryMetadata, nodePositions) => {
    if (!nodes || Object.keys(nodes).length === 0) {
      return []
    }

    // Create a cache for already created XYFlow nodes to preserve references
    const nodeCache = new Map<string, Node>()

    // Helper function to get category metadata within this computation
    const getCategoryMetadata = (categoryId: string) =>
      categoryMetadata.get(categoryId) ?? categoryMetadata.get(NODE_CATEGORIES.OTHER)!

    // Sort nodes to have groups first, then regular nodes
    const sortedNodes = Object.values(nodes).sort((a, b) => {
      if (a.metadata.category === NODE_CATEGORIES.GROUP)
        return -1
      if (b.metadata.category === NODE_CATEGORIES.GROUP)
        return 1
      return 0
    })

    // Transform to XYFlow node format
    return sortedNodes.map((node): Node => {
      const nodeId = node.id
      const nodeCategoryMetadata = getCategoryMetadata(node.metadata.category!)
      const nodeType = node.metadata.category === NODE_CATEGORIES.GROUP
        ? 'groupNode'
        : 'chaingraphNode'

      // Get position from the positions store if available
      const position = nodePositions[nodeId] || node.metadata.ui?.position || DefaultPosition

      // Round positions to integers for better rendering performance
      const nodePositionRound = {
        x: Math.round(position.x),
        y: Math.round(position.y),
      }

      // Get existing node from cache if it exists and hasn't changed
      const cacheKey = `${nodeId}-${node.getVersion()}`
      const cachedNode = nodeCache.get(cacheKey)

      // Check if we can reuse the cached node (only position might have changed)
      if (cachedNode
        && (cachedNode.data.node as INode).getVersion() === node.getVersion()
        && cachedNode.parentId === node.metadata.parentNodeId
        && cachedNode.selected === (node.metadata.ui?.state?.isSelected ?? false)) {
        // If only the position changed, just update that and return the same node reference
        if (cachedNode.position.x !== nodePositionRound.x
          || cachedNode.position.y !== nodePositionRound.y) {
          cachedNode.position = nodePositionRound
        }

        return cachedNode
      }

      // Create a new node
      const reactflowNode: Node = {
        id: nodeId,
        type: nodeType,
        position: nodePositionRound,
        zIndex: nodeType === 'groupNode' ? -1 : 0,
        data: {
          node,
          categoryMetadata: nodeCategoryMetadata,
        },
        parentId: node.metadata.parentNodeId,
        selected: node.metadata.ui?.state?.isSelected ?? false,
      }

      // Set dimensions if available
      if (
        node.metadata.ui?.dimensions
        && node.metadata.ui.dimensions.width > 0
        && node.metadata.ui.dimensions.height > 0
      ) {
        reactflowNode.width = node.metadata.ui.dimensions.width
        reactflowNode.height = node.metadata.ui.dimensions.height
      }

      // Store in cache for future reference
      nodeCache.set(cacheKey, reactflowNode)

      return reactflowNode
    })
  },
)
