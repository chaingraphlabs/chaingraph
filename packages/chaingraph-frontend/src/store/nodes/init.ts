import { $nodes, updateNodeParentFx, updateNodeUIFx } from '@/store'
import { NODE_POSITION_DEBOUNCE_MS, NODE_UI_DEBOUNCE_MS } from '@/store/nodes/constants.ts'
import { accumulateAndSample } from '@/store/nodes/operators/accumulate-and-sample.ts'
import { sample } from 'effector'
import {
  addNodeToFlowFx,
  baseUpdateNodePositionFx,
  removeNodeFromFlowFx,
} from './effects'
import {
  addNodeToFlow,
  removeNodeFromFlow,
  setNodeVersion,
  updateNodeParent,
  updateNodePosition,
  updateNodePositionLocal,
  updateNodeUI,
  updateNodeUILocal,
} from './events'
import './interpolation-init'

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

// Update local position immediately
sample({
  clock: updateNodePosition,
  target: updateNodePositionLocal,
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
    id: params.nodeId,
    version: (nodes[params.nodeId]?.metadata.version ?? 0) + 1,
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
    version: (nodes[params.nodeId]?.metadata.version ?? 0) + 1,
  }),
  target: [setNodeVersion, updateNodeParentFx],
})

// * * * * * * * * * * * * * * *
// Node UI operations
// * * * * * * * * * * * * * * *

// Handle optimistic updates
sample({
  clock: updateNodeUI,
  target: updateNodeUILocal, // Update local state immediately
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
  fn: (nodes, params) => ({
    ...params,
    version: (nodes[params.nodeId]?.metadata.version ?? 0) + 1,
  }),
  target: [setNodeVersion, updateNodeUIFx],
})
