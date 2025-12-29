/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

/**
 * Anchor Nodes Store
 *
 * Manages edge anchors as XYFlow nodes instead of custom SVG elements.
 * This gives us native selection, drag, and parenting for free.
 *
 * Flow:
 * 1. User drags ghost anchor → addAnchorNode event
 * 2. XYFlow handles drag/selection natively
 * 3. Edge queries anchor node positions for path calculation
 * 4. Changes sync to backend in EdgeMetadata.anchors[] format
 *
 * ARCHITECTURE NOTE:
 * Anchor nodes are stored separately from regular INodes because they
 * don't need the complex port/execution/category system. They're purely
 * visual waypoints for edge routing.
 */

import type { EdgeAnchor } from '@badaitech/chaingraph-types'
import type { Node } from '@xyflow/react'
import type { AnchorNodeData } from '@/components/flow/nodes/AnchorNode/types'
import { attach, combine, sample } from 'effector'
import { nanoid } from 'nanoid'
import { ANCHOR_NODE_OFFSET, ANCHOR_NODE_SIZE } from '@/components/flow/nodes/AnchorNode/types'
import { edgesDomain } from '@/store/domains'
import { $activeFlowId, clearActiveFlow } from '@/store/flow/active-flow'
import { $nodePositionData } from '@/store/nodes/derived-stores'
import { accumulateAndSample } from '@/store/nodes/operators/accumulate-and-sample'
import { $trpcClient } from '@/store/trpc/store'
import { globalReset } from '../common'
import { groupNodeDeleted } from './anchor-events'
import { $edgeRenderMap, removeEdge, resetEdges } from './stores'

// ============================================================================
// Types
// ============================================================================

export interface AnchorNodeState {
  id: string
  edgeId: string
  x: number // Flow position (top-left of node, not center)
  y: number
  index: number
  color?: string
  parentNodeId?: string // For XYFlow native parenting
  selected?: boolean
  version: number // Increments on any change to force XYFlow re-render
}

// ============================================================================
// Events
// ============================================================================

/**
 * Add a new anchor node for an edge
 * Called when user drags a ghost anchor to create a real one
 */
export const addAnchorNode = edgesDomain.createEvent<{
  edgeId: string
  x: number // Flow position (center of anchor)
  y: number
  index: number
  color?: string
}>()

/**
 * Remove an anchor node
 * Called on double-click or Delete key
 * edgeId is optional - if not provided, it will be looked up from the anchor state
 */
export const removeAnchorNode = edgesDomain.createEvent<{
  anchorNodeId: string
  edgeId?: string // Optional - will be looked up if not provided
}>()

/**
 * Update anchor node position (from XYFlow drag)
 */
export const updateAnchorNodePosition = edgesDomain.createEvent<{
  anchorNodeId: string
  x: number
  y: number
}>()

/**
 * Update anchor node selection state
 */
export const updateAnchorNodeSelection = edgesDomain.createEvent<{
  anchorNodeId: string
  selected: boolean
}>()

/**
 * Update anchor node parent (for XYFlow native parenting)
 */
export const updateAnchorNodeParent = edgesDomain.createEvent<{
  anchorNodeId: string
  parentNodeId: string | undefined
}>()

/**
 * Load anchor nodes from backend (on flow load)
 */
export const loadAnchorNodesFromBackend = edgesDomain.createEvent<{
  edgeId: string
  anchors: Array<{
    id: string
    x: number
    y: number
    index: number
    parentNodeId?: string
    selected?: boolean
  }>
  color?: string
}>()

/**
 * Clear all anchors for an edge (when edge is deleted)
 */
export const clearAnchorNodesForEdge = edgesDomain.createEvent<string>()

// ============================================================================
// Store: Anchor Nodes
// ============================================================================

/**
 * All anchor nodes, keyed by anchor ID
 */
