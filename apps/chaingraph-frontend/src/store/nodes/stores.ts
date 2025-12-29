/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { INode, Position } from '@badaitech/chaingraph-types'
import type {
  AddNodeEvent,
  NodeState,
  PasteNodesEvent,
  UpdateNodeDimensions,
  UpdateNodeParent,
  UpdateNodePosition,
  UpdateNodeTitleEvent,
  UpdateNodeUIEvent,
} from './types'
import { DefaultPosition } from '@badaitech/chaingraph-types'

import { combine, sample } from 'effector'
import { trace } from '@/lib/perf-trace'
import { globalReset } from '../common'
import { nodesDomain } from '../domains'

import { groupNodeDeleted } from '../edges/anchor-events'

import { $trpcClient } from '../trpc/store'
import { LOCAL_NODE_UI_DEBOUNCE_MS, NODE_DIMENSIONS_DEBOUNCE_MS, NODE_POSITION_DEBOUNCE_MS, NODE_UI_DEBOUNCE_MS } from './constants'
import { accumulateAndSample } from './operators/accumulate-and-sample'
import { positionInterpolator } from './position-interpolation-advanced'
// import './computed'

// EVENTS

// Local state CRUD events
export const addNode = nodesDomain.createEvent<INode>()
export const addNodes = nodesDomain.createEvent<INode[]>()
export const updateNode = nodesDomain.createEvent<INode>()
export const updateNodes = nodesDomain.createEvent<INode[]>()
export const removeNode = nodesDomain.createEvent<string>()
export const setNodeMetadata = nodesDomain.createEvent<{ nodeId: string, metadata: NodeState['metadata'] }>()
export const setNodeVersion = nodesDomain.createEvent<{ nodeId: string, version: number }>()
export const updateNodeParent = nodesDomain.createEvent<UpdateNodeParent>()

// Backend operation events
export const addNodeToFlow = nodesDomain.createEvent<AddNodeEvent>()
export const pasteNodesToFlow = nodesDomain.createEvent<PasteNodesEvent>()
export const removeNodeFromFlow = nodesDomain.createEvent<{ flowId: string, nodeId: string }>()

// Bulk operations
export const setNodes = nodesDomain.createEvent<Record<string, INode>>()
export const clearNodes = nodesDomain.createEvent()

// State events
export const setNodesLoading = nodesDomain.createEvent<boolean>()
export const setNodesError = nodesDomain.createEvent<Error | null>()

// UI update events
export const updateNodeUI = nodesDomain.createEvent<UpdateNodeUIEvent>()
export const updateNodeUILocal = nodesDomain.createEvent<UpdateNodeUIEvent>() // For optimistic updates
export const updateNodePosition = nodesDomain.createEvent<UpdateNodePosition>()
export const updateNodePositionLocal = nodesDomain.createEvent<UpdateNodePosition>() // For optimistic updates
// Drag state management (actual drag operations, not selection)
export const nodeDragStart = nodesDomain.createEvent<string>()
export const nodeDragEnd = nodesDomain.createEvent<string>()

// NEW: Position-only update that bypasses $nodes cascade (for drag performance)
export const updateNodePositionOnly = nodesDomain.createEvent<{
  nodeId: string
  position: Position
}>()

// Dimension update events
export const updateNodeDimensions = nodesDomain.createEvent<UpdateNodeDimensions>()
export const updateNodeDimensionsLocal = nodesDomain.createEvent<UpdateNodeDimensions>() // For optimistic updates

export const updateNodeTitle = nodesDomain.createEvent<UpdateNodeTitleEvent>()

// New event for interpolated position updates
export const updateNodePositionInterpolated = nodesDomain.createEvent<{
  nodeId: string
  position: Position
}>()

// EFFECTS

// Backend node operations
export const addNodeToFlowFx = nodesDomain.createEffect(async (event: AddNodeEvent) => {
  const client = $trpcClient.getState()
  if (!client) {
    throw new Error('TRPC client is not initialized')
  }
  return client.flow.addNode.mutate({
    flowId: event.flowId,
    nodeType: event.nodeType,
    position: event.position,
    metadata: event.metadata,
    portsConfig: event.portsConfig,
  })
})

