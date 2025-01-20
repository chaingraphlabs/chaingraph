import { publicProcedure } from '@chaingraph/backend/trpc'
import { NodeUIMetadataSchema } from '@chaingraph/types'
import { z } from 'zod'

export const updateNodeUI = publicProcedure
  .input(z.object({
    flowId: z.string(),
    nodeId: z.string(),
    ui: NodeUIMetadataSchema,
    version: z.number(),
  }))
  .mutation(async ({ input, ctx }) => {
    // TODO: create nodes store

    const flow = await ctx.flowStore.getFlow(input.flowId)
    if (!flow)
      throw new Error('Flow not found')

    const node = flow.nodes.get(input.nodeId)
    if (!node)
      throw new Error('Node not found')

    // Check if the node has been updated since the request was made
    if (node.getVersion() >= input.version) {
      return {
        flowId: input.flowId,
        nodeId: input.nodeId,
        ui: node.metadata.ui,
        version: node.getVersion(),
      }
    }

    node.incrementVersion()
    node.setMetadata({
      ...node.metadata,
      ui: {
        ...node.metadata.ui,
        ...input.ui,
      },
    })

    return {
      flowId: input.flowId,
      nodeId: input.nodeId,
      ui: node.metadata.ui,
      version: node.getVersion(),
    }
  })
