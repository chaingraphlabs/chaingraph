import type { AddNodeEvent } from './types'
import { trpcClient } from '@/api/trpc/client'
import { createEffect } from 'effector'

// Backend node operations
export const addNodeToFlowFx = createEffect(async (event: AddNodeEvent) => {
  return await trpcClient.flow.addNode.mutate({
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
  return await trpcClient.flow.removeNode.mutate(params)
})