export const pasteNodesToFlowFx = nodesDomain.createEffect(async (event: PasteNodesEvent) => {
  const client = $trpcClient.getState()
  if (!client) {
    throw new Error('TRPC client is not initialized')
  }

  return client.flow.pasteNodes.mutate({
    flowId: event.flowId,
    clipboardData: event.clipboardData,
    pastePosition: event.pastePosition,
    virtualOrigin: event.virtualOrigin,
  })
})

export const initInterpolatorFx = nodesDomain.createEffect(() => {
  // Initialize interpolator update handler
  positionInterpolator.onUpdate = (nodeId, position) => {
    updateNodePositionInterpolated({
      nodeId,
      position,
    })
  }

  positionInterpolator.start()
})

const clearInterpolatorFx = nodesDomain.createEffect(() => {
  positionInterpolator.dispose()
})

export const removeNodeFromFlowFx = nodesDomain.createEffect(async (params: {
  flowId: string
  nodeId: string
}) => {
  const client = $trpcClient.getState()
  if (!client) {
    throw new Error('TRPC client is not initialized')
  }
  return client.flow.removeNode.mutate(params)
})

export const updateNodeUIFx = nodesDomain.createEffect(async (params: UpdateNodeUIEvent): Promise<UpdateNodeUIEvent> => {
  const client = $trpcClient.getState()

  if (!client) {
    throw new Error('TRPC client is not initialized')
  }
  if (!params.ui) {
    throw new Error('UI metadata is required')
  }

  return client.flow.updateNodeUI.mutate({
    flowId: params.flowId,
    nodeId: params.nodeId,
    ui: params.ui,
    version: params.version,
  })
})

export const updateNodeTitleFx = nodesDomain.createEffect(async (params: UpdateNodeTitleEvent): Promise<UpdateNodeTitleEvent> => {
  const client = $trpcClient.getState()

  if (!client) {
    throw new Error('TRPC client is not initialized')
  }
  if (!params.title) {
    throw new Error('Title is required')
  }

  return client.flow.updateNodeTitle.mutate({
    flowId: params.flowId,
    nodeId: params.nodeId,
    title: params.title,
    version: params.version,
  })
})

export const updateNodeParentFx = nodesDomain.createEffect(async (params: UpdateNodeParent): Promise<UpdateNodeParent> => {
  const client = $trpcClient.getState()

  if (!client) {
    throw new Error('TRPC client is not initialized')
  }
  return client.flow.updateNodeParent.mutate({
    flowId: params.flowId,
    nodeId: params.nodeId,
    parentNodeId: params.parentNodeId,
    position: params.position,
    version: params.version,
  })
})

export const baseUpdateNodePositionFx = nodesDomain.createEffect(async (params: UpdateNodePosition) => {
  const client = $trpcClient.getState()

  if (!client) {
    throw new Error('TRPC client is not initialized')
  }
  return client.flow.updateNodePosition.mutate({
    ...params,
    version: params.version,
  })
})

