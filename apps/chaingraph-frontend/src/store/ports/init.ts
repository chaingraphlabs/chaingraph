import type {
  UpdatePortUIInput,
  UpdatePortValueInput,
} from '@badaitech/chaingraph-backend/procedures'
import { setNodeVersion } from '@/store'
import { $activeFlowId } from '@/store/flow/stores'
import { LOCAL_NODE_UI_DEBOUNCE_MS, NODE_UI_DEBOUNCE_MS } from '@/store/nodes/constants'
import { accumulateAndSample } from '@/store/nodes/operators/accumulate-and-sample'
import { $nodes } from '@/store/nodes/stores'
import { baseUpdatePortUIFx, baseUpdatePortValueFx } from '@/store/ports/effects'
import { combine, createEffect, sample } from 'effector'
import { requestUpdatePortUI, requestUpdatePortValue, updatePortUI } from './events'

//
// Update port value
//
export const preBaseUpdatePortValueFx = createEffect(async (params: UpdatePortValueInput) => {
  setNodeVersion({
    id: params.nodeId,
    version: params.nodeVersion,
  })
})

const throttledRequestUpdatePortValue = accumulateAndSample({
  source: [requestUpdatePortValue],
  timeout: NODE_UI_DEBOUNCE_MS,
  getKey: update => update.id,
})

sample({
  clock: throttledRequestUpdatePortValue,
  source: combine({
    activeFlowId: $activeFlowId,
    nodes: $nodes,
  }),
  fn: ({ activeFlowId, nodes }, { id, value }) => {
    if (!activeFlowId) {
      throw new Error('No active flow selected')
    }
    const nodeEntry = Object.entries(nodes).find(([nodeId, node]) => {
      return node.ports && node.ports.has(id)
    })
    if (!nodeEntry) {
      throw new Error(`Node for port id '${id}' not found`)
    }
    const [nodeId] = nodeEntry
    return {
      flowId: activeFlowId,
      nodeId,
      portId: id,
      value,
      nodeVersion: (nodes[nodeId]?.metadata.version ?? 0) + 1,
    }
  },
  target: [
    preBaseUpdatePortValueFx,
    baseUpdatePortValueFx,
  ],
})

//
// Update port UI with throttling
//
export const preBaseUpdatePortUiFx = createEffect(async (params: UpdatePortUIInput) => {
  setNodeVersion({
    id: params.nodeId,
    version: params.nodeVersion,
  })
})

const throttledLocalRequestUpdatePortUi = accumulateAndSample({
  source: [requestUpdatePortUI],
  timeout: LOCAL_NODE_UI_DEBOUNCE_MS,
  getKey: update => update.id,
})

sample({
  clock: throttledLocalRequestUpdatePortUi,
  target: [updatePortUI],
})

const throttledRequestUpdatePortUi = accumulateAndSample({
  source: [requestUpdatePortUI],
  timeout: NODE_UI_DEBOUNCE_MS,
  getKey: update => update.id,
})

sample({
  clock: throttledRequestUpdatePortUi,
  source: combine({
    activeFlowId: $activeFlowId,
    nodes: $nodes,
  }),
  fn: ({ activeFlowId, nodes }, { id, ui }) => {
    if (!activeFlowId) {
      throw new Error('No active flow selected')
    }
    const nodeEntry = Object.entries(nodes).find(([nodeId, node]) => {
      return node.ports && node.ports.has(id)
    })
    if (!nodeEntry) {
      throw new Error(`Node for port id '${id}' not found`)
    }
    const [nodeId] = nodeEntry
    return {
      flowId: activeFlowId,
      nodeId,
      portId: id,
      ui,
      nodeVersion: (nodes[nodeId]?.metadata.version ?? 0) + 1,
    }
  },
  target: [
    preBaseUpdatePortUiFx,
    baseUpdatePortUIFx,
  ],
})
