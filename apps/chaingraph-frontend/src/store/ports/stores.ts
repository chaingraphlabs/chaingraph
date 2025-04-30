/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { RouterInputs } from '@badaitech/chaingraph-trpc/client'

import type { INode, IPort, IPortConfig } from '@badaitech/chaingraph-types'
import type { PortState } from './types'
import { portsDomain } from '@/store/domains'
import { combine, sample } from 'effector'
import { $activeFlowId } from '../flow'
import { $nodes, setNodeVersion } from '../nodes'
import { LOCAL_NODE_UI_DEBOUNCE_MS, NODE_UI_DEBOUNCE_MS } from '../nodes/constants'
import { accumulateAndSample } from '../nodes/operators/accumulate-and-sample'
import { $trpcClient } from '../trpc/store'

// EVENTS
// Port CRUD events
export const updatePort = portsDomain.createEvent<{
  id: string
  data: Partial<PortState>
  nodeVersion: number
}>()

export const updatePortValue = portsDomain.createEvent<{
  nodeId: string
  portId: string
  value: any
}>()

export const updatePortUI = portsDomain.createEvent<{
  nodeId: string
  portId: string
  ui: any
}>()

// Value updates
export const requestUpdatePortValue = portsDomain.createEvent<{
  nodeId: string
  portId: string
  value: any
}>()

// UI updates
export const requestUpdatePortUI = portsDomain.createEvent<{
  nodeId: string
  portId: string
  ui: any
}>()

// Object port updates
export const addFieldObjectPort = portsDomain.createEvent<{
  nodeId: string
  portId: string
  config: IPortConfig
  key: string
}>()
export const removeFieldObjectPort = portsDomain.createEvent<{
  nodeId: string
  portId: string
  key: string
}>()

export const appendElementArrayPort = portsDomain.createEvent<{
  nodeId: string
  portId: string
  value: any
}>()

export const removeElementArrayPort = portsDomain.createEvent<{
  nodeId: string
  portId: string
  index: number
}>()

// EFFECTS

export const baseUpdatePortValueFx = portsDomain.createEffect(async (params) => {
  const client = $trpcClient.getState()

  if (!client) {
    throw new Error('TRPC client is not initialized')
  }
  return client.flow.updatePortValue.mutate(params)
})

export const baseUpdatePortUIFx = portsDomain.createEffect(async (params) => {
  const client = $trpcClient.getState()
  if (!client) {
    throw new Error('TRPC client is not initialized')
  }
  return client.flow.updatePortUI.mutate(params)
})

export type AddFieldObjectPortInput = RouterInputs['flow']['addFieldObjectPort']
export const addFieldObjectPortFx = portsDomain.createEffect(async (params: AddFieldObjectPortInput) => {
  const client = $trpcClient.getState()
  if (!client) {
    throw new Error('TRPC client is not initialized')
  }
  return client.flow.addFieldObjectPort.mutate(params)
})

export type RemoveFieldObjectPortInput = RouterInputs['flow']['removeFieldObjectPort']
export const removeFiledObjectPortFx = portsDomain.createEffect(async (params: RemoveFieldObjectPortInput) => {
  const client = $trpcClient.getState()
  if (!client) {
    throw new Error('TRPC client is not initialized')
  }
  return client.flow.removeFieldObjectPort.mutate(params)
})

// appendElementArrayPort
export type AppendElementArrayPortInput = RouterInputs['flow']['appendElementArrayPort']
export const appendElementArrayPortFx = portsDomain.createEffect(async (params: AppendElementArrayPortInput) => {
  const client = $trpcClient.getState()
  if (!client) {
    throw new Error('TRPC client is not initialized')
  }
  return client.flow.appendElementArrayPort.mutate(params)
})

// removeElementArrayPort
export type RemoveElementArrayPortInput = RouterInputs['flow']['removeElementArrayPort']
export const removeElementArrayPortFx = portsDomain.createEffect(async (params: RemoveElementArrayPortInput) => {
  const client = $trpcClient.getState()
  if (!client) {
    throw new Error('TRPC client is not initialized')
  }
  return client.flow.removeElementArrayPort.mutate(params)
})

