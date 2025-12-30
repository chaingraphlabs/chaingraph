/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

/*
 * Anchor Drag Synchronization
 * Tracks edges between dragged nodes and applies position deltas to their anchors
 *
 * CRITICAL: When multiple nodes are dragged together, anchors on edges connecting
 * ONLY the dragged nodes will move proportionally with the nodes.
 *
 * IMPORTANT: Delta is calculated as ABSOLUTE offset from initial position.
 * We store initial anchor positions on drag start, then on each update we set:
 *   newAnchorPosition = initialAnchorPosition + delta
 *
 * This avoids the bug where incremental deltas would accumulate incorrectly.
 *
 * Edge Case Handling:
 * - draggedNodeIds is passed to setAnchorsFromInitial to skip anchors whose parent
 *   is also being dragged (prevents double-applying delta)
 */

import type { EdgeAnchor, Position } from '@badaitech/chaingraph-types'
import { sample } from 'effector'
import { dragDropDomain, edgesDomain } from '@/store/domains'
import {
  endMultiNodeDrag,
  startMultiNodeDrag,
  updateMultiNodeDragPosition,
} from '@/store/drag-drop'
import { $edgeAnchors, onAnchorDragEnd, setAnchorsFromInitial } from './anchors'
import { $edgeRenderMap } from './stores'

interface EdgeBetweenDraggedNodes {
  edgeId: string
  sourceNodeId: string
  targetNodeId: string
}

// Store: Track which edges connect dragged nodes
export const $edgesBetweenDraggedNodes = edgesDomain
  .createStore<Map<string, EdgeBetweenDraggedNodes>>(new Map())
  .reset(endMultiNodeDrag)

// Store: Initial absolute positions of NODES for delta calculation
export const $initialNodeAbsolutePositions = dragDropDomain
  .createStore<Map<string, Position>>(new Map())
  .on(startMultiNodeDrag, (_, events) => {
    const positions = new Map<string, Position>()
    events.forEach(e => positions.set(e.nodeId, e.absolutePosition))
    return positions
  })
  .reset(endMultiNodeDrag)

// Store: Initial ANCHOR positions (snapshot on drag start)
// Key: edgeId, Value: array of anchors with their initial positions
export const $initialAnchorPositions = edgesDomain
  .createStore<Map<string, EdgeAnchor[]>>(new Map())
  .reset(endMultiNodeDrag)

// Internal event to set both stores atomically
const setDragState = edgesDomain.createEvent<{
  edgesBetween: Map<string, EdgeBetweenDraggedNodes>
  initialAnchors: Map<string, EdgeAnchor[]>
}>()

// Wire: On drag start → find edges between dragged nodes AND snapshot anchor positions
// CRITICAL: We snapshot initial anchor positions here so we can apply absolute delta later
sample({
  clock: startMultiNodeDrag,
  source: { edgeRenderMap: $edgeRenderMap, edgeAnchors: $edgeAnchors },
  fn: ({ edgeRenderMap, edgeAnchors }, dragEvents) => {
    const draggedNodeIds = new Set(dragEvents.map(e => e.nodeId))
    const edgesBetween = new Map<string, EdgeBetweenDraggedNodes>()
    const initialAnchors = new Map<string, EdgeAnchor[]>()

    for (const [edgeId, edge] of edgeRenderMap) {
      if (!edge.isReady)
        continue

      if (draggedNodeIds.has(edge.source) && draggedNodeIds.has(edge.target)) {
        edgesBetween.set(edgeId, {
          edgeId,
          sourceNodeId: edge.source,
          targetNodeId: edge.target,
        })

        const anchorState = edgeAnchors.get(edgeId)
        if (anchorState && anchorState.anchors.length > 0) {
          initialAnchors.set(edgeId, anchorState.anchors.map(a => ({ ...a })))
        }
      }
    }

    return { edgesBetween, initialAnchors }
  },
  target: setDragState,
})

$edgesBetweenDraggedNodes.on(setDragState, (_, { edgesBetween }) => edgesBetween)
$initialAnchorPositions.on(setDragState, (_, { initialAnchors }) => initialAnchors)

// Wire: On drag position update → set anchors to initial + delta
// CRITICAL: We apply ABSOLUTE delta from initial, not incremental delta
sample({
  clock: updateMultiNodeDragPosition,
  source: {
    initialNodePositions: $initialNodeAbsolutePositions,
    initialAnchorPositions: $initialAnchorPositions,
    edgesBetween: $edgesBetweenDraggedNodes,
  },
  filter: ({ edgesBetween }, dragEvents) => edgesBetween.size > 0 && dragEvents.length > 0,
  fn: ({ initialNodePositions, initialAnchorPositions, edgesBetween }, dragEvents) => {
    // Calculate delta from first dragged node (all move together)
    const firstEvent = Array.isArray(dragEvents) ? dragEvents[0] : dragEvents
    const initialPos = initialNodePositions.get(firstEvent.nodeId)
    if (!initialPos)
      return []

    const dx = firstEvent.absolutePosition.x - initialPos.x
    const dy = firstEvent.absolutePosition.y - initialPos.y

    // Collect dragged node IDs for edge case handling
    const draggedNodeIds = new Set(dragEvents.map(e => e.nodeId))

    // Build updates: set anchors to initial + delta
    const updates: Array<{
      edgeId: string
      initialAnchors: EdgeAnchor[]
      dx: number
      dy: number
      draggedNodeIds: Set<string>
    }> = []

    for (const edge of edgesBetween.values()) {
      const initial = initialAnchorPositions.get(edge.edgeId)
      if (!initial || initial.length === 0)
        continue
      updates.push({
        edgeId: edge.edgeId,
        initialAnchors: initial,
        dx,
        dy,
        draggedNodeIds,
      })
    }

    return updates
  },
  target: setAnchorsFromInitial,
})

// Wire: On drag end → sync affected edges
sample({
  clock: endMultiNodeDrag,
  source: $edgesBetweenDraggedNodes,
  filter: edgesBetween => edgesBetween.size > 0,
  fn: (edgesBetween) => {
    const edgeIds = Array.from(edgesBetween.keys())
    // Fire onAnchorDragEnd for each edge to trigger immediate sync
    edgeIds.forEach(id => onAnchorDragEnd(id))
    return edgeIds
  },
})

/**
 * Export marker to prevent tree-shaking of this side-effect module.
 * This ensures the Effector sample() wiring above is registered in lib builds.
 */
export const ANCHOR_DRAG_SYNC_INITIALIZED = true