// Store for nodes
export const $nodes = nodesDomain.createStore<Record<string, INode>>({})
  .on(setNodes, (_, nodes) => ({ ...nodes }))

  // Single node operations - only clone the affected node and preserve others
  .on(addNode, (state, node) => {
    // PERF: Skip if node already exists with same reference
    if (state[node.id] === node) {
      return state
    }
    return { ...state, [node.id]: node }
  })

  // Add nodes operation
  .on(addNodes, (state, nodes) => {
    // PERF: Check if any nodes actually need updating
    const nodesToAdd = nodes.filter(node => state[node.id] !== node)
    if (nodesToAdd.length === 0) {
      return state
    }

    const newState = { ...state }
    nodesToAdd.forEach((node) => {
      newState[node.id] = node
    })

    return newState
  })

  // Update nodes operation
  .on(updateNodes, (state, nodes) => {
    const spanId = trace.start('store.$nodes.updateNodes', {
      category: 'store',
      tags: { count: nodes.length },
    })

    // PERF: Filter nodes that actually need updating (different reference or newer version)
    const nodesToUpdate = nodes.filter((node) => {
      const existing = state[node.id]
      if (!existing)
        return true // New node
      if (existing.getVersion() >= node.getVersion())
        return false // Outdated
      if (existing === node)
        return false // Same reference
      return true
    })

    if (nodesToUpdate.length === 0) {
      trace.end(spanId)
      return state
    }

    const newState = { ...state }
    nodesToUpdate.forEach((node) => {
      newState[node.id] = node
    })

    trace.end(spanId)
    return newState
  })

  .on(updateNode, (state, node) => {
    const spanId = trace.start('store.$nodes.updateNode', { category: 'store' })

    const existing = state[node.id]

    // PERF: Skip if reference unchanged
    if (existing === node) {
      trace.end(spanId)
      return state
    }

    // PERF: Skip if version not newer (handles race conditions)
    if (existing && existing.getVersion() >= node.getVersion()) {
      trace.end(spanId)
      return state
    }

    trace.end(spanId)
    return { ...state, [node.id]: node }
  })

  .on(removeNode, (state, id) => {
    // Use object destructuring for clean removal without full state copy
    const { [id]: _, ...rest } = state
    return rest
  })

  // Reset handlers
  .reset(clearNodes)
  // .reset(clearActiveFlow)

  // Metadata update operations
  .on(setNodeMetadata, (state, { nodeId, metadata }) => {
    const node = state[nodeId]
    if (!node)
      return state

    // Clone only the node being modified
    const updatedNode = node.clone()
    updatedNode.setMetadata(metadata)

    // Return new state with just the updated node changed
    return { ...state, [nodeId]: updatedNode }
  })

  // Version update - important for change tracking
  .on(setNodeVersion, (state, { nodeId, version }) => {
    const node = state[nodeId]
    if (!node) {
      console.error(`Node ${nodeId} not found in store`)
      return state
    }

    // PERF: Skip if version already set (prevents unnecessary clone and cascade)
    if (node.getVersion() === version) {
      return state
    }

    // Only clone the node we're updating
    const updatedNode = node// .clone()
    updatedNode.setVersion(version)

    // Return new state with just the updated node changed
    return { ...state, [nodeId]: updatedNode }
  })

  // ============================================================================
  // PORT UPDATES
  // ============================================================================
  // Port updates are now handled by the ports-v2 granular store system.
  // See: store/ports-v2/stores.ts
  //
  // Port data should ONLY be managed by ports-v2:
  // - Port UI: $portUI store (via requestUpdatePortUI event)
  // - Port Values: $portValues store (via requestUpdatePortValue event)
  // - Port Config: $portConfigs store (via PortUpdated subscription)
  //
  // The $nodes store should NEVER be updated when port data changes.
  // This prevents cascading re-renders across all nodes.
  //
  // REMOVED HANDLERS (2025-12-19):
  // - updatePort: Cloned entire node on port config/value changes
  // - requestUpdatePortValue: Cloned entire node on port value changes
  // - updatePortUI: Cloned entire node on port UI changes (caused 232 renders!)
  //
  // These handlers caused cascades: port change → node.clone() → $nodes update
  // → ALL nodes' useNode() hooks re-evaluate → mass re-renders (54+ components)
  // ============================================================================
  .reset(globalReset)

// NEW: Separate position store for drag performance optimization
// This store tracks positions independently from $nodes to prevent cascade recalculations
// during drag operations. Only $xyflowNodes subscribes to this, avoiding triggering
// $nodePortEdgesMap, $nodeExecutionStyles, $nodeLayerDepth, etc.
//
// IMPORTANT: This store must stay synchronized with $nodes.metadata.ui.position for consistency!
export const $nodePositions = nodesDomain.createStore<Record<string, Position>>({})
  // Drag-only position updates (performance-critical path)
  .on(updateNodePositionOnly, (state, { nodeId, position }) => {
    const current = state[nodeId]
    if (current?.x === position.x && current?.y === position.y) {
      return state // Same reference - no cascade
    }
    return { ...state, [nodeId]: position }
  })
  // Local position updates (resize, drop, etc.) - must sync immediately!
  .on(updateNodePositionLocal, (state, { nodeId, position }) => {
    const current = state[nodeId]
    if (current?.x === position.x && current?.y === position.y) {
      return state
    }
    return { ...state, [nodeId]: position }
  })
  // Interpolated positions (server sync)
  .on(updateNodePositionInterpolated, (state, { nodeId, position }) => {
    const current = state[nodeId]
    if (current?.x === position.x && current?.y === position.y) {
      return state
    }
    return { ...state, [nodeId]: position }
  })
  // Parent changes include position updates
  .on(updateNodeParent, (state, { nodeId, position }) => {
    const current = state[nodeId]
    if (current?.x === position.x && current?.y === position.y) {
      return state
    }
    return { ...state, [nodeId]: position }
  })
  // Node CRUD operations - sync initial positions
  .on(addNode, (state, node) => {
    const position = node.metadata.ui?.position
    if (!position)
      return state
    return { ...state, [node.id]: position }
  })
  .on(addNodes, (state, nodes) => {
    const newState = { ...state }
    nodes.forEach((node) => {
      const position = node.metadata.ui?.position
      if (position) {
        newState[node.id] = position
      }
    })
    return newState
  })
  .on(updateNode, (state, node) => {
    const position = node.metadata.ui?.position
    if (!position)
      return state
    const current = state[node.id]
    if (current?.x === position.x && current?.y === position.y) {
      return state
    }
    return { ...state, [node.id]: position }
  })
  // UI updates that include position changes
  .on(updateNodeUILocal, (state, { nodeId, ui }) => {
    if (!ui?.position)
      return state
    const current = state[nodeId]
    if (current?.x === ui.position.x && current?.y === ui.position.y) {
      return state
    }
    return { ...state, [nodeId]: ui.position }
  })
  // Clear position when node is removed
  .on(removeNode, (state, nodeId) => {
    const { [nodeId]: _, ...rest } = state
    return rest
  })
  .reset(clearNodes)
  .reset(globalReset)

