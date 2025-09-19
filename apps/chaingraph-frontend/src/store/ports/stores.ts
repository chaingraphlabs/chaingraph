/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { RouterInputs } from '@badaitech/chaingraph-trpc/client'

import type { IPortConfig } from '@badaitech/chaingraph-types'
import type { PortState } from './types'
import { sample } from 'effector'
import { portsDomain } from '@/store/domains'
import { LOCAL_NODE_UI_DEBOUNCE_MS, NODE_UI_DEBOUNCE_MS } from '../nodes/constants'
import { accumulateAndSample } from '../nodes/operators/accumulate-and-sample'
import { setNodeVersion } from '../nodes/stores'
import { $trpcClient } from '../trpc/store'
import './complex-ports'

// EVENTS
// Port CRUD events
export const updatePort = portsDomain.createEvent<{
  id: string
  data: Partial<PortState>
  nodeVersion: number
}>()

// export const updatePortValue = portsDomain.createEvent<{
//   nodeId: string
//   portId: string
//   value: any
// }>()

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

export const updateItemConfigArrayPort = portsDomain.createEvent<{
  nodeId: string
  portId: string
  itemConfig: IPortConfig
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

// updateItemConfigArrayPort
export type UpdateItemConfigArrayPortInput = RouterInputs['flow']['updateItemConfigArrayPort']
export const updateItemConfigArrayPortFx = portsDomain.createEffect(async (params: UpdateItemConfigArrayPortInput) => {
  const client = $trpcClient.getState()
  if (!client) {
    throw new Error('TRPC client is not initialized')
  }
  return client.flow.updateItemConfigArrayPort.mutate(params)
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
// sample({
//   clock: requestUpdatePortValue,
//   target: [updatePortValue],
// })

// export const throttledRequestUpdatePortValue = accumulateAndSample({
//   source: [requestUpdatePortValue],
//   timeout: 500,
//   getKey: update => `${update.nodeId}_${update.portId}`,
// })
//
// sample({
//   source: combine({
//     activeFlowId: $activeFlowId,
//     nodes: $nodes,
//   }),
//   clock: updatePortValue,
//   // fn: ({ portId, nodeId, value }) => {
//   fn: (source, event) => {
//     const activeFlowId = source.activeFlowId
//     const nodes = source.nodes
//     if (!activeFlowId) {
//       throw new Error('No active flow selected')
//     }
//     return {
//       flowId: activeFlowId,
//       nodeId: event.nodeId,
//       portId: event.portId,
//       value: event.value,
//       nodeVersion: (nodes[event.nodeId]?.getVersion() ?? 0) + 1, // Optimistic version increment
//     }
//   },
//   target: [
//     preBaseUpdatePortValueFx,
//     baseUpdatePortValueFx,
//   ],
// })

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

export const throttledRequestUpdatePortUi = accumulateAndSample({
  source: [requestUpdatePortUI],
  timeout: NODE_UI_DEBOUNCE_MS,
  getKey: update => `${update.nodeId}_${update.portId}`,
})
