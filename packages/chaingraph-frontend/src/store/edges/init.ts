import { requestAddEdge, requestRemoveEdge } from '@/store'
import { sample } from 'effector'
import { addEdgeFx, removeEdgeFx } from './effects'

// Initialize edge operations
sample({
  clock: requestAddEdge,
  target: addEdgeFx,
})

sample({
  clock: requestRemoveEdge,
  target: removeEdgeFx,
})

// Handle successful edge additions
sample({
  clock: addEdgeFx.doneData,
  target: [], // Add any additional targets for successful edge creation
})

// Handle successful edge removals
sample({
  clock: removeEdgeFx.doneData,
  target: [], // Add any additional targets for successful edge removal
})
