/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { AddEdgeEventData, RemoveEdgeEventData } from './types'
import { trpcClient } from '@badaitech/chaingraph-trpc/client'
import { createEffect } from 'effector' // Effect for adding edge

// Effect for adding edge
export const addEdgeFx = createEffect(async (event: AddEdgeEventData) => {
  return trpcClient.flow.connectPorts.mutate({
    flowId: event.flowId,
    sourceNodeId: event.sourceNodeId,
    sourcePortId: event.sourcePortId,
    targetNodeId: event.targetNodeId,
    targetPortId: event.targetPortId,
    metadata: event.metadata,
  })
})

// Effect for removing edge
export const removeEdgeFx = createEffect(async (event: RemoveEdgeEventData) => {
  // Assuming we have an endpoint for edge removal
  return trpcClient.flow.removeEdge.mutate({
    flowId: event.flowId,
    edgeId: event.edgeId,
  })
})
