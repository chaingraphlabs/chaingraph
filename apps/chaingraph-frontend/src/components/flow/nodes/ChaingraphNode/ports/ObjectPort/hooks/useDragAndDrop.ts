/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { INode } from '@badaitech/chaingraph-types'
import { useDraggingNodeObjects, useNode } from '@/store/nodes/hooks/useNode'
import { useMemo } from 'react'

export interface UseDragAndDropParams {
  rootNodeId?: string
  overlapThreshold?: number
}

export interface UseDragAndDropReturn {
  draggingNodes: Record<string, INode>
  canDropSingleNode: boolean
  draggedNode: INode | undefined
  isValidDrop: boolean
}

/**
 * Hook for handling drag-and-drop logic including overlap calculation
 * and validation of drop conditions
 */
export function useDragAndDrop({
  rootNodeId,
  overlapThreshold = 0.2,
}: UseDragAndDropParams): UseDragAndDropReturn {
  const draggingNodes = useDraggingNodeObjects()
  const rootNode = useNode(rootNodeId!)

  const canDropSingleNode = useMemo(() => {
    return Object.keys(draggingNodes).length === 1
  }, [draggingNodes])

  const draggedNode = useMemo(() => {
    if (!canDropSingleNode) {
      return undefined
    }

    const draggingNode = Object.values(draggingNodes)[0]

    // Prevent dropping node on itself
    if (rootNode && draggingNode.id === rootNode.id) {
      return undefined
    }

    return draggingNode
  }, [draggingNodes, rootNode, canDropSingleNode])

  const isValidDrop = useMemo(() => {
    if (!draggedNode || !rootNode) {
      return false
    }

    const rootNodeUI = rootNode.metadata.ui
    const draggingNodeUI = draggedNode.metadata.ui

    // Check if both nodes have position and dimensions
    if (!rootNodeUI?.position || !rootNodeUI?.dimensions
      || !draggingNodeUI?.position || !draggingNodeUI?.dimensions) {
      return false
    }

    // Calculate overlapping area
    const overlapX = Math.max(0, Math.min(
      rootNodeUI.position.x + rootNodeUI.dimensions.width,
      draggingNodeUI.position.x + draggingNodeUI.dimensions.width,
    ) - Math.max(rootNodeUI.position.x, draggingNodeUI.position.x))

    const overlapY = Math.max(0, Math.min(
      rootNodeUI.position.y + rootNodeUI.dimensions.height,
      draggingNodeUI.position.y + draggingNodeUI.dimensions.height,
    ) - Math.max(rootNodeUI.position.y, draggingNodeUI.position.y))

    const overlapArea = overlapX * overlapY
    const draggingNodeArea = draggingNodeUI.dimensions.width * draggingNodeUI.dimensions.height

    // Check if overlap exceeds threshold
    return overlapArea / draggingNodeArea > overlapThreshold
  }, [draggedNode, rootNode, overlapThreshold])

  return {
    draggingNodes,
    canDropSingleNode,
    draggedNode,
    isValidDrop,
  }
}