export const $anchorNodes = edgesDomain
  .createStore<Map<string, AnchorNodeState>>(new Map())

  // Add anchor node
  .on(addAnchorNode, (state, { edgeId, x, y, index, color }) => {
    const newState = new Map(state)
    const anchorId = `anchor-${nanoid(8)}`

    // SHIFT existing anchors at or after insert position to make room
    for (const [id, existingAnchor] of state) {
      if (existingAnchor.edgeId === edgeId && existingAnchor.index >= index) {
        newState.set(id, {
          ...existingAnchor,
          index: existingAnchor.index + 1,
          version: existingAnchor.version + 1,
        })
      }
    }

    // Add new anchor at the requested index
    newState.set(anchorId, {
      id: anchorId,
      edgeId,
      // Convert from center position to top-left (XYFlow expects top-left)
      x: x - ANCHOR_NODE_OFFSET,
      y: y - ANCHOR_NODE_OFFSET,
      index,
      color,
      selected: false,
      version: 0,
    })

    return newState
  })

  // Remove anchor node
  .on(removeAnchorNode, (state, { anchorNodeId }) => {
    const newState = new Map(state)
    newState.delete(anchorNodeId)
    return newState
  })

  // Update position
  .on(updateAnchorNodePosition, (state, { anchorNodeId, x, y }) => {
    const current = state.get(anchorNodeId)
    if (!current)
      return state

    const newState = new Map(state)
    newState.set(anchorNodeId, { ...current, x, y })
    return newState
  })

  // Update selection
  .on(updateAnchorNodeSelection, (state, { anchorNodeId, selected }) => {
    const current = state.get(anchorNodeId)
    if (!current)
      return state

    const newState = new Map(state)
    newState.set(anchorNodeId, { ...current, selected })
    return newState
  })

  // Update parent
  .on(updateAnchorNodeParent, (state, { anchorNodeId, parentNodeId }) => {
    const current = state.get(anchorNodeId)
    if (!current)
      return state

    const newState = new Map(state)
    newState.set(anchorNodeId, { ...current, parentNodeId })
    return newState
  })

  // Clear anchors for edge
  .on(clearAnchorNodesForEdge, (state, edgeId) => {
    const newState = new Map(state)
    for (const [id, anchor] of state) {
      if (anchor.edgeId === edgeId) {
        newState.delete(id)
      }
    }
    return newState
  })

  .reset(clearActiveFlow)
  .reset(resetEdges)
  .reset(globalReset)

// ============================================================================
// Derived: Edge → Anchor Node IDs mapping
// ============================================================================

/**
 * Maps edgeId → array of anchor node IDs (sorted by index)
 * Used by edges to find their anchors for path calculation
 */
export const $edgeAnchorNodeIds = combine($anchorNodes, (anchorNodes) => {
  const result = new Map<string, string[]>()

  // Group anchors by edge
  const edgeAnchors = new Map<string, AnchorNodeState[]>()
  for (const anchor of anchorNodes.values()) {
    const existing = edgeAnchors.get(anchor.edgeId) ?? []
    existing.push(anchor)
    edgeAnchors.set(anchor.edgeId, existing)
  }

  // Sort by index and extract IDs
  for (const [edgeId, anchors] of edgeAnchors) {
    const sortedIds = anchors
      .sort((a, b) => a.index - b.index)
      .map(a => a.id)
    result.set(edgeId, sortedIds)
  }

  return result
})

// ============================================================================
// Derived: XYFlow Nodes for anchors
// ============================================================================

/**
 * Convert anchor states to XYFlow Node format
 * This is combined with regular nodes in $combinedXYFlowNodesList
 *
 * Anchors are always visible (styled like PortHandle).
 *
 * zIndex: Calculated in $combinedXYFlowNodesList based on parent depth
 * to properly support nested groups.
 */
