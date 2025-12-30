/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import { useUnit } from 'effector-react'
import { memo, useCallback, useState } from 'react'
import {
  calculateNodeDepth,
  getAbsoluteNodePosition,
  getAnchorAbsolutePosition,
  makeAnchorRelative,
} from '@/store/edges/anchor-coordinates'
import { $selectedAnchorId, selectAnchor, startDraggingAnchor, stopDraggingAnchor } from '@/store/edges/anchor-selection'
import { $edgeAnchors, onAnchorDragEnd, setAnchorParent } from '@/store/edges/anchors'
import { $groupNodes, $nodePositionData } from '@/store/nodes/derived-stores'

interface AnchorHandleProps {
  id: string
  edgeId: string
  x: number
  y: number
  isGhost: boolean
  edgeColor: string
  screenToFlowPosition: (position: { x: number, y: number }) => { x: number, y: number }
  onDrag: (id: string, x: number, y: number) => void
  onDragEnd: (id: string) => void
  onDelete: (id: string) => void
}

interface DropTarget {
  nodeId: string
  bounds: { x: number, y: number, width: number, height: number }
  depth: number
}

/**
 * Draggable anchor handle for edge path customization
 * Supports both real anchors and ghost anchors (midpoints)
 *
 * Features:
 * - Drag to move anchor position
 * - Double-click to delete anchor
 * - Drop into group to parent anchor
 * - Drag out of group to unparent anchor
 */
export const AnchorHandle = memo(({
  id,
  edgeId,
  x,
  y,
  isGhost,
  edgeColor,
  screenToFlowPosition,
  onDrag,
  onDragEnd,
  onDelete,
}: AnchorHandleProps) => {
  const selectedAnchorId = useUnit($selectedAnchorId)
  const isSelected = selectedAnchorId === id
  const [isDragging, setIsDragging] = useState(false)
  const [hoveredGroupId, setHoveredGroupId] = useState<string | null>(null)

  // Subscribe to specialized stores for drop detection
  const groupNodes = useUnit($groupNodes)
  const nodePositionData = useUnit($nodePositionData)
  const edgeAnchors = useUnit($edgeAnchors)

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()
    setIsDragging(true)
    startDraggingAnchor()

    // Select this anchor (frontend-only)
    if (!isGhost) {
      selectAnchor(id)
    }

    // Convert screen position to flow position for proper zoom handling
    const startFlow = screenToFlowPosition({ x: e.clientX, y: e.clientY })
    const anchorX = x
    const anchorY = y

    // Pre-calculate drop targets from group nodes
    const dropTargets: DropTarget[] = []
    for (const [nodeId, groupData] of groupNodes) {
      const absolutePos = getAbsoluteNodePosition(nodeId, nodePositionData)
      if (!absolutePos)
        continue

      dropTargets.push({
        nodeId,
        bounds: {
          x: absolutePos.x,
          y: absolutePos.y,
          width: groupData.dimensions.width,
          height: groupData.dimensions.height,
        },
        depth: calculateNodeDepth(nodeId, nodePositionData),
      })
    }

    // Sort by depth descending (deepest groups first for nested group handling)
    dropTargets.sort((a, b) => b.depth - a.depth)

    const handleMouseMove = (e: MouseEvent) => {
      // Convert current screen position to flow position
      const currentFlow = screenToFlowPosition({ x: e.clientX, y: e.clientY })
      const dx = currentFlow.x - startFlow.x
      const dy = currentFlow.y - startFlow.y
      onDrag(id, anchorX + dx, anchorY + dy)

      // Check if hovering over any group
      let foundGroup: string | null = null
      for (const target of dropTargets) {
        const { x: tx, y: ty, width, height } = target.bounds
        if (
          currentFlow.x >= tx
          && currentFlow.x <= tx + width
          && currentFlow.y >= ty
          && currentFlow.y <= ty + height
        ) {
          foundGroup = target.nodeId
          break // Take first match (deepest due to sort)
        }
      }
      setHoveredGroupId(foundGroup)
    }

    const handleMouseUp = (e: MouseEvent) => {
      const currentFlow = screenToFlowPosition({ x: e.clientX, y: e.clientY })

      // Check if dropped on a group
      let droppedOnGroup: string | null = null
      for (const target of dropTargets) {
        const { x: tx, y: ty, width, height } = target.bounds
        if (
          currentFlow.x >= tx
          && currentFlow.x <= tx + width
          && currentFlow.y >= ty
          && currentFlow.y <= ty + height
        ) {
          droppedOnGroup = target.nodeId
          break
        }
      }

      // Get current anchor state
      const currentAnchor = edgeAnchors.get(edgeId)?.anchors.find(a => a.id === id)

      if (droppedOnGroup && !isGhost) {
        // Dropped on group → make anchor a child
        const relativePos = makeAnchorRelative(currentFlow, droppedOnGroup, nodePositionData)

        setAnchorParent({
          edgeId,
          anchorId: id,
          parentNodeId: droppedOnGroup,
          x: relativePos.x,
          y: relativePos.y,
        })
      } else if (currentAnchor?.parentNodeId && !droppedOnGroup && !isGhost) {
        // Dragged out of group → convert to absolute
        const absolutePos = getAnchorAbsolutePosition(currentAnchor, nodePositionData)

        setAnchorParent({
          edgeId,
          anchorId: id,
          parentNodeId: undefined,
          x: absolutePos.x,
          y: absolutePos.y,
        })
      }

      setIsDragging(false)
      setHoveredGroupId(null)
      stopDraggingAnchor()
      onDragEnd(id)
      // Fire immediate sync on drag end to guarantee final state is sent
      onAnchorDragEnd(edgeId)
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
  }, [id, edgeId, x, y, isGhost, screenToFlowPosition, onDrag, onDragEnd, groupNodes, nodePositionData, edgeAnchors])

  const handleDoubleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    if (!isGhost) {
      onDelete(id)
    }
  }, [id, isGhost, onDelete])

  const handleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    if (!isGhost) {
      selectAnchor(id)
    }
  }, [id, isGhost])

  // Visual feedback when hovering over a group during drag
  const isHoveringGroup = hoveredGroupId !== null

  return (
    <circle
      cx={x}
      cy={y}
      r={isGhost ? 6 : 8}
      fill={isDragging || isSelected ? edgeColor : (isGhost ? 'white' : edgeColor)}
      stroke={isHoveringGroup ? '#22c55e' : (isGhost ? edgeColor : 'white')}
      strokeWidth={isHoveringGroup ? 3 : 2}
      opacity={isGhost ? 0.5 : 1}
      style={{ cursor: isGhost ? 'crosshair' : 'grab', pointerEvents: 'auto' }}
      onMouseDown={handleMouseDown}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
    />
  )
})

AnchorHandle.displayName = 'AnchorHandle'
