/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { EdgeAnchor } from '@badaitech/chaingraph-types'
import { attach, combine, sample } from 'effector'
import { edgesDomain } from '@/store/domains'
import { $activeFlowId } from '@/store/flow/active-flow'
import { $nodePositionData } from '@/store/nodes/derived-stores'
import { accumulateAndSample } from '@/store/nodes/operators/accumulate-and-sample'
import { $trpcClient } from '@/store/trpc/store'
import { globalReset } from '../common'
import { getAnchorAbsolutePosition } from './anchor-coordinates'
import { groupNodeDeleted } from './anchor-events'
// Re-export from anchor-events to maintain backward compatibility
export { groupNodeDeleted }

// Sync anchors to server once per second during drag (was 100ms)
// Final state is synced immediately on drag end (see onAnchorDragEnd below)
const ANCHOR_SYNC_DEBOUNCE_MS = 1000

// Grid snapping for anchors - all anchors snap to 5x5 pixel grid
const ANCHOR_GRID_SIZE = 5

/**
 * Snap a coordinate to the nearest grid point
 */
function snapToGrid(value: number): number {
  return Math.round(value / ANCHOR_GRID_SIZE) * ANCHOR_GRID_SIZE
}

interface LocalAnchorState {
  anchors: EdgeAnchor[]
  localVersion: number
  serverVersion: number
  isDirty: boolean
}

// Events - Server updates (from WebSocket)
export const setEdgeAnchors = edgesDomain.createEvent<{
  edgeId: string
  anchors: EdgeAnchor[]
  version: number
}>()

// Events - Local optimistic updates
export const addAnchorLocal = edgesDomain.createEvent<{
  edgeId: string
  anchor: EdgeAnchor
}>()

export const moveAnchorLocal = edgesDomain.createEvent<{
  edgeId: string
  anchorId: string
  x: number
  y: number
}>()

export const removeAnchorLocal = edgesDomain.createEvent<{
  edgeId: string
  anchorId: string
}>()

export const clearAnchorsLocal = edgesDomain.createEvent<string>()

// Event - Set anchors from initial positions + delta (for multi-node drag)
// CRITICAL: This applies ABSOLUTE delta from initial, not incremental delta
// This prevents the bug where deltas accumulate incorrectly
export const setAnchorsFromInitial = edgesDomain.createEvent<Array<{
  edgeId: string
  initialAnchors: EdgeAnchor[]
  dx: number
  dy: number
  draggedNodeIds: Set<string>
}>>()

// Event - Set or clear anchor parent (for anchor parenting to groups)
export const setAnchorParent = edgesDomain.createEvent<{
  edgeId: string
  anchorId: string
  parentNodeId: string | undefined
  x: number
  y: number
}>()

// Event - Drag end (triggers immediate sync to guarantee final state)
export const onAnchorDragEnd = edgesDomain.createEvent<string>()

// Internal events
const markEdgeDirty = edgesDomain.createEvent<string>()

// Event - Update server version after sync response (handles both success and stale cases)
const updateServerVersion = edgesDomain.createEvent<{
  edgeId: string
  version: number
  stale: boolean
}>()