export const $anchorXYFlowNodes = combine(
  $anchorNodes,
  (anchorNodes): Node<AnchorNodeData>[] => {
    return Array.from(anchorNodes.values()).map(anchor => ({
      id: anchor.id,
      type: 'anchorNode',
      position: {
        x: anchor.x,
        y: anchor.y,
      },
      width: ANCHOR_NODE_SIZE,
      height: ANCHOR_NODE_SIZE,
      // Required by XYFlow to indicate node is initialized (prevents error #015)
      measured: {
        width: ANCHOR_NODE_SIZE,
        height: ANCHOR_NODE_SIZE,
      },
      // zIndex will be calculated in $combinedXYFlowNodesList based on parent depth
      data: {
        edgeId: anchor.edgeId,
        index: anchor.index,
        color: anchor.color,
        version: anchor.version, // Forces XYFlow re-render when color changes
      },
      parentId: anchor.parentNodeId,
      selectable: true,
      draggable: true,
      selected: anchor.selected,
    }))
  },
)

// ============================================================================
// Helper: Get anchor center positions for edge path
// ============================================================================

/**
 * Get anchor center positions for a specific edge
 * Used by FlowEdge to calculate the path through anchors
 */
export function getAnchorPositionsForEdge(
  edgeId: string,
  anchorNodes: Map<string, AnchorNodeState>,
  edgeAnchorNodeIds: Map<string, string[]>,
): Array<{ x: number, y: number }> {
  const anchorIds = edgeAnchorNodeIds.get(edgeId) ?? []

  return anchorIds
    .map((id) => {
      const anchor = anchorNodes.get(id)
      if (!anchor)
        return null

      // Return center of anchor node (add offset back)
      return {
        x: anchor.x + ANCHOR_NODE_OFFSET,
        y: anchor.y + ANCHOR_NODE_OFFSET,
      }
    })
    .filter((pos): pos is { x: number, y: number } => pos !== null)
}

// ============================================================================
// Backend Sync
// ============================================================================

// Sync anchors to server once per second during drag
const ANCHOR_SYNC_DEBOUNCE_MS = 1000

/**
 * Version tracking per edge for optimistic updates
 */
interface EdgeVersionState {
  localVersion: number
  serverVersion: number
  isDirty: boolean
}

export const $edgeVersions = edgesDomain.createStore<Map<string, EdgeVersionState>>(new Map())

// Internal events for version management
const markEdgeDirty = edgesDomain.createEvent<string>()
const updateServerVersion = edgesDomain.createEvent<{
  edgeId: string
  version: number
  stale: boolean
}>()

// Update version store
$edgeVersions
  .on(markEdgeDirty, (state, edgeId) => {
    const newState = new Map(state)
    const current = newState.get(edgeId) ?? { localVersion: 0, serverVersion: 0, isDirty: false }
    newState.set(edgeId, {
      ...current,
      localVersion: current.localVersion + 1,
      isDirty: true,
    })
    return newState
  })
  .on(updateServerVersion, (state, { edgeId, version, stale }) => {
    const newState = new Map(state)
    const current = newState.get(edgeId)
    if (!current)
      return state
    newState.set(edgeId, {
      ...current,
      serverVersion: version,
      isDirty: !!stale,
    })
    return newState
  })
  .reset(clearActiveFlow)
  .reset(resetEdges)
  .reset(globalReset)

// ============================================================================
// Backend Load Handler (with version checking)
// ============================================================================

/**
 * Internal event to actually apply backend anchor data to store
 * This is triggered by sample below after version check
 */
const applyBackendAnchors = edgesDomain.createEvent<{
  edgeId: string
  anchors: Array<{
    id: string
    x: number
    y: number
    index: number
    parentNodeId?: string
    selected?: boolean
  }>
  color?: string
  skipPositionUpdate: boolean // True if edge has pending local changes
}>()

