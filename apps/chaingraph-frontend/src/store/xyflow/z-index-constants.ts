/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

/**
 * Z-Index Layer Specification for ChainGraph Flow Editor
 *
 * Layering order within same depth (bottom to top):
 *   Groups < Edges < Anchors < Nodes
 *
 * Selection boost places entities above ALL normal canvas elements,
 * allowing selected nodes to float over nested groups when dragging.
 *
 * Z-Index Bands:
 *   - Depth 0: 0-999
 *   - Depth 1: 1000-1999
 *   - Depth 2: 2000-2999
 *   - ...
 *   - Selection: 100,000+
 */

// Each depth level gets 1000 z-index units
export const DEPTH_MULTIPLIER = 1000

// Offsets within each depth layer
export const LAYER_OFFSETS = {
  group: 0, // Groups at base (0, 1000, 2000...)
  edge: 100, // Edges above groups (100, 1100, 2100...)
  anchor: 200, // Anchors above edges (200, 1200, 2200...)
  node: 300, // Nodes above anchors (300, 1300, 2300...)
} as const

// Selection layer - above ALL normal entities
export const SELECTION_BASE = 100_000

// Offsets in selection layer (maintains relative order)
export const SELECTION_OFFSETS = {
  group: 0, // 100,000
  edge: 100, // 100,100
  anchor: 200, // 100,200
  node: 300, // 100,300
} as const

export type ZIndexEntityType = keyof typeof LAYER_OFFSETS

/**
 * Calculate z-index for an entity based on its type, depth, and selection state.
 *
 * @param entityType - 'group' | 'edge' | 'anchor' | 'node'
 * @param depth - Hierarchy depth (0 for root, 1 for first-level children, etc.)
 * @param isSelected - Whether the entity is currently selected
 * @returns Calculated z-index value
 *
 * @example
 * // Root-level unselected node
 * calculateZIndex('node', 0, false) // → 300
 *
 * // Depth-2 selected node (floating above canvas)
 * calculateZIndex('node', 2, true) // → 100,300
 *
 * // Edge between depth-1 nodes
 * calculateZIndex('edge', 1, false) // → 1,100
 */
export function calculateZIndex(
  entityType: ZIndexEntityType,
  depth: number,
  isSelected: boolean,
): number {
  if (isSelected) {
    return SELECTION_BASE + SELECTION_OFFSETS[entityType]
  }
  return depth * DEPTH_MULTIPLIER + LAYER_OFFSETS[entityType]
}

/**
 * Calculate the depth for an edge based on its connected nodes.
 * Edge renders in the layer of the deeper connected node.
 *
 * @param sourceDepth - Depth of the source node
 * @param targetDepth - Depth of the target node
 * @returns Edge depth (max of source and target)
 *
 * @example
 * // Edge between root node and depth-2 node
 * calculateEdgeDepth(0, 2) // → 2
 */
export function calculateEdgeDepth(
  sourceDepth: number,
  targetDepth: number,
): number {
  return Math.max(sourceDepth, targetDepth)
}
