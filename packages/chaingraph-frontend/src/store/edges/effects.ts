import type { AddEdgeEventData, RemoveEdgeEventData } from '@/store/edges/types.ts'
import { trpcClient } from '@/api/trpc/client'
import { createEffect } from 'effector'

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