// PERF: Event to trigger layer depth recalculation only when parent structure changes
// This decouples layer depth from every $nodes update (position, port changes don't affect depth)
export const recalculateNodeLayerDepth = nodesDomain.createEvent()

// Helper function to calculate layer depths for all nodes
function calculateAllNodeDepths(nodes: Record<string, INode>): Record<string, number> {
  const depthCache = new Map<string, number>()

  // Helper function to calculate depth recursively with cycle detection
  const calculateDepth = (nodeId: string, visited = new Set<string>()): number => {
    // Return cached value if already calculated
    if (depthCache.has(nodeId)) {
      return depthCache.get(nodeId)!
    }

    const node = nodes[nodeId]
    if (!node) {
      return 0
    }

    // Nodes without parents are at layer 0
    if (!node.metadata.parentNodeId) {
      depthCache.set(nodeId, 0)
      return 0
    }

    // Detect circular references
    if (visited.has(nodeId)) {
      console.warn(`Circular reference detected for node ${nodeId}, returning depth 0`)
      depthCache.set(nodeId, 0)
      return 0
    }

    // Calculate parent depth recursively
    visited.add(nodeId)
    const parentDepth = calculateDepth(node.metadata.parentNodeId, visited)
    const depth = parentDepth + 1

    depthCache.set(nodeId, depth)
    return depth
  }

  // Calculate depths for all nodes
  const depths: Record<string, number> = {}
  Object.keys(nodes).forEach((nodeId) => {
    depths[nodeId] = calculateDepth(nodeId)
  })

  return depths
}

// Store that tracks the nodes parent layer depth, so nodes without parents are 0 layer, and each child node increases the layer by 1
// PERF: Now event-driven instead of combine($nodes) - only recalculates when parent structure actually changes
export const $nodeLayerDepth = nodesDomain.createStore<Record<string, number>>({})
  .on(recalculateNodeLayerDepth, () => {
    // TODO: ANTIPATTERN, needs to use sample instead to avoid .getState() in store
    const nodes = $nodes.getState()
    return calculateAllNodeDepths(nodes)
  })
  .reset(clearNodes)
  .reset(globalReset)

// PERF: Wire parent structure changes to trigger layer depth recalculation
// This is much more efficient than recalculating on every $nodes change
sample({
  clock: [addNode, addNodes, removeNode, updateNodeParent, setNodes],
  target: recalculateNodeLayerDepth,
})

// Store that provides nodes grouped by their layer depth
export const $nodesByLayer = combine(
  $nodes,
  $nodeLayerDepth,
  (nodes, depths) => {
    const layers: Map<number, INode[]> = new Map()

    Object.entries(nodes).forEach(([nodeId, node]) => {
      const depth = depths[nodeId] || 0

      if (!layers.has(depth)) {
        layers.set(depth, [])
      }

      layers.get(depth)!.push(node)
    })

    // Sort layers by depth and convert to array
    const sortedLayers = Array.from(layers.entries())
      .sort(([depthA], [depthB]) => depthA - depthB)
      .map(([depth, nodes]) => ({
        depth,
        nodes: nodes.sort((a, b) => a.id.localeCompare(b.id)), // Sort nodes within layer for consistency
      }))

    return sortedLayers
  },
)

