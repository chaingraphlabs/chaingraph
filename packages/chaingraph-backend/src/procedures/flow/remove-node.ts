import { publicProcedure } from '@chaingraph/backend/trpc'
import { z } from 'zod'

export const removeNode = publicProcedure
  .input(z.object({
    flowId: z.string(),
    nodeId: z.string(),
  }))
  .mutation(async ({ input, ctx }) => {
    const { flowId, nodeId } = input

    // Get flow from store
    const flow = await ctx.flowStore.getFlow(flowId)
    if (!flow) {
      throw new Error(`Flow ${flowId} not found`)
    }

    // Get node
    const node = flow.nodes.get(nodeId)
    if (!node) {
      throw new Error(`Node ${nodeId} not found in flow ${flowId}`)
    }

    // Remove node from flow
    flow.removeNode(nodeId)

    return {
      success: true,
      removedNodeId: nodeId,
    }
  })
