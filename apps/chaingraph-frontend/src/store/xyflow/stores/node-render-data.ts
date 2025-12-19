/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { CategoryMetadata, INode, Position } from '@badaitech/chaingraph-types'
import type { PulseState, XYFlowNodeRenderData, XYFlowNodesDataChangedPayload } from '../types'
import type { DragDropState } from '@/store/drag-drop/types'
import type { ExecutionState, NodeExecutionState } from '@/store/execution/types'
import { NODE_CATEGORIES } from '@badaitech/chaingraph-nodes'
import { sample } from 'effector'
import { debounce } from 'patronum'
import { trace } from '@/lib/perf-trace'
import { $categoryMetadata } from '@/store/categories'
import { globalReset } from '@/store/common'
import { $dragDropState } from '@/store/drag-drop/stores'
import { $executionNodes, $executionState, $highlightedNodeId } from '@/store/execution'
import {
  $nodeLayerDepth,
  $nodePositions,
  $nodes,
  addNode,
  addNodes,
  clearNodes,
  removeNode,
  setNodeMetadata,
  setNodes,
  setNodeVersion,
  updateNode,
  updateNodeDimensionsLocal,
  updateNodeParent,
  updateNodes,
  updateNodeUILocal,
} from '@/store/nodes/stores'
import { $nodesPulseState } from '@/store/updates'
import { xyflowDomain } from '../domain'
import {
  setXYFlowNodeRenderMap,
  xyflowNodesDataChanged,
  xyflowStructureChanged,
} from '../events'

// ============================================================================
// HELPER: Build complete render map from all source stores
// ============================================================================
function buildCompleteRenderMap(
  nodes: Record<string, INode>,
  positions: Record<string, Position>,
  layerDepths: Record<string, number>,
  categoryMeta: Map<string, CategoryMetadata>,
  execState: ExecutionState,
  execNodes: Record<string, NodeExecutionState>,
  highlightedIds: string[] | null,
  pulseStates: Map<string, PulseState>,
  dragState: DragDropState,
): Record<string, XYFlowNodeRenderData> {
  const renderMap: Record<string, XYFlowNodeRenderData> = {}
  const highlightSet = new Set(highlightedIds || [])
  const hasAnyHighlights = highlightedIds !== null && highlightedIds.length > 0

  for (const [nodeId, node] of Object.entries(nodes)) {
    const position = positions[nodeId] || node.metadata.ui?.position || { x: 0, y: 0 }
    const dims = node.metadata.ui?.dimensions || { width: 200, height: 100 }
    const categoryId = node.metadata.category || 'other'
    const category = categoryMeta.get(categoryId) ?? categoryMeta.get(NODE_CATEGORIES.OTHER)
    const execNode = execNodes[nodeId]

    // Compute execution style
    let execStyle: string | undefined
    if (execNode) {
      switch (execNode.status) {
        case 'running':
          execStyle = 'border-yellow-500 shadow-[0_0_20px_rgba(234,179,8,0.6)]'
          break
        case 'completed':
          execStyle = 'border-green-500 shadow-[0_0_20px_rgba(34,197,94,0.6)]'
          break
        case 'failed':
          execStyle = 'border-red-500 shadow-[0_0_20px_rgba(239,68,68,0.6)]'
          break
      }
    }

    // Compute drop feedback
    let dropFeedback: { canAcceptDrop: boolean, dropType: 'group' | 'schema' } | null = null
    const hoveredTarget = dragState.hoveredDropTarget
    if (hoveredTarget && hoveredTarget.nodeId === nodeId && dragState.canDrop) {
      dropFeedback = {
        canAcceptDrop: true,
        dropType: hoveredTarget.type,
      }
    } else {
      const potentialTarget = dragState.potentialDropTargets?.find(t => t.nodeId === nodeId)
      if (potentialTarget) {
        dropFeedback = {
          canAcceptDrop: false,
          dropType: potentialTarget.type,
        }
      }
    }

    renderMap[nodeId] = {
      nodeId,
      version: node.getVersion(),
      node,
      position,
      dimensions: dims,
      nodeType: node.metadata.category === NODE_CATEGORIES.GROUP ? 'groupNode' : 'chaingraphNode',
      categoryMetadata: category!,
      zIndex: layerDepths[nodeId] ?? 0,
      isSelected: node.metadata.ui?.state?.isSelected || false,
      isHidden: node.metadata.ui?.state?.isHidden || false,
      isDraggable: !node.metadata.ui?.state?.isMovingDisabled,
      parentNodeId: node.metadata.parentNodeId,
      executionStyle: execStyle,
      executionStatus: (execNode?.status as XYFlowNodeRenderData['executionStatus']) || 'idle',
      executionNode: execNode
        ? {
          status: execNode.status,
          executionTime: execNode.executionTime,
          error: execNode.error,
          node: execNode.node,
        }
        : null,
      isHighlighted: highlightSet.has(nodeId),
      hasAnyHighlights,
      pulseState: pulseStates.get(nodeId) || null,
      hasBreakpoint: execState.breakpoints.has(nodeId),
      debugMode: execState.debugMode,
      dropFeedback,
    }
  }

  return renderMap
}