// Store that provides the maximum depth in the current flow
export const $maxNodeDepth = combine(
  $nodeLayerDepth,
  (depths) => {
    if (Object.keys(depths).length === 0) {
      return 0
    }

    return Math.max(...Object.values(depths))
  },
)

/**
 * REMOVED: $xyflowNodes re-export to break circular dependency
 *
 * PERFORMANCE OPTIMIZATION (Step 5 - XYFlow Domain Architecture):
 * The optimized $xyflowNodes is now available at: @/store/xyflow
 *
 * Import with:
 * import { $xyflowNodesList as $xyflowNodes } from '@/store/xyflow'
 *
 * Benefits:
 * - 70% fewer component subscriptions (13 → 4)
 * - 97% fewer re-renders during drag operations
 * - O(1) delta updates instead of O(N) full recalculation
 * - Fork-compatible (no .getState() in hot paths)
 * - No circular dependency
 *
 * See: store/xyflow/README.md for architecture details
 */

// Update nodes store to handle UI updates
$nodes
  .on(updateNodeUILocal, (state, { nodeId, ui }) => {
    const node = state[nodeId]
    if (!node || !ui)
      return state

    // Clone the node for the UI update
    const updatedNode = node.clone()

    const newUI = {
      ...updatedNode.metadata.ui ?? {},
      ...ui ?? {},
      position: {
        ...updatedNode.metadata.ui?.position ?? DefaultPosition,
        ...ui.position ?? {},
      },
      state: {
        ...updatedNode.metadata.ui?.state ?? {},
        ...ui.state ?? {},
      },
      style: {
        ...updatedNode.metadata.ui?.style ?? {},
        ...ui.style ?? {},
      },
    }

    if (updatedNode.metadata.ui?.dimensions || ui.dimensions) {
      newUI.dimensions = {
        ...updatedNode.metadata.ui?.dimensions ?? {
          width: 200,
          height: 200,
        },
        ...ui.dimensions ?? {},
      }
    }

    updatedNode.setUI(newUI, false)

    return { ...state, [nodeId]: updatedNode }
  })

  .on(updateNodePositionLocal, (state, { flowId, nodeId, position }) => {
    // Don't modify state if node doesn't exist
    const node = state[nodeId]
    if (!node)
      return state

    // Skip update if position is unchanged
    if (
      node.metadata.ui?.position?.x === position.x
      && node.metadata.ui?.position?.y === position.y
    ) {
      return state
    }

    // Clone the node and update its position
    const updatedNode = node// .clone()
    // const updatedNode = node
    updatedNode.setPosition(position, false)

    // Fix: Use updatedNode instead of node
    return { ...state, [nodeId]: updatedNode }
  })

  .on(updateNodeDimensionsLocal, (state, { nodeId, dimensions }) => {
    // Don't modify state if node doesn't exist
    const node = state[nodeId]
    if (!node)
      return state

    // Merge dimensions - preserve existing values for fields not provided
    // This allows width-only updates (resize handle) and height-only updates (content detection)
    // to work independently without interfering with each other
    const currentDimensions = node.metadata.ui?.dimensions
    const newDimensions = {
      width: dimensions.width ?? currentDimensions?.width,
      height: dimensions.height ?? currentDimensions?.height,
    }

    // Skip update if dimensions are unchanged or if we don't have any dimension to set
    if (!newDimensions.width && !newDimensions.height) {
      return state
    }

    if (
      currentDimensions?.width === newDimensions.width
      && currentDimensions?.height === newDimensions.height
    ) {
      return state
    }

    // Update the node's dimensions
    const updatedNode = node.clone()
    const dimensionsToSet = {
      width: newDimensions.width ?? 200, // Default width if never set
      height: newDimensions.height ?? 100, // Default height if never set
    }

    updatedNode.setDimensions(dimensionsToSet, false)

    return { ...state, [nodeId]: updatedNode }
  })

