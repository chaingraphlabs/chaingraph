import { sample } from 'effector'
import {
  addNodeToFlowFx,
  removeNodeFromFlowFx,
} from './effects'
import {
  addNodeToFlow,
  removeNodeFromFlow,
} from './events'

// Handle backend node operations
sample({
  clock: addNodeToFlow,
  target: addNodeToFlowFx,
})

// TODO: we don't need this sample due we have subscriptions
// sample({
//   clock: addNodeToFlowFx.doneData,
//   target: addNode,
// })

sample({
  clock: removeNodeFromFlow,
  target: removeNodeFromFlowFx,
})

// TODO: we don't need this sample due we have subscriptions
// sample({
//   clock: removeNodeFromFlowFx.doneData,
//   fn: result => result.removedNodeId,
//   target: removeNode,
// })
