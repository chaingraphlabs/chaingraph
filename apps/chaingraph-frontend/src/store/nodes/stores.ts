/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { INode } from '@badaitech/chaingraph-types'
import {
  addNode,
  addNodeToFlowFx,
  clearActiveFlow,
  clearNodes,
  removeNode,
  removeNodeFromFlowFx,
  setNodeMetadata,
  setNodes,
  setNodesLoading,
  setNodeVersion,
  updateNode,
  updateNodeParent,
  updateNodePositionInterpolated,
  updateNodePositionLocal,
  updateNodeUILocal,
} from '@/store'
import { updatePort, updatePortUI, updatePortValue } from '@/store/ports/events'
import { combine, createStore } from 'effector'

// Store for nodes
export const $nodes = createStore<Record<string, INode>>({})
  .on(setNodes, (_, nodes) => ({ ...nodes }))
  .on(addNode, (state, node) => ({
    ...state,
    [node.id]: node.clone(),
  }))
  .on(updateNode, (state, node) => ({
    ...state,
    [node.id]: node.clone(),
  }))
  .on(removeNode, (state, id) => {
    const { [id]: _, ...rest } = state
    return rest
  })
  .on(setNodeMetadata, (state, { nodeId, metadata }) => {
    const node = state[nodeId]
    if (!node)
      return state

    node.setMetadata(metadata)

    return {
      ...state,
      [nodeId]: node.clone(),
    }
  })
  .reset(clearNodes)
  .reset(clearActiveFlow)
  .on(setNodeVersion, (state, { nodeId, version }) => {
    const node = state[nodeId]
    if (!node) {
      console.error(`Node ${nodeId} not found in store`)
      return state
    }

    console.log(`Setting version for node ${nodeId} to ${version}`)

    node.setVersion(version)

    return {
      ...state,
      [nodeId]: node.clone(),
    }
  })
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
      port.setConfig(data.config)
      port.setValue(data.value)
    } catch (e: any) {
      console.error('Error updating port value:', e, data)
      return state
    }
    node.setVersion(nodeVersion)
    node.setPort(port)

    return {
      ...state,
      [nodeId]: node.clone(),
    }
  })
  .on(updatePortValue, (state, { nodeId, portId, value }) => {
    const node = state[nodeId]
    if (!node)
      return state

    const port = node.getPort(portId)
    if (!port)
      return state

    console.log('Pre port value updated', { nodeId, portId, value: port.getValue() })

    try {
      port.setValue(value)
    } catch (e: any) {
      console.error('Error updating port value:', e)
      return state
    }
    node.setPort(port)

    console.log('Port value updated', { nodeId, portId, value })

    return {
      ...state,
      [nodeId]: node.clone(),
    }
  })
  .on(updatePortUI, (state, { nodeId, portId, ui }) => {
    const node = state[nodeId]
    if (!node)
      return state

    const port = node.getPort(portId)
    if (!port)
      return state

    port.setConfig({
      ...port.getConfig(),
      ui: {
        ...port.getConfig().ui,
        ...ui,
      },
    })
    node.setPorts(node.ports) // set existing ports
    node.setPort(port) // set new port

    return {
      ...state,
      [node.id]: node.clone(),
    }
  })

// Update nodes store to handle UI updates
$nodes
  .on(updateNodeUILocal, (state, { nodeId, ui }) => {
    const node = state[nodeId]
    if (!node)
      return state

    if (!ui)
      return state

    node.setUI(ui, false)

    return {
      ...state,
      [nodeId]: node, // Do not clone if local UI changed!
    }
  })
  .on(updateNodePositionLocal, (state, { flowId, nodeId, position }) => {
    const node = state[nodeId]
    if (!node)
      return state

    // console.log(`[LOCAL] Updating node position for node ${nodeId}, position:`, position)

    // check if the position changed
    if (node.metadata.ui?.position?.x === position.x && node.metadata.ui?.position?.y === position.y)
      return state

    node.setPosition(position, false)

    return {
      ...state,
      [nodeId]: node, // Do not clone if local position changed!
    }
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

// Update store to handle interpolated positions
$nodes
  .on(updateNodePositionInterpolated, (state, { nodeId, position }) => {
    const node = state[nodeId]
    if (!node)
      return state

    node.setPosition(position, false)

    return {
      ...state,
      [nodeId]: node,
    }
  })

// updateNodeParent
$nodes
  .on(updateNodeParent, (state, { nodeId, parentNodeId }) => {
    const node = state[nodeId]
    if (!node)
      return state

    node.setMetadata({
      ...node.metadata,
      parentNodeId,
      ui: {
        ...node.metadata.ui,
        // position,
      },
    })

    return {
      ...state,
      [nodeId]: node,
    }
  })
