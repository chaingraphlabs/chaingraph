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
} from './events'

// Store for nodes
export const $nodes = createStore<Record<string, INode>>({})
  .on(setNodes, (_, nodes) => nodes)
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

// Store for tracking node versions
export const $nodeVersions = createStore<Record<string, number>>({})
  .on(addNode, (state, node) => ({
    ...state,
    [node.id]: 1,
  }))
  .on(setNodeMetadata, (state, { id }) => ({
    ...state,
    [id]: (state[id] || 0) + 1,
  }))
  .on(removeNode, (state, id) => {
    const { [id]: _, ...rest } = state
    return rest
  })
  .reset(clearNodes)

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

// Combined store for nodes with versions
export const $nodesWithVersions = combine(
  $nodes,
  $nodeVersions,
  (nodes, versions) => ({
    nodes,
    versions,
  }),
)

// Computed stores
// export const $nodesList = $nodesWithVersions.map(
//   nodes => Object.values(nodes),
// )
// export const $nodesCount = $nodesWithVersions.map(
//   nodes => Object.keys(nodes).length,
// )
