import { $nodes } from '@/store'
import { sample } from 'effector'
import { throttle } from 'patronum'
import { NODE_POSITION_DEBOUNCE_MS } from './constants.ts'
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

// throttle({
//   source: updateNodePosition,
//   timeout: NODE_POSITION_DEBOUNCE_MS,
//   target: baseUpdateNodePositionFx,
// })

const throttledUpdatePosition = throttle({
  source: updateNodePosition,
  timeout: NODE_POSITION_DEBOUNCE_MS * 1.2,
})

// Create middleware to update the version of the node before sending it to the server
const nodePositionWithNewVersion = sample({
  clock: throttledUpdatePosition,
  source: $nodes,
  fn: (nodes, params) => {
    const node = nodes[params.nodeId]
    const newVersion = (node?.metadata.version ?? 0) + 1

    return {
      ...params,
      version: newVersion,
    }
  },
})

// Обновляем локальную версию
sample({
  clock: nodePositionWithNewVersion,
  fn: params => ({
    id: params.nodeId,
    version: params.version,
  }),
  target: setNodeVersion,
})

// Отправляем запрос на сервер
sample({
  clock: nodePositionWithNewVersion,
  target: baseUpdateNodePositionFx,
})

// sample({
//   source: updateNodeUI,
//   target: updateNodeUIFx,
// })

// Handle optimistic updates
sample({
  clock: updateNodeUI,
  target: updateNodeUILocal, // Update local state immediately
})

// Handle optimistic updates for position
sample({
  clock: updateNodePosition,
  target: updateNodePositionLocal, // Update local state immediately
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
