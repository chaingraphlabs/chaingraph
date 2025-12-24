/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import { useUnit } from 'effector-react'
import { memo, useCallback, useState } from 'react'
import { $selectedAnchorId, selectAnchor, startDraggingAnchor, stopDraggingAnchor } from '@/store/edges/anchor-selection'
import { onAnchorDragEnd } from '@/store/edges/anchors'

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

/**
 * Draggable anchor handle for edge path customization
 * Supports both real anchors and ghost anchors (midpoints)
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

    const handleMouseMove = (e: MouseEvent) => {
      // Convert current screen position to flow position
      const currentFlow = screenToFlowPosition({ x: e.clientX, y: e.clientY })
      const dx = currentFlow.x - startFlow.x
      const dy = currentFlow.y - startFlow.y
      onDrag(id, anchorX + dx, anchorY + dy)
    }

    const handleMouseUp = () => {
      setIsDragging(false)
      stopDraggingAnchor()
      onDragEnd(id)
      // Fire immediate sync on drag end to guarantee final state is sent
      onAnchorDragEnd(edgeId)
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
  }, [id, edgeId, x, y, isGhost, screenToFlowPosition, onDrag, onDragEnd])

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

  return (
    <circle
      cx={x}
      cy={y}
      r={isGhost ? 6 : 8}
      fill={isDragging || isSelected ? edgeColor : (isGhost ? 'white' : edgeColor)}
      stroke={isGhost ? edgeColor : 'white'}
      strokeWidth={2}
      opacity={isGhost ? 0.5 : 1}
      style={{ cursor: isGhost ? 'crosshair' : 'grab', pointerEvents: 'auto' }}
      onMouseDown={handleMouseDown}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
    />
  )
})

AnchorHandle.displayName = 'AnchorHandle'