// Apply backend anchors to store
$anchorNodes.on(applyBackendAnchors, (state, { edgeId, anchors, color, skipPositionUpdate }) => {
  const newState = new Map(state)

  anchors.forEach((anchor) => {
    const existingAnchor = state.get(anchor.id)
    const anchorColor = color ?? existingAnchor?.color

    // If we have pending local changes (isDirty), preserve local position
    // Otherwise, apply server position
    const x = (skipPositionUpdate && existingAnchor)
      ? existingAnchor.x
      : anchor.x - ANCHOR_NODE_OFFSET
    const y = (skipPositionUpdate && existingAnchor)
      ? existingAnchor.y
      : anchor.y - ANCHOR_NODE_OFFSET

    // Increment version if color changed, otherwise preserve or start at 0
    const colorChanged = existingAnchor && anchorColor !== existingAnchor.color
    const version = colorChanged
      ? existingAnchor.version + 1
      : (existingAnchor?.version ?? 0)

    newState.set(anchor.id, {
      id: anchor.id,
      edgeId,
      x,
      y,
      index: anchor.index,
      color: anchorColor,
      parentNodeId: anchor.parentNodeId,
      // Backend selection (from paste) takes precedence, then existing local, then false
      selected: anchor.selected ?? existingAnchor?.selected ?? false,
      version,
    })
  })

  return newState
})

/**
 * Wire: loadAnchorNodesFromBackend -> check version -> applyBackendAnchors
 *
 * This checks if the edge has pending local changes (isDirty).
 * If dirty, we skip position updates to avoid overwriting optimistic updates.
 * If not dirty, we apply server positions normally.
 */
sample({
  clock: loadAnchorNodesFromBackend,
  source: $edgeVersions,
  fn: (versions, payload) => {
    const edgeIsDirty = versions.get(payload.edgeId)?.isDirty ?? false
    return {
      ...payload,
      skipPositionUpdate: edgeIsDirty,
    }
  },
  target: applyBackendAnchors,
})

/**
 * Convert anchor nodes to EdgeAnchor[] format for backend
 */
function convertToEdgeAnchors(
  edgeId: string,
  anchorNodes: Map<string, AnchorNodeState>,
  edgeAnchorNodeIds: Map<string, string[]>,
): EdgeAnchor[] {
  const anchorIds = edgeAnchorNodeIds.get(edgeId) ?? []
  const result: EdgeAnchor[] = []

  anchorIds.forEach((id, index) => {
    const anchor = anchorNodes.get(id)
    if (!anchor)
      return

    // Convert to center position (backend stores center, not top-left)
    result.push({
      id: anchor.id,
      x: anchor.x + ANCHOR_NODE_OFFSET,
      y: anchor.y + ANCHOR_NODE_OFFSET,
      index,
      parentNodeId: anchor.parentNodeId,
    })
  })

  return result
}

/**
 * Sync effect - sends anchor updates to backend
 */
const syncAnchorNodesFx = attach({
  source: {
    client: $trpcClient,
    flowId: $activeFlowId,
    anchorNodes: $anchorNodes,
    edgeAnchorNodeIds: $edgeAnchorNodeIds,
    versions: $edgeVersions,
  },
  effect: async ({ client, flowId, anchorNodes, edgeAnchorNodeIds, versions }, edgeId: string) => {
    if (!client || !flowId)
      return

    const versionState = versions.get(edgeId)
    if (!versionState?.isDirty)
      return

    const anchors = convertToEdgeAnchors(edgeId, anchorNodes, edgeAnchorNodeIds)

    try {
      const result = await client.edge.updateAnchors.mutate({
        flowId,
        edgeId,
        anchors,
        version: versionState.serverVersion,
      })

      updateServerVersion({
        edgeId,
        version: result.version,
        stale: result.stale,
      })

      return result
    } catch (error) {
      console.error(`[anchor-nodes] Failed to sync anchors for edge ${edgeId}:`, error)
    }
  },
})

// Throttled sync trigger
const throttledSyncTrigger = accumulateAndSample({
  source: [markEdgeDirty],
  timeout: ANCHOR_SYNC_DEBOUNCE_MS,
  getKey: edgeId => edgeId,
})

// Wire: Anchor changes -> mark edge dirty
sample({
  clock: addAnchorNode,
  fn: payload => payload.edgeId,
  target: markEdgeDirty,
})

// For position updates, look up edgeId from anchor state BEFORE the update
// We need to get the edgeId from current state since the anchor exists
sample({
  clock: updateAnchorNodePosition,
  source: $anchorNodes,
  filter: (anchorNodes, { anchorNodeId }) => {
    const anchor = anchorNodes.get(anchorNodeId)
    return anchor?.edgeId !== undefined
  },
  fn: (anchorNodes, { anchorNodeId }) => {
    const anchor = anchorNodes.get(anchorNodeId)
    return anchor!.edgeId
  },
  target: markEdgeDirty,
})

