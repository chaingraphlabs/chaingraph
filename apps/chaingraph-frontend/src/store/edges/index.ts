/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

// Anchor Nodes (XYFlow nodes for edge waypoints)
export {
  $anchorNodes,
  $edgeVersions,
  anchorColorsChanged,
  clearAnchorNodesForEdge,
  updateAnchorNodeSelection,
} from './anchor-nodes'

export type { AnchorNodeState } from './anchor-nodes'

// Anchor Selection (frontend-only)
export {
  $selectedAnchorId,
  deselectAnchor,
  selectAnchor,
} from './anchor-selection'

// Edge Anchors with Optimistic Updates
export {
  $absoluteAnchors,
  $edgeAnchors,
  addAnchorLocal,
  clearAnchorsLocal,
  groupNodeDeleted,
  moveAnchorLocal,
  removeAnchorLocal,
  setAnchorParent,
  setAnchorsFromInitial,
  setEdgeAnchors,
} from './anchors'

// Hooks
export { useXYFlowEdges } from './hooks/useXYFlowEdges'

// Edge Selection
export {
  $hasEdgeSelected,
  $selectedEdgeId,
  deselectEdge,
  selectEdge,
} from './selection'

// Stores
export {
  // Granular edge render data (new)
  $edgeRenderMap,
  // Core edge data
  $edges,
  // Backward compatibility alias
  $xyflowEdges,
  $xyflowEdgesList,
  // Events
  bumpEdgesForNodes,
  edgeDataChanged,
  portCollapseChangedForNodes,
  removeEdge,
  requestAddEdge,
  requestRemoveEdge,
  resetEdges,
  setEdge,
  setEdges,
} from './stores'

// Types
export * from './types'

// Utilities
export { computeExecutionStyle, computeHighlightStyle, extractEdgeColor } from './utils'

// Anchor drag sync wiring (multi-node drag)
// Export marker to prevent tree-shaking in lib builds
export { ANCHOR_DRAG_SYNC_INITIALIZED } from './anchor-drag-sync'
