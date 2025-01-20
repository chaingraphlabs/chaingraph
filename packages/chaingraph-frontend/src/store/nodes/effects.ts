import type { AddNodeEvent, UpdateNodePosition } from './types'
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

// export const updateNodeUIFx = createEffect(async (params: UpdateNodeUIEvent): Promise<UpdateNodeUIEvent> => {
//   return await trpcClient.flow.updateNodeUI.mutate({
//     flowId: params.flowId,
//     nodeId: params.nodeId,
//     ui: params.ui,
//     version: params.version,
//   })
// })

export const baseUpdateNodePositionFx = createEffect(async (params: UpdateNodePosition) => {
  console.log(`[baseUpdateNodePositionFx] Updating node position for node ${params.nodeId}, new version: ${params.version + 1}`)

  return await trpcClient.flow.updateNodePosition.mutate({
    ...params,
    version: params.version + 1,
  })
})
