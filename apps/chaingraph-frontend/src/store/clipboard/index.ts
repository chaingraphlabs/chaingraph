/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { INode, SerializedEdge, SerializedNodeType } from '@badaitech/chaingraph-types'
import type { ClipboardData, ClipboardStats, PasteOptions } from './types'
import type { AnchorNodeState } from '@/store/edges'
import type { PasteNodesEvent } from '@/store/nodes/types'
import { EdgeStatus } from '@badaitech/chaingraph-types'
import { createEffect, sample } from 'effector'
import { flowDomain } from '@/store/domains'
import { $anchorNodes, deselectEdge, updateAnchorNodeSelection } from '@/store/edges'
import { $edges } from '@/store/edges/stores'
import { $activeFlowId } from '@/store/flow/active-flow'
import { $canvasFlowPosition } from '@/store/hotkeys'
import { $nodes, pasteNodesToFlowFx, updateNodeUILocal } from '@/store/nodes/stores'
import {
  adjustOrphanedNodePositions,
  calculateVirtualOrigin,
  getAnchorsForEdges,
  getInternalEdges,
  getSelectedNodesWithChildren,
} from './selection-utils'

const clipboardDomain = flowDomain.domain('clipboard')

// ============================================================================
// Events
// ============================================================================

/**
 * Copy currently selected nodes, edges, and anchors to clipboard
 */
export const copySelection = clipboardDomain.createEvent()

/**
 * Paste clipboard contents to the flow
 */
export const paste = clipboardDomain.createEvent<PasteOptions | void>()

/**
 * Duplicate selected nodes (Blender-style Shift+D)
 * Equivalent to copy + paste with small offset
 */
export const duplicate = clipboardDomain.createEvent()

/**
 * Clear clipboard contents
 */
export const clearClipboard = clipboardDomain.createEvent()

// ============================================================================
// Stores
// ============================================================================

/**
 * Clipboard data store
 */
export const $clipboardData = clipboardDomain
  .createStore<ClipboardData | null>(null)
  .on(clearClipboard, () => null)

/**
 * Track if a duplicate operation is in progress.
 * This prevents normal copy from triggering paste, and allows
 * duplicate to properly chain copy -> paste with offset.
 */
export const $isDuplicateInProgress = clipboardDomain.createStore(false)
  .on(duplicate, () => true)
  .on(paste, () => false)

/**
 * Derived: Whether clipboard has data
 */
export const $hasClipboardData = $clipboardData.map(data => data !== null)

/**
 * Derived: Clipboard statistics
 */
export const $clipboardStats = $clipboardData.map((data): ClipboardStats => ({
  nodeCount: data?.nodes.length ?? 0,
  edgeCount: data?.edges.length ?? 0,
  anchorCount: Object.values(data?.anchorsByEdge ?? {}).flat().length,
}))

// ============================================================================
// Copy Logic
// ============================================================================

/**
 * Copy selected nodes, edges, and anchors
 */
sample({
  clock: copySelection,
  source: { nodes: $nodes, edges: $edges, anchors: $anchorNodes },
  fn: ({ nodes, edges, anchors }) => {
    // Get selected nodes
    const selectedNodes = Object.values(nodes).filter(
      node => node.metadata.ui?.state?.isSelected === true,
    )

    if (selectedNodes.length === 0) {
      return null
    }

    // Get selected nodes with all their children
    const selectedNodesWithChildren = getSelectedNodesWithChildren(selectedNodes, nodes)
    const selectedNodeIds = new Set(selectedNodesWithChildren.map(n => n.id))

    // Get internal edges (edges between selected nodes)
    const internalEdges = getInternalEdges(selectedNodeIds, Object.values(edges))

    // Get anchors for those edges
    const edgeIds = new Set(internalEdges.map(e => e.edgeId))
    const anchorsByEdge = getAnchorsForEdges(edgeIds, anchors)

    // Adjust positions for orphaned nodes
    const adjustedNodes = adjustOrphanedNodePositions(
      selectedNodesWithChildren,
      selectedNodeIds,
      nodes,
    )

    // Calculate virtual origin
    const virtualOrigin = calculateVirtualOrigin(adjustedNodes)

    const clipboardData: ClipboardData = {
      nodes: adjustedNodes,
      edges: internalEdges,
      anchorsByEdge,
      timestamp: Date.now(),
      virtualOrigin,
    }

    return clipboardData
  },
  target: $clipboardData,
})

// ============================================================================
// Paste Logic
// ============================================================================

/**
 * Paste clipboard contents to flow
 * Uses mouse position from $canvasFlowPosition if no targetPosition provided
 */