// ============================================================================
// STORE: $xyflowNodeRenderMap
// ============================================================================
export const $xyflowNodeRenderMap = xyflowDomain
  .createStore<Record<string, XYFlowNodeRenderData>>({})

  // Batch data changes (efficient - updates multiple nodes at once)
  .on(xyflowNodesDataChanged, (state, { changes }) => {
    if (changes.length === 0)
      return state

    // Use structural sharing - only spread once
    const newState = { ...state }
    let hasChanges = false

    for (const { nodeId, changes: nodeChanges } of changes) {
      const current = newState[nodeId]
      if (!current)
        continue

      // Check if there are actual differences
      const needsUpdate = Object.entries(nodeChanges).some(
        ([key, value]) => current[key as keyof XYFlowNodeRenderData] !== value,
      )

      if (needsUpdate) {
        newState[nodeId] = { ...current, ...nodeChanges }
        hasChanges = true
      }
    }

    return hasChanges ? newState : state
  })

  // Structure rebuild via fork-safe sample() - receives complete map
  .on(setXYFlowNodeRenderMap, (_, newMap) => newMap)

  // Reset handlers
  .reset(clearNodes)
  .reset(globalReset)

// ============================================================================
// FORK-SAFE STRUCTURE REBUILD
// ============================================================================
// CRITICAL: Use sample() with combined source instead of .getState() to ensure
// atomic snapshot of all stores (prevents race conditions in store forks)

// Debounce structure changes to prevent multiple rebuilds during bulk operations
const debouncedStructureChanged = debounce({
  source: xyflowStructureChanged,
  timeout: 50,
})

sample({
  clock: debouncedStructureChanged,
  source: {
    nodes: $nodes,
    positions: $nodePositions,
    layerDepths: $nodeLayerDepth,
    categoryMeta: $categoryMetadata,
    execState: $executionState,
    execNodes: $executionNodes,
    highlights: $highlightedNodeId,
    pulseStates: $nodesPulseState,
    dragState: $dragDropState,
  },
  fn: ({
    nodes,
    positions,
    layerDepths,
    categoryMeta,
    execState,
    execNodes,
    highlights,
    pulseStates,
    dragState,
  }) => buildCompleteRenderMap(
    nodes,
    positions,
    layerDepths,
    categoryMeta,
    execState,
    execNodes,
    highlights,
    pulseStates,
    dragState,
  ),
  target: setXYFlowNodeRenderMap,
})

// ============================================================================
// WIRE: Structure changes (Low Frequency - add/remove nodes)
// ============================================================================
sample({
  clock: [addNode, addNodes, removeNode, clearNodes, setNodes, updateNodeParent],
  target: xyflowStructureChanged,
})

