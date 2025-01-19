import type { NodeState } from './types'
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
export const $nodes = createStore<Record<string, NodeState>>({})
  .on(setNodes, (_, nodes) => nodes)
  .on(addNode, (state, node) => ({
    ...state,
    [node.id]: {
      id: node.id,
      metadata: node.metadata,
      status: node.status,
      portIds: Array.from(node.ports.keys()),
    },
  }))
  .on(removeNode, (state, id) => {
    const { [id]: _, ...rest } = state
    return rest
  })
  .on(setNodeMetadata, (state, { id, metadata }) => ({
    ...state,
    [id]: {
      ...state[id],
      metadata,
    },
  }))
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

// Computed stores
export const $nodesList = $nodes.map(nodes => Object.values(nodes))
export const $nodesCount = $nodes.map(nodes => Object.keys(nodes).length)
