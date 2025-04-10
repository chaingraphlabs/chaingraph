/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { AddNodeEvent, UpdateNodeParent, UpdateNodePosition, UpdateNodeUIEvent } from './types'
import { getStaticTRPCClient } from '@/trpc/client'
import { createEffect } from 'effector' // Backend node operations

// Backend node operations
export const addNodeToFlowFx = createEffect(async (event: AddNodeEvent) => {
  return getStaticTRPCClient().flow.addNode.mutate({
    flowId: event.flowId,
    nodeType: event.nodeType,
    position: event.position,
    metadata: event.metadata,
  })
})

export const removeNodeFromFlowFx = createEffect(async (params: {
  flowId: string
  nodeId: string
}) => {
  return getStaticTRPCClient().flow.removeNode.mutate(params)
})

export const updateNodeUIFx = createEffect(async (params: UpdateNodeUIEvent): Promise<UpdateNodeUIEvent> => {
  if (!params.ui) {
    throw new Error('UI metadata is required')
  }

  return getStaticTRPCClient().flow.updateNodeUI.mutate({
    flowId: params.flowId,
    nodeId: params.nodeId,
    ui: params.ui,
    version: params.version,
  })
})

export const updateNodeParentFx = createEffect(async (params: UpdateNodeParent): Promise<UpdateNodeParent> => {
  return getStaticTRPCClient().flow.updateNodeParent.mutate({
    flowId: params.flowId,
    nodeId: params.nodeId,
    parentNodeId: params.parentNodeId,
    position: params.position,
    version: params.version,
  })
})

export const baseUpdateNodePositionFx = createEffect(async (params: UpdateNodePosition) => {
  return getStaticTRPCClient().flow.updateNodePosition.mutate({
    ...params,
    version: params.version,
  })
})
