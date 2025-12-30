/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { Position } from '@badaitech/chaingraph-types'

export interface DraggedNode {
  id: string
  position: Position
  absolutePosition: Position
  width: number
  height: number
}

export interface DropTarget {
  nodeId: string
  type: 'group' | 'schema'
  bounds: {
    x: number
    y: number
    width: number
    height: number
  }
  depth: number
  priority: number
  portId?: string // For schema drops
}

/**
 * Render-safe drag-drop state (no mousePosition, no draggedNodes)
 * This is what components and WIRE 6 should subscribe to
 * Updates only when visually relevant data changes (~10-15 times during drag)
 *
 * Note: draggedNodes removed - position updates are handled by WIRE 1 via $nodePositions
 */
export interface DragDropRenderState {
  isDragging: boolean
  // draggedNodes removed - positions handled by WIRE 1
  potentialDropTargets: DropTarget[]
  hoveredDropTarget: DropTarget | null
  canDrop: boolean
}

/**
 * Full drag-drop state including mousePosition
 * @deprecated Only for internal calculation, don't use in components
 */
export interface DragDropState extends DragDropRenderState {
  mousePosition: Position | null
}

export interface NodeDragStartEvent {
  nodeId: string
  position: Position
  absolutePosition: Position
  width: number
  height: number
  mousePosition: Position
}

export interface NodeDragMoveEvent {
  nodeId: string
  position: Position
  absolutePosition: Position
  mousePosition: Position
}

export interface NodeDragEndEvent {
  nodeId: string
  position: Position
  absolutePosition: Position
  mousePosition: Position
  targetId?: string
  targetType?: 'group' | 'schema'
}

export interface DropTargetHoverEvent {
  targetId: string
  targetType: 'group' | 'schema'
  mousePosition: Position
}

export interface DropTargetLeaveEvent {
  targetId: string
}
