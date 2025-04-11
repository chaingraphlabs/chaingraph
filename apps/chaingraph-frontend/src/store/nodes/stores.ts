/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { INode } from '@badaitech/chaingraph-types'
import { combine, createStore } from 'effector'
import { sample } from 'effector'
import { clearActiveFlow } from '../flow/events'
import { updatePort, updatePortUI, updatePortValue } from '../ports/events'
import {
  LOCAL_NODE_UI_DEBOUNCE_MS,
  NODE_POSITION_DEBOUNCE_MS,
  NODE_UI_DEBOUNCE_MS,
} from './constants'

import { addNodeToFlowFx, baseUpdateNodePositionFx, removeNodeFromFlowFx, updateNodeParentFx, updateNodeUIFx } from './effects'

import {
  addNode,
  addNodes,
  addNodeToFlow,
  clearNodes,
  removeNode,
  removeNodeFromFlow,
  setNodeMetadata,
  setNodes,
  setNodesLoading,
  setNodeVersion,
  updateNode,
  updateNodeParent,
  updateNodePosition,
  updateNodePositionInterpolated,
  updateNodePositionLocal,
  updateNodeUI,
  updateNodeUILocal,
} from './events'
import { accumulateAndSample } from './operators/accumulate-and-sample'
import './interpolation-init'

// Store for nodes
export const $nodes = createStore<Record<string, INode>>({})
  .on(setNodes, (_, nodes) => ({ ...nodes }))

  // Single node operations - only clone the affected node and preserve others
  .on(addNode, (state, node) => {
    return { ...state, [node.id]: node }
  })

  // Add nodes operation
  .on(addNodes, (state, nodes) => {
    const newState = { ...state }
    nodes.forEach((node) => {
      newState[node.id] = node
    })

    return newState
  })

  .on(updateNode, (state, node) => {
    // Create a new state object, but only clone the node we're updating
    return { ...state, [node.id]: node }
  })

  .on(removeNode, (state, id) => {
    // Use object destructuring for clean removal without full state copy
    const { [id]: _, ...rest } = state
    return rest
  })

  // Reset handlers
  .reset(clearNodes)
  .reset(clearActiveFlow)

  // Metadata update operations
  .on(setNodeMetadata, (state, { nodeId, metadata }) => {
    const node = state[nodeId]
    if (!node)
      return state

    // Clone only the node being modified
    const updatedNode = node // .clone()
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

    // Only clone the node we're updating
    const updatedNode = node// .clone()
    updatedNode.setVersion(version)

    // Return new state with just the updated node changed
    return { ...state, [nodeId]: updatedNode }
  })

  // Port operations
  .on(updatePort, (state, { id, data, nodeVersion }) => {
    if (!data || !data.config)
      return state

    const nodeId = data.config?.nodeId
    if (!nodeId)
      return state

    const node = state[nodeId]
    if (!node)
      return state

    const port = node.getPort(id)
    if (!port)
      return state

    try {
      // Clone both node and port to maintain immutability
      const updatedNode = node// .clone()
      const updatedPort = port.clone()

      updatedPort.setConfig(data.config)
      updatedPort.setValue(data.value)

      updatedNode.setVersion(nodeVersion)
      updatedNode.setPort(updatedPort)

      return { ...state, [nodeId]: updatedNode }
    } catch (e: any) {
      console.error('Error updating port value:', e, data)
      return state
    }
  })

  .on(updatePortValue, (state, { nodeId, portId, value }) => {
    const node = state[nodeId]
    if (!node)
      return state

    const port = node.getPort(portId)
    if (!port)
      return state

    try {
      // Clone both node and port
      const updatedNode = node.clone()
      const updatedPort = port.clone()

      updatedPort.setValue(value)
      updatedNode.setPort(updatedPort)

      return { ...state, [nodeId]: updatedNode }
    } catch (e: any) {
      console.error('Error updating port value:', e)
      return state
    }
  })

  .on(updatePortUI, (state, { nodeId, portId, ui }) => {
    const node = state[nodeId]
    if (!node)
      return state

    const port = node.getPort(portId)
    if (!port)
      return state

    // Clone both node and port
    const updatedNode = node// .clone()
    const updatedPort = port.clone()

    updatedPort.setConfig({
      ...updatedPort.getConfig(),
      ui: {
        ...updatedPort.getConfig().ui,
        ...ui,
      },
    })

    updatedNode.setPorts(updatedNode.ports) // Keep existing ports
    updatedNode.setPort(updatedPort) // Update the specific port

    return { ...state, [nodeId]: updatedNode }
  })

// Update nodes store to handle UI updates
$nodes
  .on(updateNodeUILocal, (state, { nodeId, ui }) => {
    const node = state[nodeId]
    if (!node || !ui)
      return state

    // Clone the node for the UI update
    const updatedNode = node// .clone()
    updatedNode.setUI(ui, false)

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
    const updatedNode = node.clone()
    // const updatedNode = node
    updatedNode.setPosition(position, false)

    // Fix: Use updatedNode instead of node
    return { ...state, [nodeId]: updatedNode }
  })

// Update store to handle interpolated positions
$nodes
  .on(updateNodePositionInterpolated, (state, { nodeId, position }) => {
    const node = state[nodeId]
    if (!node)
      return state

    // Clone the node and update its position
    const updatedNode = node// .clone()
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
    const updatedNode = node// .clone()
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
export const $isNodesLoading = createStore(false)
  .on(setNodesLoading, (_, isLoading) => isLoading)
  .on(addNodeToFlowFx.pending, (_, isPending) => isPending)
  .on(removeNodeFromFlowFx.pending, (_, isPending) => isPending)

// Error states
export const $addNodeError = createStore<Error | null>(null)
  .on(addNodeToFlowFx.failData, (_, error) => error)
  .reset(addNodeToFlowFx.done)

export const $removeNodeError = createStore<Error | null>(null)
  .on(removeNodeFromFlowFx.failData, (_, error) => error)
  .reset(removeNodeFromFlowFx.done)

// Combined error store
export const $nodesError = combine(
  $addNodeError,
  $removeNodeError,
  (addError, removeError) => addError || removeError,
)

///////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////

// * * * * * * * * * * * * * * *
// CRUD operations
// * * * * * * * * * * * * * * *
// Handle backend node operations
sample({
  clock: addNodeToFlow,
  target: addNodeToFlowFx,
})

sample({
  clock: removeNodeFromFlow,
  target: removeNodeFromFlowFx,
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
  // clock: throttledUpdateNodePositionLocal,
  clock: updateNodePosition,
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
  clock: throttledUpdatePosition,
  source: $nodes,
  fn: (nodes, params) => ({
    ...params,
    version: (nodes[params.nodeId]?.getVersion() ?? 0) + 1,
  }),
  target: [setNodeVersion, baseUpdateNodePositionFx],
})

// * * * * * * * * * * * * * * *
// Node operations
// * * * * * * * * * * * * * * *

// On node parent update, update the local node version and send the updated parent to the server
sample({
  clock: updateNodeParent,
  source: $nodes,
  fn: (nodes, params) => ({
    ...params,
    version: (nodes[params.nodeId].getVersion() ?? 0) + 1,
  }),
  target: [setNodeVersion, updateNodeParentFx],
})

// * * * * * * * * * * * * * * *
// Node UI operations
// * * * * * * * * * * * * * * *

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
