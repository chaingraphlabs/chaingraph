import type { AddNodeEvent, UpdateNodeParent, UpdateNodePosition, UpdateNodeUIEvent } from './types'
import { trpcClient } from '@/api/trpc/client'
import { createEffect } from 'effector'

// Backend node operations
export const addNodeToFlowFx = createEffect(async (event: AddNodeEvent) => {
  return trpcClient.flow.addNode.mutate({
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
  return trpcClient.flow.removeNode.mutate(params)
})

export const updateNodeUIFx = createEffect(async (params: UpdateNodeUIEvent): Promise<UpdateNodeUIEvent> => {
  if (!params.ui) {
    throw new Error('UI metadata is required')
  }

  return trpcClient.flow.updateNodeUI.mutate({
    flowId: params.flowId,
    nodeId: params.nodeId,
    ui: params.ui,
    version: params.version,
  })
})

export const updateNodeParentFx = createEffect(async (params: UpdateNodeParent): Promise<UpdateNodeParent> => {
  console.log('PARENT FX:', params)
  return trpcClient.flow.updateNodeParent.mutate({
    flowId: params.flowId,
    nodeId: params.nodeId,
    parentNodeId: params.parentNodeId,
    position: params.position,
    version: params.version,
  })
})

export const baseUpdateNodePositionFx = createEffect(async (params: UpdateNodePosition) => {
  console.log('POSITION FX:', params)
  return trpcClient.flow.updateNodePosition.mutate({
    ...params,
    version: params.version,
  })
})