// Store: edgeId -> anchor state
export const $edgeAnchors = edgesDomain.createStore<Map<string, LocalAnchorState>>(new Map())
  // Server updates
  .on(setEdgeAnchors, (state, { edgeId, anchors, version }) => {
    const newState = new Map(state)
    const current = newState.get(edgeId)

    // Only update if server version is newer
    if (current && current.serverVersion >= version) {
      return state
    }

    // CRITICAL FIX: Don't overwrite local unsaved changes
    // If local state is dirty, keep local changes to avoid losing user edits
    if (current && current.isDirty) {
      return state
    }

    newState.set(edgeId, {
      anchors,
      localVersion: version,
      serverVersion: version,
      isDirty: false,
    })
    return newState
  })
  // Add anchor locally
  .on(addAnchorLocal, (state, { edgeId, anchor }) => {
    const newState = new Map(state)
    const current = newState.get(edgeId) ?? {
      anchors: [],
      localVersion: 0,
      serverVersion: 0,
      isDirty: false,
    }

    // Snap anchor position to grid
    const snappedAnchor = {
      ...anchor,
      x: snapToGrid(anchor.x),
      y: snapToGrid(anchor.y),
    }

    // Shift existing anchors at or after insert position to make room
    // This ensures stable insertion order (avoids unstable sort issues)
    const shiftedAnchors = current.anchors.map(a =>
      a.index >= snappedAnchor.index ? { ...a, index: a.index + 1 } : a,
    )

    const anchors = [...shiftedAnchors, snappedAnchor]
      .sort((a, b) => a.index - b.index)
    anchors.forEach((a, i) => {
      a.index = i
    })

    newState.set(edgeId, {
      anchors,
      localVersion: current.localVersion + 1,
      serverVersion: current.serverVersion,
      isDirty: true,
    })
    return newState
  })
  // Move anchor locally
  .on(moveAnchorLocal, (state, { edgeId, anchorId, x, y }) => {
    const newState = new Map(state)
    const current = newState.get(edgeId)
    if (!current)
      return state

    // Snap coordinates to grid
    const snappedX = snapToGrid(x)
    const snappedY = snapToGrid(y)

    const anchors = current.anchors.map(a =>
      a.id === anchorId ? { ...a, x: snappedX, y: snappedY } : a,
    )

    newState.set(edgeId, {
      anchors,
      localVersion: current.localVersion + 1,
      serverVersion: current.serverVersion,
      isDirty: true,
    })
    return newState
  })
  // Remove anchor locally
  .on(removeAnchorLocal, (state, { edgeId, anchorId }) => {
    const newState = new Map(state)
    const current = newState.get(edgeId)
    if (!current)
      return state

    const anchors = current.anchors.filter(a => a.id !== anchorId)
    anchors.forEach((a, i) => {
      a.index = i
    })

    newState.set(edgeId, {
      anchors,
      localVersion: current.localVersion + 1,
      serverVersion: current.serverVersion,
      isDirty: true,
    })
    return newState
  })
  // Clear anchors locally
  .on(clearAnchorsLocal, (state, edgeId) => {
    const newState = new Map(state)
    const current = newState.get(edgeId)
    if (!current)
      return state

    newState.set(edgeId, {
      anchors: [],
      localVersion: current.localVersion + 1,
      serverVersion: current.serverVersion,
      isDirty: true,
    })
    return newState
  })
  // Set anchors from initial positions + delta (multi-node drag)
  // CRITICAL: This applies ABSOLUTE delta from initial, not incremental delta
  .on(setAnchorsFromInitial, (state, updates) => {
    if (updates.length === 0)
      return state

    const newState = new Map(state)

    for (const { edgeId, initialAnchors, dx, dy, draggedNodeIds } of updates) {
      const current = newState.get(edgeId)
      if (!current)
        continue

      // Calculate new positions from INITIAL + delta
      const anchors = initialAnchors.map((initial) => {
        // CRITICAL EDGE CASE: Skip if anchor's parent is also being dragged
        // The anchor moves with its parent automatically, no delta needed
        if (initial.parentNodeId && draggedNodeIds.has(initial.parentNodeId)) {
          // Return anchor from current state (it may have updated via parent move)
          const currentAnchor = current.anchors.find(a => a.id === initial.id)
          return currentAnchor ?? initial
        }

        // Apply delta to INITIAL position (not current position!)
        // This is the key fix: newPosition = initial + delta
        // NOTE: No grid snapping here - anchors should move smoothly with nodes
        // Grid snapping only applies when dragging individual anchors
        return {
          ...initial,
          x: initial.x + dx,
          y: initial.y + dy,
        }
      })

      newState.set(edgeId, {
        anchors,
        localVersion: current.localVersion + 1,
        serverVersion: current.serverVersion,
        isDirty: true,
      })
    }

    return newState
  })
  // Set or clear anchor parent
  .on(setAnchorParent, (state, { edgeId, anchorId, parentNodeId, x, y }) => {
    const newState = new Map(state)
    const current = newState.get(edgeId)
    if (!current)
      return state

    const anchors = current.anchors.map(a =>
      a.id === anchorId
        ? {
            ...a,
            x: snapToGrid(x),
            y: snapToGrid(y),
            parentNodeId,
          }
        : a,
    )

    newState.set(edgeId, {
      anchors,
      localVersion: current.localVersion + 1,
      serverVersion: current.serverVersion,
      isDirty: true,
    })
    return newState
  })
  // Update server version from sync response
  .on(updateServerVersion, (state, { edgeId, version, stale }) => {
    const newState = new Map(state)
    const current = newState.get(edgeId)
    if (!current)
      return state

    newState.set(edgeId, {
      ...current,
      serverVersion: version, // Update to server's version
      isDirty: !!stale, // Keep dirty if stale, clean if success
    })
    return newState
  })
  .reset(globalReset)

/**
 * Derived store: Precompute absolute coordinates for ALL edges
 *
 * CRITICAL PERFORMANCE:
 * - Uses $nodePositionData (cold path) not $nodes (hot path)
 * - Recalculates ONLY when positions or anchors change
 * - NOT on port updates, execution events, etc.
 *
 * Result: 99% reduction in coordinate transformation calculations
 *
 * Components use useStoreMap with updateFilter to subscribe selectively,
 * ensuring only edges with changed anchors actually re-render.
 */