// Update store to handle interpolated positions
$nodes
  .on(updateNodePositionInterpolated, (state, { nodeId, position }) => {
    const node = state[nodeId]
    if (!node)
      return state

    // PERF: Skip if position unchanged (within 1px tolerance) - prevents clone and cascade
    const currentPos = node.metadata.ui?.position
    if (currentPos
      && Math.abs(currentPos.x - position.x) < 1
      && Math.abs(currentPos.y - position.y) < 1) {
      return state
    }

    // Clone the node and update its position
    const updatedNode = node.clone()
    updatedNode.setPosition(position, false)

    return { ...state, [nodeId]: updatedNode }
  })

// Update node parent
$nodes
  .on(updateNodeParent, (state, { nodeId, parentNodeId }) => {
    const node = state[nodeId]
    if (!node)
      return state

    // Clone the node and update its parent
    const updatedNode = node.clone()
    updatedNode.setMetadata({
      ...updatedNode.metadata,
      parentNodeId,
      ui: {
        ...updatedNode.metadata.ui,
      },
    })

    return { ...state, [nodeId]: updatedNode }
  })

// Loading states
export const $isNodesLoading = nodesDomain.createStore(false)
  .on(setNodesLoading, (_, isLoading) => isLoading)
  .on(addNodeToFlowFx.pending, (_, isPending) => isPending)
  .on(removeNodeFromFlowFx.pending, (_, isPending) => isPending)
  .reset(globalReset)

// Error states
export const $addNodeError = nodesDomain.createStore<Error | null>(null)
  .on(addNodeToFlowFx.failData, (_, error) => error)
  .reset(addNodeToFlowFx.done)
  .reset(globalReset)

export const $removeNodeError = nodesDomain.createStore<Error | null>(null)
  .on(removeNodeFromFlowFx.failData, (_, error) => error)
  .reset(removeNodeFromFlowFx.done)
  .reset(globalReset)

// Combined error store
export const $nodesError = combine(
  $addNodeError,
  $removeNodeError,
  (addError, removeError) => addError || removeError,
)

// SAMPLES

// * * * * * * * * * * * * * * *
// CRUD operations
// * * * * * * * * * * * * * * *
// Handle backend node operations
sample({
  clock: addNodeToFlow,
  target: addNodeToFlowFx,
})

sample({
  clock: pasteNodesToFlow,
  target: pasteNodesToFlowFx,
})

sample({
  clock: removeNodeFromFlow,
  target: removeNodeFromFlowFx,
})

// Wire: removeNode → check if group and fire groupNodeDeleted
// Internal event for group deletion check
const nodeRemovedWithCategory = nodesDomain.createEvent<{
  nodeId: string
  wasGroup: boolean
}>()

// CRITICAL: Capture node data BEFORE removal (reactive pattern)
sample({
  clock: removeNode,
  source: $nodes,
  fn: (nodes, nodeId) => {
    const node = nodes[nodeId]
    return { nodeId, wasGroup: node?.metadata.category === 'group' }
  },
  target: nodeRemovedWithCategory,
})

// Wire: If removed node was a group, trigger groupNodeDeleted
sample({
  clock: nodeRemovedWithCategory,
  filter: ({ wasGroup }) => wasGroup === true,
  fn: ({ nodeId }) => nodeId,
  target: groupNodeDeleted,
})

// * * * * * * * * * * * * * * *
// Position operations
// * * * * * * * * * * * * * * *

// Update local position immediately with small debounce
const throttledUpdateNodePositionLocal = accumulateAndSample({
  source: [updateNodePosition],
  timeout: LOCAL_NODE_UI_DEBOUNCE_MS,
  getKey: update => update.nodeId,
})

sample({
  clock: throttledUpdateNodePositionLocal,
  // clock: updateNodePosition,
  target: [updateNodePositionLocal],
})

// throttled node position updates
const throttledUpdatePosition = accumulateAndSample({
  source: [updateNodePosition],
  timeout: NODE_POSITION_DEBOUNCE_MS,
  getKey: update => update.nodeId,
})

// Update local node version and send the updated position to the server
sample({
  source: $nodes,
  clock: throttledUpdatePosition,
  fn: (nodes, params) => ({
    ...params,
    version: (nodes[params.nodeId]?.getVersion() ?? 0) + 1,
  }),
  target: [setNodeVersion, baseUpdateNodePositionFx],
})

