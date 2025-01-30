import { publicProcedure } from '@chaingraph/backend/trpc'
import { DefaultPosition } from '@chaingraph/types/node/node-ui'
import { z } from 'zod'

export const updateNodePosition = publicProcedure
  .input(z.object({
    flowId: z.string(),
    nodeId: z.string(),
    position: z.object({
      x: z.number(),
      y: z.number(),
    }),
    version: z.number(),
  }))
  .mutation(async ({ input, ctx }) => {
    // TODO: create nodes store
    const startTime = Date.now()

    const flow = await ctx.flowStore.getFlow(input.flowId)
    if (!flow)
      throw new Error('Flow not found')

    const node = flow.nodes.get(input.nodeId)
    if (!node)
      throw new Error('Node not found')

    if (node.getVersion() >= input.version) {
      console.log(`Node ${input.nodeId} has been updated since the request was made, local version: ${node.getVersion()}, request version: ${input.version}`)
      // Node has been updated since the request was made
      return {
        flowId: input.flowId,
        nodeId: input.nodeId,
        position: node.metadata.ui?.position ?? DefaultPosition,
        version: node.getVersion(),
      }
    }

    const hasPositionChanged = (
      !node.metadata.ui?.position
      || node.metadata.ui.position.x !== input.position.x
      || node.metadata.ui.position.y !== input.position.y
    )
    if (!hasPositionChanged) {
      return {
        flowId: input.flowId,
        nodeId: input.nodeId,
        position: input.position,
        version: node.getVersion(),
      }
    }

    node.setPosition(input.position, true)

    const duration = Date.now() - startTime
    console.log(`[FLOW] Updated position for node ${input.nodeId} in ${duration}ms`)

    return {
      flowId: input.flowId,
      nodeId: input.nodeId,
      position: input.position,
      requestedVersion: input.version,
      version: node.getVersion(),
    }
  })