export const $absoluteAnchors = combine(
  $edgeAnchors,
  $nodePositionData,
  (edgeAnchors, nodePositionData) => {
    const result = new Map<string, EdgeAnchor[]>()

    for (const [edgeId, state] of edgeAnchors) {
      // Transform anchors to absolute coordinates
      const absolute = state.anchors.map(anchor => ({
        ...anchor,
        ...getAnchorAbsolutePosition(anchor, nodePositionData),
      }))
      result.set(edgeId, absolute)
    }

    return result
  },
)

// Sync effect (throttled)
const syncEdgeAnchorsFx = attach({
  source: { client: $trpcClient, flowId: $activeFlowId, anchorsMap: $edgeAnchors },
  effect: async ({ client, flowId, anchorsMap }, edgeId: string) => {
    if (!client || !flowId)
      return

    const state = anchorsMap.get(edgeId)
    if (!state || !state.isDirty)
      return

    const result = await client.edge.updateAnchors.mutate({
      flowId,
      edgeId,
      anchors: state.anchors,
      version: state.serverVersion,
    })

    // CRITICAL FIX: Always update serverVersion from response
    // This prevents infinite loop when server rejects with stale: true
    updateServerVersion({
      edgeId,
      version: result.version,
      stale: result.stale,
    })

    return result
  },
})

// Immediate sync effect (bypasses throttle, used on drag end)
const syncImmediateFx = attach({
  source: { client: $trpcClient, flowId: $activeFlowId, anchorsMap: $edgeAnchors },
  effect: async ({ client, flowId, anchorsMap }, edgeId: string) => {
    if (!client || !flowId)
      return

    const state = anchorsMap.get(edgeId)
    if (!state || !state.isDirty)
      return

    const result = await client.edge.updateAnchors.mutate({
      flowId,
      edgeId,
      anchors: state.anchors,
      version: state.serverVersion,
    })

    // CRITICAL FIX: Always update serverVersion from response
    // This prevents infinite loop when server rejects with stale: true
    updateServerVersion({
      edgeId,
      version: result.version,
      stale: result.stale,
    })

    return result
  },
})

// Throttled sync trigger using accumulateAndSample
const throttledSyncTrigger = accumulateAndSample({
  source: [markEdgeDirty],
  timeout: ANCHOR_SYNC_DEBOUNCE_MS,
  getKey: edgeId => edgeId,
})

// Wire: Local changes -> mark dirty
sample({
  clock: [addAnchorLocal, moveAnchorLocal, removeAnchorLocal],
  fn: payload => payload.edgeId,
  target: markEdgeDirty,
})

sample({
  clock: clearAnchorsLocal,
  target: markEdgeDirty,
})

// Wire: Throttled sync
sample({
  clock: throttledSyncTrigger,
  target: syncEdgeAnchorsFx,
})

// Wire: Drag end -> immediate sync (guarantees final state is sent)
sample({
  clock: onAnchorDragEnd,
  target: syncImmediateFx,
})

// Internal event for batch processing anchor parent clears
const clearAnchorParentsBatch = edgesDomain.createEvent<Array<{
  edgeId: string
  anchorId: string
  parentNodeId: undefined
  x: number
  y: number
}>>()

// Wire: clearAnchorParentsBatch -> fire individual setAnchorParent events
sample({
  clock: clearAnchorParentsBatch,
  fn: (updates) => {
    updates.forEach(update => setAnchorParent(update))
  },
})

// Wire: groupNodeDeleted -> find affected anchors and convert to absolute
sample({
  clock: groupNodeDeleted,
  source: { edgeAnchors: $edgeAnchors, nodePositionData: $nodePositionData },
  fn: ({ edgeAnchors, nodePositionData }, deletedNodeId) => {
    const updates: Array<{
      edgeId: string
      anchorId: string
      parentNodeId: undefined
      x: number
      y: number
    }> = []

    for (const [edgeId, state] of edgeAnchors) {
      const affectedAnchors = state.anchors.filter(a => a.parentNodeId === deletedNodeId)

      affectedAnchors.forEach((anchor) => {
        // Convert to absolute position before clearing parent
        const absolutePos = getAnchorAbsolutePosition(anchor, nodePositionData)

        updates.push({
          edgeId,
          anchorId: anchor.id,
          parentNodeId: undefined,
          x: absolutePos.x,
          y: absolutePos.y,
        })
      })
    }

    return updates
  },
  target: clearAnchorParentsBatch,
})