// ============================================================================
// WIRE 1: POSITION UPDATES (High Frequency - 60fps during drag)
// ============================================================================
// Note: Position updates are throttled by $nodePositions store updates
// which already use accumulateAndSample. We just compute delta here.
// Note: filter is removed because the store handler already checks for empty changes.
sample({
  clock: $nodePositions,
  source: $xyflowNodeRenderMap,
  fn: (renderMap, positions): XYFlowNodesDataChangedPayload => {
    return trace.wrap('sample.positions.delta', { category: 'sample' }, () => {
      // Delta computation - only changed positions
      const changes: XYFlowNodesDataChangedPayload['changes'] = []
      for (const [nodeId, pos] of Object.entries(positions)) {
        const current = renderMap[nodeId]
        if (current && (current.position.x !== pos.x || current.position.y !== pos.y)) {
          changes.push({ nodeId, changes: { position: pos } })
        }
      }
      return { changes }
    })
  },
  target: xyflowNodesDataChanged,
})

// ============================================================================
// WIRE 2: NODE DATA CHANGES (Medium Frequency - version, dimensions, selection)
// ============================================================================
// PERF OPTIMIZATION: Changed from `clock: $nodes` to specific events.
// This prevents O(N) scans when ports change (port updates don't need WIRE 2).
// Only node structure/UI changes trigger this wire.

/**
 * Extract node IDs from various event payloads.
 * Returns IDs of nodes that need render data updates.
 */
function getNodeIdsFromPayload(payload: unknown): string[] {
  if (!payload) return []

  // INode (single node)
  if (typeof payload === 'object' && 'id' in payload && typeof (payload as INode).id === 'string') {
    return [(payload as INode).id]
  }

  // INode[] (array of nodes)
  if (Array.isArray(payload) && payload.length > 0 && 'id' in payload[0]) {
    return payload.map((n: INode) => n.id)
  }

  // { nodeId: string } (UI update events)
  if (typeof payload === 'object' && 'nodeId' in payload) {
    return [(payload as { nodeId: string }).nodeId]
  }

  return []
}

/**
 * Compute render data updates for a single node.
 * Returns partial updates if any fields changed.
 */
function computeNodeRenderUpdates(
  current: XYFlowNodeRenderData,
  node: INode,
): Partial<XYFlowNodeRenderData> {
  const updates: Partial<XYFlowNodeRenderData> = {}

  // Version change
  if (current.version !== node.getVersion()) {
    updates.version = node.getVersion()
    updates.node = node // Update node reference
  }

  // Dimension change
  const dims = node.metadata.ui?.dimensions
  if (dims && (current.dimensions.width !== dims.width || current.dimensions.height !== dims.height)) {
    updates.dimensions = { width: dims.width, height: dims.height }
  }

  // Selection change
  const isSelected = node.metadata.ui?.state?.isSelected || false
  if (current.isSelected !== isSelected) {
    updates.isSelected = isSelected
  }

  // Draggable change
  const isDraggable = !node.metadata.ui?.state?.isMovingDisabled
  if (current.isDraggable !== isDraggable) {
    updates.isDraggable = isDraggable
  }

  // Hidden change
  const isHidden = node.metadata.ui?.state?.isHidden || false
  if (current.isHidden !== isHidden) {
    updates.isHidden = isHidden
  }

  // Category change
  const nodeType = node.metadata.category === NODE_CATEGORIES.GROUP ? 'groupNode' : 'chaingraphNode'
  if (current.nodeType !== nodeType) {
    updates.nodeType = nodeType
  }

  return updates
}

sample({
  clock: [
    // Node data changes (NOT port changes!)
    updateNode,
    updateNodes,
    // UI changes
    updateNodeUILocal,
    updateNodeDimensionsLocal,
    // Metadata changes
    setNodeMetadata,
    // REMOVED: setNodeVersion - version-only changes (port updates) should NOT trigger renders
  ],
  source: { renderMap: $xyflowNodeRenderMap, nodes: $nodes },
  fn: ({ renderMap, nodes }, payload): XYFlowNodesDataChangedPayload => {
    // Extract affected node IDs from the event payload
    const nodeIds = getNodeIdsFromPayload(payload)

    // PERF: Only process affected nodes, not all nodes (O(k) instead of O(N))
    const changes: XYFlowNodesDataChangedPayload['changes'] = []

    for (const nodeId of nodeIds) {
      const node = nodes[nodeId]
      const current = renderMap[nodeId]

      if (!node || !current) continue // Skip if node doesn't exist or not in render map yet

      const updates = computeNodeRenderUpdates(current, node)

      if (Object.keys(updates).length > 0) {
        changes.push({ nodeId, changes: updates })
      }
    }

    return { changes }
  },
  target: xyflowNodesDataChanged,
})