sample({
  clock: paste,
  source: {
    clipboard: $clipboardData,
    flowId: $activeFlowId,
    mousePos: $canvasFlowPosition,
  },
  filter: ({ clipboard, flowId }) => clipboard !== null && flowId !== null,
  fn: ({ clipboard, flowId, mousePos }, options) => {
    // Determine paste position:
    // 1. Use targetPosition if provided (e.g., from duplicate)
    // 2. Otherwise use current mouse position in flow coords
    const pastePosition = options?.targetPosition ?? mousePos

    const pasteData: PasteNodesEvent = {
      flowId: flowId!,
      clipboardData: {
        nodes: clipboard!.nodes.map(node => node.serialize() as SerializedNodeType),
        edges: clipboard!.edges.map((e): SerializedEdge => ({
          id: e.edgeId,
          metadata: {
            ...e.metadata,
            // Include anchors in edge metadata
            anchors: clipboard!.anchorsByEdge[e.edgeId]?.map(anchor => ({
              id: anchor.id,
              x: anchor.x,
              y: anchor.y,
              index: anchor.index,
              parentNodeId: anchor.parentNodeId,
            })) ?? [],
          },
          status: EdgeStatus.Active,
          sourceNodeId: e.sourceNodeId,
          sourcePortId: e.sourcePortId,
          targetNodeId: e.targetNodeId,
          targetPortId: e.targetPortId,
        })),
        timestamp: clipboard!.timestamp,
      },
      pastePosition,
      virtualOrigin: clipboard!.virtualOrigin,
    }

    return pasteData
  },
  target: pasteNodesToFlowFx,
})

// ============================================================================
// Duplicate Logic (Shift+D Blender-style)
// ============================================================================

/**
 * Duplicate Step 1: Copy selection when duplicate is triggered
 */
sample({
  clock: duplicate,
  target: copySelection,
})

/**
 * Duplicate Step 2: After clipboard updates from copy, paste with offset.
 * Only triggers when $isDuplicateInProgress is true (set by duplicate event).
 * Uses virtualOrigin + offset to position duplicated nodes near originals.
 */
sample({
  clock: $clipboardData,
  source: { clipboard: $clipboardData, isDuplicate: $isDuplicateInProgress },
  filter: ({ clipboard, isDuplicate }) => clipboard !== null && isDuplicate,
  fn: ({ clipboard }) => ({
    targetPosition: {
      x: clipboard!.virtualOrigin.x + 50,
      y: clipboard!.virtualOrigin.y + 50,
    },
  } as PasteOptions),
  target: paste,
})

// ============================================================================
// Deselect on Paste Start
// ============================================================================

/**
 * Effect to deselect all nodes and anchors immediately.
 * Called when paste starts, before nodes arrive.
 *
 * NEW ARCHITECTURE: Selection is set on backend during paste.
 * Nodes/anchors arrive already selected via subscription.
 * No tracking needed - just deselect existing selection when paste begins.
 */
const deselectAllFx = createEffect(
  ({ flowId, nodes, anchorNodes }: {
    flowId: string
    nodes: Record<string, INode>
    anchorNodes: Map<string, AnchorNodeState>
  }) => {
    // Deselect all regular nodes
    Object.keys(nodes).forEach((nodeId) => {
      const node = nodes[nodeId]
      if (!node)
        return

      if (node.metadata.ui?.state?.isSelected === true) {
        updateNodeUILocal({
          flowId,
          nodeId,
          version: 0,
          ui: {
            ...node.metadata.ui,
            state: {
              ...node.metadata.ui?.state,
              isSelected: false,
            },
          },
        })
      }
    })

    // Deselect all anchor nodes
    anchorNodes.forEach((anchor) => {
      if (anchor.selected) {
        updateAnchorNodeSelection({
          anchorNodeId: anchor.id,
          selected: false,
        })
      }
    })

    // Deselect any selected edge
    deselectEdge()
  },
)

/**
 * Deselect all when paste STARTS (before backend call).
 * This ensures old selection is cleared before new nodes arrive.
 * New nodes will arrive from backend with isSelected=true already set.
 */
sample({
  clock: paste,
  source: { nodes: $nodes, flowId: $activeFlowId, anchorNodes: $anchorNodes },
  filter: ({ flowId }) => flowId !== null,
  fn: ({ nodes, flowId, anchorNodes }) => ({
    flowId: flowId!,
    nodes,
    anchorNodes,
  }),
  target: deselectAllFx,
})

// ============================================================================
// Clipboard Cleanup
// ============================================================================

/**
 * Clear clipboard after successful paste
 */
sample({
  clock: pasteNodesToFlowFx.doneData,
  filter: result => result.success === true,
  target: clearClipboard,
})
