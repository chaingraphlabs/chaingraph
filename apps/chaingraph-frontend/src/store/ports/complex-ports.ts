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
  UpdateItemConfigArrayPortInput,
} from './stores'
import { sample } from 'effector'
import { $activeFlowId } from '../flow/stores'
import {
  addFieldObjectPortFx,
  appendElementArrayPortFx,
  removeElementArrayPortFx,
  removeFiledObjectPortFx,
  updateItemConfigArrayPortFx,
} from './stores'
import {
  addFieldObjectPort,
  appendElementArrayPort,
  removeElementArrayPort,
  removeFieldObjectPort,
  updateItemConfigArrayPort,
} from './stores'

sample({
  source: $activeFlowId,
  clock: addFieldObjectPort,
  fn: (activeFlowId, { nodeId, portId, key, config }) => {
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
  source: $activeFlowId,
  clock: removeFieldObjectPort,
  fn: (activeFlowId, { nodeId, portId, key }) => {
    if (!activeFlowId) {
      throw new Error('No active flow selected')
    }

    const result: RemoveFieldObjectPortInput = { flowId: activeFlowId, nodeId, portId, key }
    return result
  },
  target: removeFiledObjectPortFx,
})

sample({
  source: $activeFlowId,
  clock: updateItemConfigArrayPort,
  fn: (activeFlowId, { nodeId, portId, itemConfig }) => {
    if (!activeFlowId) {
      throw new Error('No active flow selected')
    }
    const result: UpdateItemConfigArrayPortInput = {
      nodeId,
      flowId: activeFlowId,
      portId,
      itemConfig,
    }
    return result
  },
  target: updateItemConfigArrayPortFx,
})

sample({
  source: $activeFlowId,
  clock: appendElementArrayPort,
  fn: (activeFlowId, { nodeId, portId, value }) => {
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
  source: $activeFlowId,
  clock: removeElementArrayPort,
  fn: (activeFlowId, { nodeId, portId, index }) => {
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