// ============================================================================
// WIRE 3: EXECUTION STATE CHANGES (Medium Frequency - execution events)
// ============================================================================
sample({
  clock: [$executionState, $executionNodes],
  source: { execNodes: $executionNodes, renderMap: $xyflowNodeRenderMap, execState: $executionState },
  fn: ({ execNodes, renderMap, execState }): XYFlowNodesDataChangedPayload => {
    // Compute execution style delta
    const changes: XYFlowNodesDataChangedPayload['changes'] = []

    for (const [nodeId, current] of Object.entries(renderMap)) {
      const execNode = execNodes[nodeId]
      const updates: Partial<XYFlowNodeRenderData> = {}

      // Execution status
      const status = (execNode?.status as XYFlowNodeRenderData['executionStatus']) || 'idle'
      if (current.executionStatus !== status) {
        updates.executionStatus = status
      }

      // Execution style (border/shadow)
      let execStyle: string | undefined
      if (execNode) {
        switch (execNode.status) {
          case 'running':
            execStyle = 'border-yellow-500 shadow-[0_0_20px_rgba(234,179,8,0.6)]'
            break
          case 'completed':
            execStyle = 'border-green-500 shadow-[0_0_20px_rgba(34,197,94,0.6)]'
            break
          case 'failed':
            execStyle = 'border-red-500 shadow-[0_0_20px_rgba(239,68,68,0.6)]'
            break
          default:
            execStyle = undefined
        }
      }
      if (current.executionStyle !== execStyle) {
        updates.executionStyle = execStyle
      }

      // Execution node data
      const executionNode = execNode
        ? {
          status: execNode.status,
          executionTime: execNode.executionTime,
          error: execNode.error,
          node: execNode.node,
        }
        : null

      // Deep comparison for execution node
      const currentExecNode = current.executionNode
      const execNodeChanged
        = (currentExecNode === null) !== (executionNode === null)
        || currentExecNode?.status !== executionNode?.status
        || currentExecNode?.executionTime !== executionNode?.executionTime
        || currentExecNode?.node !== executionNode?.node

      if (execNodeChanged) {
        updates.executionNode = executionNode
      }

      // Breakpoint change
      const hasBreakpoint = execState.breakpoints.has(nodeId)
      if (current.hasBreakpoint !== hasBreakpoint) {
        updates.hasBreakpoint = hasBreakpoint
      }

      // Debug mode change
      if (current.debugMode !== execState.debugMode) {
        updates.debugMode = execState.debugMode
      }

      if (Object.keys(updates).length > 0) {
        changes.push({ nodeId, changes: updates })
      }
    }

    return { changes }
  },
  target: xyflowNodesDataChanged,
})

// ============================================================================
// WIRE 4: HIGHLIGHT CHANGES (Low Frequency - user highlights nodes)
// ============================================================================
sample({
  clock: $highlightedNodeId,
  source: $xyflowNodeRenderMap,
  fn: (renderMap, highlightedIds): XYFlowNodesDataChangedPayload => {
    // Compute highlight delta
    const changes: XYFlowNodesDataChangedPayload['changes'] = []
    const highlightSet = new Set(highlightedIds || [])
    const hasAnyHighlights = highlightedIds !== null && highlightedIds.length > 0

    for (const [nodeId, current] of Object.entries(renderMap)) {
      const updates: Partial<XYFlowNodeRenderData> = {}

      const isHighlighted = highlightSet.has(nodeId)
      if (current.isHighlighted !== isHighlighted) {
        updates.isHighlighted = isHighlighted
      }

      if (current.hasAnyHighlights !== hasAnyHighlights) {
        updates.hasAnyHighlights = hasAnyHighlights
      }

      if (Object.keys(updates).length > 0) {
        changes.push({ nodeId, changes: updates })
      }
    }

    return { changes }
  },
  target: xyflowNodesDataChanged,
})

