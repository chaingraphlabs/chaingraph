import { publicProcedure } from '@chaingraph/backend/trpc'
import { z } from 'zod'

export const updateNodeParent = publicProcedure
  .input(z.object({
    flowId: z.string(),
    nodeId: z.string(),
    parentNodeId: z.string().optional(),
    position: z.object({
      x: z.number(),
      y: z.number(),
    }),
    version: z.number(),
  }))
  .mutation(async ({ input, ctx }) => {
    const flow = await ctx.flowStore.getFlow(input.flowId)
    if (!flow)
      throw new Error('Flow not found')

    const node = flow.nodes.get(input.nodeId)
    if (!node)
      throw new Error('Node not found')

    // Check if the node has been updated since the request was made
    // if (node.getVersion() >= input.version) {
    //   return {
    //     flowId: input.flowId,
    //     nodeId: input.nodeId,
    //     parentNodeId: node.metadata.parentNodeId ?? undefined,
    //     position: node.metadata.ui?.position ?? DefaultPosition,
    //     version: node.getVersion(),
    //   }
    // }

    // Update the parent node
    node.setNodeParent(
      input.position,
      input.parentNodeId ?? undefined,
      true,
    )

    console.log(`[FLOW] Updated parent for node ${input.nodeId} to ${input.parentNodeId}`)

    return {
      flowId: input.flowId,
      nodeId: input.nodeId,
      parentNodeId: input.parentNodeId,
      position: input.position,
      version: node.getVersion(),
    }
  })