// For removal, the edgeId may be passed explicitly or looked up
sample({
  clock: removeAnchorNode,
  source: $anchorNodes,
  filter: (anchorNodes, { anchorNodeId, edgeId }) => {
    if (edgeId)
      return true
    const anchor = anchorNodes.get(anchorNodeId)
    return anchor?.edgeId !== undefined
  },
  fn: (anchorNodes, { anchorNodeId, edgeId }) => {
    if (edgeId)
      return edgeId
    const anchor = anchorNodes.get(anchorNodeId)
    return anchor!.edgeId
  },
  target: markEdgeDirty,
})

// Wire: Throttled sync
sample({
  clock: throttledSyncTrigger,
  target: syncAnchorNodesFx,
})

// ============================================================================
// Wire: Edge Deletion → Clear Anchors
// ============================================================================

/**
 * When an edge is deleted, remove all its anchor nodes
 */
sample({
  clock: removeEdge,
  fn: ({ edgeId }) => edgeId,
  target: clearAnchorNodesForEdge,
})

// ============================================================================
// Wire: Edge Color → Anchor Color Sync
// ============================================================================

/**
 * Update anchor node color
 * Called when edge color changes (e.g., after ports load and edge becomes ready)
 */
const updateAnchorNodeColor = edgesDomain.createEvent<{
  edgeId: string
  color: string
}>()

$anchorNodes.on(updateAnchorNodeColor, (state, { edgeId, color }) => {
  let hasChanges = false
  const newState = new Map(state)

  for (const [id, anchor] of state) {
    if (anchor.edgeId === edgeId && anchor.color !== color) {
      newState.set(id, {
        ...anchor,
        color,
        version: anchor.version + 1, // Increment version to force XYFlow re-render
      })
      hasChanges = true
    }
  }

  return hasChanges ? newState : state
})

/**
 * Internal event to batch color updates
 */
const syncAnchorColorsFromEdges = edgesDomain.createEvent<Array<{ edgeId: string, color: string }>>()

/**
 * Event emitted when anchor colors are updated
 * Used by NodeInternalsSync to force XYFlow re-render
 */
export const anchorColorsChanged = edgesDomain.createEvent<string[]>()

// Process batch updates - call updateAnchorNodeColor for each and emit anchorColorsChanged
syncAnchorColorsFromEdges.watch((updates) => {
  if (updates.length === 0)
    return

  const anchorNodes = $anchorNodes.getState()
  const affectedAnchorIds: string[] = []

  for (const update of updates) {
    updateAnchorNodeColor(update)

    // Collect anchor node IDs for this edge
    for (const [id, anchor] of anchorNodes) {
      if (anchor.edgeId === update.edgeId) {
        affectedAnchorIds.push(id)
      }
    }
  }

  // Emit event for NodeInternalsSync to force XYFlow re-render
  if (affectedAnchorIds.length > 0) {
    anchorColorsChanged(affectedAnchorIds)
  }
})

// ============================================================================
// Color Sync Helper
// ============================================================================

/**
 * Compute color updates for anchors based on edge render data.
 * Shared logic between the two samples below.
 */
function computeColorUpdates(
  anchorNodes: Map<string, AnchorNodeState>,
  edgeRenderMap: Map<string, { isReady: boolean, color?: string }>,
): Array<{ edgeId: string, color: string }> {
  const updates: Array<{ edgeId: string, color: string }> = []

  // Group anchors by edge
  const edgeIds = new Set<string>()
  for (const anchor of anchorNodes.values()) {
    edgeIds.add(anchor.edgeId)
  }

  // Check each edge for color updates
  for (const edgeId of edgeIds) {
    const edgeRender = edgeRenderMap.get(edgeId)
    if (!edgeRender?.isReady || !edgeRender.color)
      continue
    // Skip 'currentColor' as it's not a real color
    if (edgeRender.color === 'currentColor')
      continue

    // Check if any anchor needs color update
    for (const anchor of anchorNodes.values()) {
      if (anchor.edgeId === edgeId && anchor.color !== edgeRender.color) {
        updates.push({ edgeId, color: edgeRender.color })
        break // Only need one update per edge
      }
    }
  }

  return updates
}

