import type { INode } from '@chaingraph/types'
import { combine, createStore } from 'effector'
import {
  addNodeToFlowFx,
  removeNodeFromFlowFx,
} from './effects'
import {
  addNode,
  clearNodes,
  removeNode,
  setNodeMetadata,
  setNodes,
  setNodesLoading,
  setNodeVersion,
  updateNodePositionInterpolated,
  updateNodePositionLocal,
  updateNodeUILocal,
} from './events'

// Store for nodes
export const $nodes = createStore<Record<string, INode>>({})
  .on(setNodes, (_, nodes) => ({ ...nodes }))
  .on(addNode, (state, node) => ({
    ...state,
    [node.id]: node,
  }))
  .on(removeNode, (state, id) => {
    const { [id]: _, ...rest } = state
    return rest
  })
  .on(setNodeMetadata, (state, { id, metadata }) => {
    const node = state[id]
    if (!node)
      return state

    node.setMetadata(metadata)

    return {
      ...state,
      [id]: node,
    }
  })
  .reset(clearNodes)
  .on(setNodeVersion, (state, { id, version }) => {
    const node = state[id]
    if (!node)
      return state

    // console.log(`Setting version for node ${id} to ${version}`)

    node.setMetadata({
      ...node.metadata,
      version,
    })

    return {
      ...state,
      [id]: node,
    }
  })

// Update nodes store to handle UI updates
$nodes
  .on(updateNodeUILocal, (state, { flowId, nodeId, ui }) => {
    const node = state[nodeId]
    if (!node)
      return state

    node.setMetadata({
      ...node.metadata,
      ui: {
        ...node.metadata.ui,
        ...ui,
      },
    })

    return {
      ...state,
      [nodeId]: node,
    }
  })
  .on(updateNodePositionLocal, (state, { flowId, nodeId, position }) => {
    const node = state[nodeId]
    if (!node)
      return state

    // console.log(`[LOCAL] Updating node position for node ${nodeId}, position:`, position)

    node.setMetadata({
      ...node.metadata,
      ui: {
        ...node.metadata.ui,
        position,
      },
    })

    return {
      ...state,
      [nodeId]: node,
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

// Computed stores
// export const $nodesList = $nodesWithVersions.map(
//   nodes => Object.values(nodes),
// )
// export const $nodesCount = $nodesWithVersions.map(
//   nodes => Object.keys(nodes).length,
// )

// Update store to handle interpolated positions
$nodes
  .on(updateNodePositionInterpolated, (state, { nodeId, position }) => {
    const node = state[nodeId]
    if (!node)
      return state

    node.setMetadata({
      ...node.metadata,
      ui: {
        ...node.metadata.ui,
        position,
      },
    })

    return {
      ...state,
      [nodeId]: node,
    }
  })