// ============================================================================
// WIRE 5: PULSE STATE CHANGES (Animation - 200ms intervals)
// ============================================================================
sample({
  clock: $nodesPulseState,
  source: $xyflowNodeRenderMap,
  fn: (renderMap, pulseMap): XYFlowNodesDataChangedPayload => {
    // Compute pulse delta
    const changes: XYFlowNodesDataChangedPayload['changes'] = []

    // Check nodes in renderMap
    for (const [nodeId, current] of Object.entries(renderMap)) {
      const pulseState = pulseMap.get(nodeId) || null
      if (current.pulseState !== pulseState) {
        changes.push({ nodeId, changes: { pulseState } })
      }
    }

    return { changes }
  },
  target: xyflowNodesDataChanged,
})

// ============================================================================
// WIRE 6: DROP FEEDBACK CHANGES (During drag operations)
// ============================================================================
sample({
  clock: $dragDropState,
  source: $xyflowNodeRenderMap,
  fn: (renderMap, dragState): XYFlowNodesDataChangedPayload => {
    // Compute drop feedback delta
    const changes: XYFlowNodesDataChangedPayload['changes'] = []

    for (const [nodeId, current] of Object.entries(renderMap)) {
      let dropFeedback: { canAcceptDrop: boolean, dropType: 'group' | 'schema' } | null = null

      // Check if this node is the hovered target
      const hoveredTarget = dragState.hoveredDropTarget
      if (hoveredTarget && hoveredTarget.nodeId === nodeId && dragState.canDrop) {
        dropFeedback = {
          canAcceptDrop: true,
          dropType: hoveredTarget.type,
        }
      } else {
        const potentialTarget = dragState.potentialDropTargets?.find(t => t.nodeId === nodeId)
        if (potentialTarget) {
          dropFeedback = {
            canAcceptDrop: false,
            dropType: potentialTarget.type,
          }
        }
      }

      // Compare with current
      const changed
        = (current.dropFeedback === null) !== (dropFeedback === null)
        || current.dropFeedback?.canAcceptDrop !== dropFeedback?.canAcceptDrop
        || current.dropFeedback?.dropType !== dropFeedback?.dropType

      if (changed) {
        changes.push({ nodeId, changes: { dropFeedback } })
      }
    }

    return { changes }
  },
  target: xyflowNodesDataChanged,
})

// ============================================================================
// WIRE 7: LAYER DEPTH CHANGES (Low Frequency - parent structure changes)
// ============================================================================
sample({
  clock: $nodeLayerDepth,
  source: $xyflowNodeRenderMap,
  fn: (renderMap, layerDepths): XYFlowNodesDataChangedPayload => {
    // Compute zIndex delta
    const changes: XYFlowNodesDataChangedPayload['changes'] = []

    for (const [nodeId, current] of Object.entries(renderMap)) {
      const zIndex = layerDepths[nodeId] ?? 0
      if (current.zIndex !== zIndex) {
        changes.push({ nodeId, changes: { zIndex } })
      }
    }

    return { changes }
  },
  target: xyflowNodesDataChanged,
})

// ============================================================================
// WIRE 8: CATEGORY METADATA CHANGES (Very Low Frequency - theme changes)
// ============================================================================
sample({
  clock: $categoryMetadata,
  source: { nodes: $nodes, renderMap: $xyflowNodeRenderMap, categoryMeta: $categoryMetadata },
  fn: ({ nodes, renderMap, categoryMeta }): XYFlowNodesDataChangedPayload => {
    // Compute category metadata delta
    const changes: XYFlowNodesDataChangedPayload['changes'] = []

    for (const [nodeId, current] of Object.entries(renderMap)) {
      const node = nodes[nodeId]
      if (!node)
        continue

      const categoryId = node.metadata.category || 'other'
      const newMeta = categoryMeta.get(categoryId) ?? categoryMeta.get(NODE_CATEGORIES.OTHER)

      if (newMeta && current.categoryMetadata !== newMeta) {
        changes.push({ nodeId, changes: { categoryMetadata: newMeta } })
      }
    }

    return { changes }
  },
  target: xyflowNodesDataChanged,
})
