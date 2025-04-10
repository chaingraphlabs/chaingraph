/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */
import type {
  AddFieldObjectPortInput,
  AppendElementArrayPortInput,
  RemoveFieldObjectPortInput,
  UpdatePortUIInput,
  UpdatePortValueInput,
} from './effects'
import { combine, createEffect, sample } from 'effector'
import { $activeFlowId } from '../flow'
import { $nodes, setNodeVersion } from '../nodes'
import { LOCAL_NODE_UI_DEBOUNCE_MS, NODE_UI_DEBOUNCE_MS } from '../nodes/constants'
import { accumulateAndSample } from '../nodes/operators/accumulate-and-sample'
import {
  addFieldObjectPortFx,
  appendElementArrayPortFx,
  baseUpdatePortUIFx,
  baseUpdatePortValueFx,
  removeElementArrayPortFx,
  removeFiledObjectPortFx,
} from './effects'
import {
  addFieldObjectPort,
  appendElementArrayPort,
  removeElementArrayPort,
  removeFieldObjectPort,
  requestUpdatePortUI,
  requestUpdatePortValue,
  updatePortUI,
  updatePortValue,
} from './events'

//
// Update port value
//
export const preBaseUpdatePortValueFx = createEffect(async (params: UpdatePortValueInput) => {
  setNodeVersion({
    nodeId: params.nodeId,
    version: params.nodeVersion,
  })
})

// Update local value immediately
sample({
  clock: requestUpdatePortValue,
  target: [updatePortValue],
})

const throttledRequestUpdatePortValue = accumulateAndSample({
  source: [updatePortValue],
  timeout: 5,
  getKey: update => `${update.nodeId}_${update.portId}`,
})

sample({
  clock: updatePortValue,
  source: combine({
    activeFlowId: $activeFlowId,
    nodes: $nodes,
  }),
  fn: ({ activeFlowId, nodes }, { portId, nodeId, value }) => {
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
export const preBaseUpdatePortUiFx = createEffect(async (params: UpdatePortUIInput) => {
  setNodeVersion({
    nodeId: params.nodeId,
    version: params.nodeVersion,
  })
})

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
  source: combine({
    activeFlowId: $activeFlowId,
    nodes: $nodes,
  }),
  fn: ({ activeFlowId, nodes }, { nodeId, portId, ui }) => {
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
  source: combine({
    activeFlowId: $activeFlowId,
  }),
  fn: ({ activeFlowId }, { nodeId, portId, key, config }) => {
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
  source: {
    activeFlowId: $activeFlowId,
    nodes: $nodes,
  },
  fn: ({ activeFlowId, nodes }, { nodeId, portId, key }) => {
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
  source: combine({
    activeFlowId: $activeFlowId,
  }),
  fn: ({ activeFlowId }, { nodeId, portId, value }) => {
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
  source: combine({
    activeFlowId: $activeFlowId,
  }),
  fn: ({ activeFlowId }, { nodeId, portId, index }) => {
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
