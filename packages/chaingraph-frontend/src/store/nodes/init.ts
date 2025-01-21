import { $nodes, updateNodeUIFx } from '@/store'
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

// Debounce node position updates
// const throttledUpdatePosition = throttle({
//   source: updateNodePosition,
//   timeout: NODE_POSITION_DEBOUNCE_MS,
// })

const throttledUpdatePosition = accumulateAndSample({
  source: updateNodePosition,
  timeout: NODE_POSITION_DEBOUNCE_MS,
  getKey: update => update.nodeId,
})

// Create middleware to update the version of the node before sending it to the server
const nodePositionWithNewVersion = sample({
  clock: throttledUpdatePosition,
  source: $nodes,
  fn: (nodes, params) => ({
    ...params,
    version: (nodes[params.nodeId]?.metadata.version ?? 0) + 1,
  }),
})

// Update local state with the new version
const optimisticVersionPositionUpdated = sample({
  clock: nodePositionWithNewVersion,
  fn: params => ({
    id: params.nodeId,
    version: params.version,
  }),
  target: setNodeVersion,
})

// Send the updated node position to the server
sample({
  clock: optimisticVersionPositionUpdated,
  source: nodePositionWithNewVersion,
  target: baseUpdateNodePositionFx,
})

// * * * * * * * * * * * * * * *
// Node UI operations
// * * * * * * * * * * * * * * *

// sample({
//   source: updateNodeUI,
//   target: updateNodeUIFx,
// })

// Handle optimistic updates
sample({
  clock: updateNodeUI,
  target: updateNodeUILocal, // Update local state immediately
})

const throttledUIUpdate = accumulateAndSample({
  source: updateNodeUI,
  timeout: NODE_UI_DEBOUNCE_MS,
  getKey: update => update.nodeId,
})

// Create middleware to update the version of the node before sending it to the server
const nodeUIUpdateNewVersion = sample({
  clock: throttledUIUpdate,
  source: $nodes,
  fn: (nodes, params) => ({
    ...params,
    version: (nodes[params.nodeId]?.metadata.version ?? 0) + 1,
  }),
})

// Update local state with the new version
const optimisticVersionUIUpdated = sample({
  clock: nodeUIUpdateNewVersion,
  fn: params => ({
    id: params.nodeId,
    version: params.version,
  }),
  target: setNodeVersion,
})

// Send the updated node UI to the server
sample({
  clock: optimisticVersionUIUpdated,
  source: nodeUIUpdateNewVersion,
  target: updateNodeUIFx,
})

// Connect debounced effects to the main flow
// sample({
//   clock: updateNodeUI,
//   target: debouncedUpdateNodeUI,
// })
//
// sample({
//   clock: updateNodePosition,
//   target: debouncedUpdateNodePosition,
// })

// // Handle backend updates
// sample({
//   clock: updateNodeUIFx.doneData,
//   target: [
//     // We might want to update the node state here if needed
//     // after confirming the change with backend
//   ],
// })
