/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { Node } from '@xyflow/react'
import { $nodes } from '@/store'
import { useCategories } from '@/store/categories'
import { NODE_CATEGORIES } from '@badaitech/chaingraph-nodes'
import { DefaultPosition } from '@badaitech/chaingraph-types'
import { useUnit } from 'effector-react'
import { useMemo } from 'react'

/**
 * Hook to transform flow nodes into ReactFlow nodes
 */
export function useFlowNodes() {
  const nodes = useUnit($nodes)
  // const updateNodeInternals = useUpdateNodeInternals()

  const { getCategoryMetadata } = useCategories()

  // Transform flow nodes into ReactFlow nodes
  return useMemo(() => {
    if (!nodes) {
      return []
    }

    // sort nodes to have groups first and then chaingraph nodes
    const sortedNodes = Object.values(nodes).sort((a, b) => {
      if (a.metadata.category === NODE_CATEGORIES.GROUP) {
        return -1
      }
      if (b.metadata.category === NODE_CATEGORIES.GROUP) {
        return 1
      }
      return 0
    })

    return sortedNodes.map((node): Node => {
      const categoryMetadata = getCategoryMetadata(node.metadata.category!)

      const nodeType
        = node.metadata.category === NODE_CATEGORIES.GROUP
          ? 'groupNode'
          : 'chaingraphNode'

      const nodePositionRound = {
        x: Math.round(node.metadata.ui?.position?.x ?? DefaultPosition.x),
        y: Math.round(node.metadata.ui?.position?.y ?? DefaultPosition.y),
      }

      const reactflowNode: Node = {
        id: node.id,
        type: nodeType,
        position: nodePositionRound,
        zIndex: nodeType === 'groupNode' ? -1 : 0,
        data: {
          node,
          categoryMetadata,
        },
        parentId: node.metadata.parentNodeId,
        selected: node.metadata.ui?.state?.isSelected ?? false,
      }

      // set dimensions
      if (node.metadata.ui?.dimensions && node.metadata.ui.dimensions.width > 0 && node.metadata.ui.dimensions.height > 0) {
        reactflowNode.width = node.metadata.ui.dimensions.width
        reactflowNode.height = node.metadata.ui.dimensions.height
      }

      return reactflowNode
    })
  }, [nodes, getCategoryMetadata])
}
