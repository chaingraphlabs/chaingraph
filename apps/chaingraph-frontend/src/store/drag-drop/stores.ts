/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { Position } from '@badaitech/chaingraph-types'
import type {
  DragDropState,
  DraggedNode,
  DropTarget,
  NodeDragEndEvent,
  NodeDragMoveEvent,
  NodeDragStartEvent,
} from './types'
import { combine } from 'effector'
import { globalReset } from '../common'
import { dragDropDomain } from '../domains'

// Events
export const startNodeDrag = dragDropDomain.createEvent<NodeDragStartEvent>()
export const startMultiNodeDrag = dragDropDomain.createEvent<NodeDragStartEvent[]>()
export const updateNodeDragPosition = dragDropDomain.createEvent<NodeDragMoveEvent>()
export const updateMultiNodeDragPosition = dragDropDomain.createEvent<NodeDragMoveEvent[]>()
export const endNodeDrag = dragDropDomain.createEvent<NodeDragEndEvent>()
export const endMultiNodeDrag = dragDropDomain.createEvent<NodeDragEndEvent[]>()
export const updateMousePosition = dragDropDomain.createEvent<Position>()

// Drop target events
export const updatePotentialDropTargets = dragDropDomain.createEvent<DropTarget[]>()
export const clearDropTargets = dragDropDomain.createEvent()

// Store for mouse position during drag
export const $mousePosition = dragDropDomain.createStore<Position | null>(null)
  .on(startNodeDrag, (_, event) => event.mousePosition)
  .on(startMultiNodeDrag, (_, events) => events[0]?.mousePosition || null)
  .on(updateNodeDragPosition, (_, event) => event.mousePosition)
  .on(updateMultiNodeDragPosition, (_, events) => events[0]?.mousePosition || null)
  .on(updateMousePosition, (_, position) => position)
  .on([endNodeDrag, endMultiNodeDrag], () => null)
  .reset(globalReset)

// Store for dragged nodes
export const $draggedNodes = dragDropDomain.createStore<DraggedNode[]>([])
  .on(startNodeDrag, (_, event) => [{
    id: event.nodeId,
    position: event.position,
    absolutePosition: event.absolutePosition,
    width: event.width,
    height: event.height,
  }])
  .on(startMultiNodeDrag, (_, events) => events.map(event => ({
    id: event.nodeId,
    position: event.position,
    absolutePosition: event.absolutePosition,
    width: event.width,
    height: event.height,
  })))
  .on(updateNodeDragPosition, (state, event) =>
    state.map(node =>
      node.id === event.nodeId
        ? { ...node, position: event.position, absolutePosition: event.absolutePosition }
        : node,
    ))
  .on(updateMultiNodeDragPosition, (state, events) => {
    const updateMap = new Map(events.map(e => [e.nodeId, e]))
    return state.map((node) => {
      const update = updateMap.get(node.id)
      return update
        ? { ...node, position: update.position, absolutePosition: update.absolutePosition }
        : node
    })
  })
  .on([endNodeDrag, endMultiNodeDrag], () => [])
  .reset(globalReset)

// Computed stores
export const $isDragging = $draggedNodes.map(nodes => nodes.length > 0)

// Store for potential drop targets
export const $potentialDropTargets = dragDropDomain.createStore<DropTarget[]>([])
  .on(updatePotentialDropTargets, (_, targets) => targets)
  .on(clearDropTargets, () => [])
  .on([endNodeDrag, endMultiNodeDrag], () => [])
  .reset(globalReset)

// Store for currently hovered drop target based on mouse position
export const $hoveredDropTarget = combine(
  $potentialDropTargets,
  $mousePosition,
  $isDragging,
  (targets, mousePos, isDragging) => {
    if (!isDragging || !mousePos) {
      return null
    }

    // Find all targets that contain the mouse position
    const containingTargets = targets.filter((target) => {
      const { bounds } = target
      const contains = mousePos.x >= bounds.x
        && mousePos.x <= bounds.x + bounds.width
        && mousePos.y >= bounds.y
        && mousePos.y <= bounds.y + bounds.height

      return contains
    })

    if (containingTargets.length === 0) {
      return null
    }

    // Sort by priority (highest first) - schema drops have higher priority than groups
    containingTargets.sort((a, b) => b.priority - a.priority)

    // If we have multiple targets at the same priority, prefer the deepest one
    const highestPriority = containingTargets[0].priority
    const samePriorityTargets = containingTargets.filter(t => t.priority === highestPriority)

    if (samePriorityTargets.length > 1) {
      samePriorityTargets.sort((a, b) => b.depth - a.depth)
    }

    return samePriorityTargets[0]
  },
)

export const $canDrop = combine(
  $hoveredDropTarget,
  $draggedNodes,
  (hoveredTarget, draggedNodes) => {
    // Can drop if we have a hovered target and are dragging nodes
    return hoveredTarget !== null && draggedNodes.length > 0
  },
)

// Combined state for convenience
export const $dragDropState = combine({
  isDragging: $isDragging,
  draggedNodes: $draggedNodes,
  mousePosition: $mousePosition,
  potentialDropTargets: $potentialDropTargets,
  hoveredDropTarget: $hoveredDropTarget,
  canDrop: $canDrop,
})

// Store for nodes that should show drop zone visual feedback
// This store is used by React components to efficiently determine which nodes should show drop feedback
export const $nodesWithDropFeedback = combine(
  $dragDropState,
  $potentialDropTargets,
  (state, targets) => {
    if (!state.isDragging)
      return new Map<string, { canAcceptDrop: boolean, dropType: 'group' | 'schema' }>()

    const feedbackMap = new Map<string, { canAcceptDrop: boolean, dropType: 'group' | 'schema' }>()

    // Add all potential targets with basic feedback
    targets.forEach((target) => {
      feedbackMap.set(target.nodeId, {
        canAcceptDrop: false,
        dropType: target.type,
      })
    })

    // Override with hover feedback if applicable
    if (state.hoveredDropTarget && state.canDrop) {
      feedbackMap.set(state.hoveredDropTarget.nodeId, {
        canAcceptDrop: true,
        dropType: state.hoveredDropTarget.type,
      })
    }

    return feedbackMap
  },
)

// Helper function to get visual feedback state for a specific node
export function getNodeDropFeedback(nodeId: string, dragDropState: DragDropState) {
  const { hoveredDropTarget, canDrop, isDragging } = dragDropState

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
  const potentialTarget = dragDropState.potentialDropTargets.find(t => t.nodeId === nodeId)
  if (potentialTarget) {
    return {
      isDropTarget: true,
      dropType: potentialTarget.type,
      canAcceptDrop: false,
    }
  }

  return null
}