/**
 * Sync anchor colors from edge render data
 *
 * When an edge becomes ready (ports loaded) or its color changes,
 * update all anchors for that edge with the new color.
 *
 * This ensures anchors always have the correct color, even after page refresh
 * when anchors are loaded before edge colors are computed.
 */
sample({
  clock: $edgeRenderMap,
  source: $anchorNodes,
  filter: anchorNodes => anchorNodes.size > 0,
  fn: (anchorNodes, edgeRenderMap) => computeColorUpdates(anchorNodes, edgeRenderMap),
  target: syncAnchorColorsFromEdges,
})

/**
 * Also sync when anchors are loaded/changed.
 *
 * This fixes the race condition where edge render data is ready BEFORE anchors load.
 * Without this, the first sample never fires because $anchorNodes.size was 0 when
 * $edgeRenderMap updated.
 */
sample({
  clock: $anchorNodes,
  source: $edgeRenderMap,
  filter: (_, anchorNodes) => anchorNodes.size > 0,
  fn: (edgeRenderMap, anchorNodes) => computeColorUpdates(anchorNodes, edgeRenderMap),
  target: syncAnchorColorsFromEdges,
})

// ============================================================================
// Group Deletion → Convert Anchors to Absolute Coordinates
// ============================================================================

/**
 * Event to clear anchor parents and convert to absolute coordinates.
 * This is called when a group node containing anchors is deleted.
 */
const clearAnchorParentsAndConvertPositions = edgesDomain.createEvent<{
  deletedNodeId: string
  updates: Array<{ anchorId: string, x: number, y: number }>
}>()

/**
 * Handler: Update anchors when their parent group is deleted.
 * Converts relative positions to absolute and clears parentNodeId.
 */
$anchorNodes.on(clearAnchorParentsAndConvertPositions, (state, { deletedNodeId, updates }) => {
  const newState = new Map(state)

  for (const { anchorId, x, y } of updates) {
    const anchor = state.get(anchorId)
    if (anchor && anchor.parentNodeId === deletedNodeId) {
      newState.set(anchorId, {
        ...anchor,
        x,
        y,
        parentNodeId: undefined,
        version: anchor.version + 1,
      })
    }
  }

  return newState
})

/**
 * Wire: When a group node is deleted, convert parented anchors to absolute coordinates.
 *
 * This handles the case where anchors are visually inside a group node.
 * Without this, anchors would have invalid parent references after group deletion.
 */
sample({
  clock: groupNodeDeleted,
  source: { anchorNodes: $anchorNodes, nodePositions: $nodePositionData },
  filter: ({ anchorNodes }, deletedNodeId) => {
    // Check if any anchor is parented to the deleted group
    for (const anchor of anchorNodes.values()) {
      if (anchor.parentNodeId === deletedNodeId)
        return true
    }
    return false
  },
  fn: ({ anchorNodes, nodePositions }, deletedNodeId) => {
    const updates: Array<{ anchorId: string, x: number, y: number }> = []

    for (const [id, anchor] of anchorNodes) {
      if (anchor.parentNodeId === deletedNodeId) {
        // Convert to absolute coordinates
        const parentPos = nodePositions.get(deletedNodeId)
        if (parentPos) {
          updates.push({
            anchorId: id,
            x: anchor.x + parentPos.position.x,
            y: anchor.y + parentPos.position.y,
          })
        } else {
          // Parent position not found - just clear the parent without moving
          updates.push({
            anchorId: id,
            x: anchor.x,
            y: anchor.y,
          })
        }
      }
    }

    return { deletedNodeId, updates }
  },
  target: clearAnchorParentsAndConvertPositions,
})