// * * * * * * * * * * * * * * *
// Dimension operations
// * * * * * * * * * * * * * * *

// Fast path: Update local dimensions immediately (~11ms)
const throttledUpdateNodeDimensionsLocal = accumulateAndSample({
  source: [updateNodeDimensions],
  timeout: LOCAL_NODE_UI_DEBOUNCE_MS,
  getKey: update => update.nodeId,
})

sample({
  clock: throttledUpdateNodeDimensionsLocal,
  target: [updateNodeDimensionsLocal],
})

// Slow path: Server sync (~500ms)
const throttledUpdateDimensions = accumulateAndSample({
  source: [updateNodeDimensions],
  timeout: NODE_DIMENSIONS_DEBOUNCE_MS,
  getKey: update => update.nodeId,
})

// Version increment and server sync for dimensions
sample({
  source: $nodes,
  clock: throttledUpdateDimensions,
  fn: (nodes, params) => {
    const node = nodes[params.nodeId]
    const currentDimensions = node?.metadata.ui?.dimensions

    // Merge incoming dimensions with current - backend requires both width and height
    const mergedDimensions = {
      width: params.dimensions.width ?? currentDimensions?.width ?? 200,
      height: params.dimensions.height ?? currentDimensions?.height ?? 100,
    }

    return {
      flowId: params.flowId,
      nodeId: params.nodeId,
      ui: { dimensions: mergedDimensions },
      version: (node?.getVersion() ?? 0) + 1,
    }
  },
  target: [setNodeVersion, updateNodeUIFx],
})

// * * * * * * * * * * * * * * *
// Node operations
// * * * * * * * * * * * * * * *

// On node parent update, update the local node version and send the updated parent to the server
sample({
  source: $nodes,
  clock: updateNodeParent,
  fn: (nodes, params) => ({
    ...params,
    version: (nodes[params.nodeId].getVersion() ?? 0) + 1,
  }),
  target: [setNodeVersion, updateNodeParentFx],
})

// * * * * * * * * * * * * * * *
// Node UI operations
// * * * * * * * * * * * * * * *

sample({
  clock: updateNodeTitle,
  source: $nodes,
  // set actual node version before sending to the server
  fn: (nodes, params) => ({
    ...params,
    version: (nodes[params.nodeId].getVersion() ?? 0) + 1,
  }),
  target: [updateNodeTitleFx],
})

// Handle optimistic updates
const throttledUpdateNodeUILocal = accumulateAndSample({
  source: [updateNodeUI],
  timeout: LOCAL_NODE_UI_DEBOUNCE_MS,
  getKey: update => update.nodeId,
})

sample({
  clock: throttledUpdateNodeUILocal,
  target: [updateNodeUILocal],
})

const throttledUIUpdate = accumulateAndSample({
  source: [updateNodeUI],
  timeout: NODE_UI_DEBOUNCE_MS,
  getKey: update => update.nodeId,
})

// Create middleware to update the version of the node before sending it to the server
sample({
  clock: throttledUIUpdate,
  source: $nodes,
  fn: (nodes, params) => {
    return {
      ...params,
      version: (nodes[params.nodeId].getVersion() ?? 0) + 1,
    }
  },
  target: [setNodeVersion, updateNodeUIFx],
})

sample({
  clock: clearNodes,
  target: clearInterpolatorFx,
})

// Derived store that provides only the IDs of selected nodes
export const $selectedNodeIds = combine(
  $nodes,
  (nodes): string[] => {
    return Object.entries(nodes)
      .filter(([_, node]) => node.metadata.ui?.state?.isSelected === true)
      .map(([nodeId]) => nodeId)
  },
)

// Create store for dragging nodes (nodes which user moves right now)
// Uses actual drag events from XYFlow callbacks, not selection state
export const $draggingNodes = nodesDomain.createStore<string[]>([])
  .on(nodeDragStart, (state, nodeId) => {
    if (!state.includes(nodeId)) {
      return [...state, nodeId]
    }
    return state
  })
  .on(nodeDragEnd, (state, nodeId) => {
    return state.filter(id => id !== nodeId)
  })
  .reset(globalReset)

// ============================================================================
// VERSION STORE (Granular - prevents cascade on port-only changes)
// ============================================================================
export { $nodeVersions, setNodeVersionOnly, useNodeVersion } from './version-store'
