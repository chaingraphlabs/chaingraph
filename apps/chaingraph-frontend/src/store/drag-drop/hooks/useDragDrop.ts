/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { Position } from '@badaitech/chaingraph-types'
import type { DropTarget, NodeDragEndEvent, NodeDragMoveEvent, NodeDragStartEvent } from '../types'
import { useUnit } from 'effector-react'
import { useCallback } from 'react'
import {
  $dragDropRenderState,
  clearDropTargets,
  endMultiNodeDrag,
  endNodeDrag,
  startMultiNodeDrag,
  startNodeDrag,
  updateMousePosition,
  updateMultiNodeDragPosition,
  updateNodeDragPosition,
  updatePotentialDropTargets,
} from '../stores'

/**
 * Hook for managing drag and drop state
 * OPTIMIZED: Uses render-safe state without mousePosition
 */
export function useDragDrop() {
  const renderState = useUnit($dragDropRenderState)

  // Start dragging nodes
  const handleStartDrag = useCallback((nodes: NodeDragStartEvent | NodeDragStartEvent[]) => {
    if (Array.isArray(nodes)) {
      startMultiNodeDrag(nodes)
    } else {
      startNodeDrag(nodes)
    }
  }, [])

  // Update drag position
  const handleUpdateDragPosition = useCallback((updates: NodeDragMoveEvent | NodeDragMoveEvent[]) => {
    if (Array.isArray(updates)) {
      updateMultiNodeDragPosition(updates)
    } else {
      updateNodeDragPosition(updates)
    }
  }, [])

  // End drag
  const handleEndDrag = useCallback((nodes: NodeDragEndEvent | NodeDragEndEvent[]) => {
    if (Array.isArray(nodes)) {
      endMultiNodeDrag(nodes)
    } else {
      endNodeDrag(nodes)
    }
  }, [])

  // Update potential drop targets
  const handleUpdateDropTargets = useCallback((targets: DropTarget[]) => {
    updatePotentialDropTargets(targets)
  }, [])

  // Update mouse position
  const handleUpdateMousePosition = useCallback((position: Position) => {
    updateMousePosition(position)
  }, [])

  // Clear all drop targets
  const handleClearDropTargets = useCallback(() => {
    clearDropTargets()
  }, [])

  return {
    // State - NO mousePosition (components never use it for rendering)
    ...renderState,

    // Actions
    startDrag: handleStartDrag,
    updateDragPosition: handleUpdateDragPosition,
    endDrag: handleEndDrag,
    updateDropTargets: handleUpdateDropTargets,
    updateMousePosition: handleUpdateMousePosition,
    clearDropTargets: handleClearDropTargets,
  }
}

/**
 * Hook for getting drop feedback for a specific node
 * OPTIMIZED: Uses render-safe state
 */
export function useNodeDropFeedback(nodeId: string) {
  const renderState = useUnit($dragDropRenderState)

  const { hoveredDropTarget, canDrop, isDragging, potentialDropTargets } = renderState

  if (!isDragging)
    return null

  // Check if this node is a hovered drop target
  if (hoveredDropTarget && hoveredDropTarget.nodeId === nodeId && canDrop) {
    return {
      isDropTarget: true,
      dropType: hoveredDropTarget.type,
      canAcceptDrop: true,
    }
  }

  // Check if this node is a potential drop target (but not hovered)
  const potentialTarget = potentialDropTargets.find(t => t.nodeId === nodeId)
  if (potentialTarget) {
    return {
      isDropTarget: true,
      dropType: potentialTarget.type,
      canAcceptDrop: false,
    }
  }

  return null
}
