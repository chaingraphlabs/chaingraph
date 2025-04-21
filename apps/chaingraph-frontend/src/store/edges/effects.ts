/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { AddEdgeEventData, RemoveEdgeEventData } from './types'
import { $trpcClient } from '@/store/trpc/store'
import { attach } from 'effector'

// Effect for adding edge
export const addEdgeFx = attach({
  source: $trpcClient,
  effect: async (client, event: AddEdgeEventData) => {
    if (!client) {
      throw new Error('TRPC client is not initialized')
    }
    return client.flow.connectPorts.mutate({
      flowId: event.flowId,
      sourceNodeId: event.sourceNodeId,
      sourcePortId: event.sourcePortId,
      targetNodeId: event.targetNodeId,
      targetPortId: event.targetPortId,
      metadata: event.metadata,
    })
  },
})

export const removeEdgeFx = attach({
  source: $trpcClient,
  effect: async (client, event: RemoveEdgeEventData) => {
    if (!client) {
      throw new Error('TRPC client is not initialized')
    }
    return client.flow.removeEdge.mutate({
      flowId: event.flowId,
      edgeId: event.edgeId,
    })
  },
})