//
// Update port value
//
export const preBaseUpdatePortValueFx = portsDomain.createEffect(async (params) => {
  setNodeVersion({
    nodeId: params.nodeId,
    version: params.nodeVersion,
  })
})

export const preBaseUpdatePortUiFx = portsDomain.createEffect(async (params) => {
  setNodeVersion({
    nodeId: params.nodeId,
    version: params.nodeVersion,
  })
})

// SAMPLES

// Update local value immediately
sample({
  clock: requestUpdatePortValue,
  target: [updatePortValue],
})

// const throttledRequestUpdatePortValue = accumulateAndSample({
//   source: [updatePortValue],
//   timeout: 5,
//   getKey: update => `${update.nodeId}_${update.portId}`,
// })

sample({
  clock: updatePortValue,
  fn: ({ portId, nodeId, value }) => {
    const activeFlowId = $activeFlowId.getState()
    const nodes = $nodes.getState()
    if (!activeFlowId) {
      throw new Error('No active flow selected')
    }
    return {
      flowId: activeFlowId,
      nodeId,
      portId,
      value,
      nodeVersion: (nodes[nodeId]?.getVersion() ?? 0) + 1,
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
const throttledLocalRequestUpdatePortUi = accumulateAndSample({
  source: [requestUpdatePortUI],
  timeout: LOCAL_NODE_UI_DEBOUNCE_MS,
  getKey: update => `${update.nodeId}_${update.portId}`,
})

sample({
  clock: throttledLocalRequestUpdatePortUi,
  target: [updatePortUI],
})

const throttledRequestUpdatePortUi = accumulateAndSample({
  source: [requestUpdatePortUI],
  timeout: NODE_UI_DEBOUNCE_MS,
  getKey: update => `${update.nodeId}_${update.portId}`,
})

sample({
  clock: throttledRequestUpdatePortUi,
  fn: ({ nodeId, portId, ui }) => {
    const activeFlowId = $activeFlowId.getState()
    const nodes = $nodes.getState()
    if (!activeFlowId) {
      throw new Error('No active flow selected')
    }

    return {
      flowId: activeFlowId,
      nodeId,
      portId,
      ui,
      nodeVersion: (nodes[nodeId]?.getVersion() ?? 0) + 1,
    }
  },
  target: [
    preBaseUpdatePortUiFx,
    baseUpdatePortUIFx,
  ],
})

sample({
  clock: addFieldObjectPort,
  fn: ({ nodeId, portId, key, config }) => {
    const activeFlowId = $activeFlowId.getState()
    if (!activeFlowId) {
      throw new Error('No active flow selected')
    }
    const result: AddFieldObjectPortInput = {
      nodeId,
      config,
      flowId: activeFlowId,
      portId,
      key,
    }
    return result
  },
  target: addFieldObjectPortFx,
})

sample({
  clock: removeFieldObjectPort,
  fn: ({ nodeId, portId, key }) => {
    const activeFlowId = $activeFlowId.getState()
    if (!activeFlowId) {
      throw new Error('No active flow selected')
    }

    const result: RemoveFieldObjectPortInput = { flowId: activeFlowId, nodeId, portId, key }
    return result
  },
  target: removeFiledObjectPortFx,
})

sample({
  clock: appendElementArrayPort,
  fn: ({ nodeId, portId, value }) => {
    const activeFlowId = $activeFlowId.getState()
    if (!activeFlowId) {
      throw new Error('No active flow selected')
    }
    const result: AppendElementArrayPortInput = {
      nodeId,
      flowId: activeFlowId,
      portId,
      value,
    }
    return result
  },
  target: appendElementArrayPortFx,
})

sample({
  clock: removeElementArrayPort,
  fn: ({ nodeId, portId, index }) => {
    const activeFlowId = $activeFlowId.getState()

    if (!activeFlowId) {
      throw new Error('No active flow selected')
    }
    return {
      nodeId,
      flowId: activeFlowId,
      portId,
      index,
    }
  },
  target: removeElementArrayPortFx,
})
