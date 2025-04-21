/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { AddNodeEvent, UpdateNodeParent, UpdateNodePosition, UpdateNodeUIEvent } from './types'
import { attach } from 'effector'
import { $trpcClient } from '../trpc/store'

// Backend node operations
export const addNodeToFlowFx = attach({
  source: $trpcClient,
  effect: async (client, event: AddNodeEvent) => {
    if (!client) {
      throw new Error('TRPC client is not initialized')
    }
    return client.flow.addNode.mutate({
      flowId: event.flowId,
      nodeType: event.nodeType,
      position: event.position,
      metadata: event.metadata,
    })
  },
})

export const removeNodeFromFlowFx = attach({
  source: $trpcClient,
  effect: async (client, params: {
    flowId: string
    nodeId: string
  }) => {
    if (!client) {
      throw new Error('TRPC client is not initialized')
    }
    return client.flow.removeNode.mutate(params)
  },
})

export const updateNodeUIFx = attach({
  source: $trpcClient,
  effect: async (client, params: UpdateNodeUIEvent): Promise<UpdateNodeUIEvent> => {
    if (!client) {
      throw new Error('TRPC client is not initialized')
    }
    if (!params.ui) {
      throw new Error('UI metadata is required')
    }

    return client.flow.updateNodeUI.mutate({
      flowId: params.flowId,
      nodeId: params.nodeId,
      ui: params.ui,
      version: params.version,
    })
  },
})

export const updateNodeParentFx = attach({
  source: $trpcClient,
  effect: async (client, params: UpdateNodeParent): Promise<UpdateNodeParent> => {
    if (!client) {
      throw new Error('TRPC client is not initialized')
    }
    return client.flow.updateNodeParent.mutate({
      flowId: params.flowId,
      nodeId: params.nodeId,
      parentNodeId: params.parentNodeId,
      position: params.position,
      version: params.version,
    })
  },
})

export const baseUpdateNodePositionFx = attach({
  source: $trpcClient,
  effect: async (client, params: UpdateNodePosition) => {
    if (!client) {
      throw new Error('TRPC client is not initialized')
    }
    return client.flow.updateNodePosition.mutate({
      ...params,
      version: params.version,
    })
  },
})
