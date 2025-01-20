import { publicProcedure } from '@chaingraph/backend/trpc'
import { z } from 'zod'

export const removeEdge = publicProcedure
  .input(z.object({
    flowId: z.string(),
    edgeId: z.string(),
  }))
  .mutation(async ({ input, ctx }) => {
    const { flowId, edgeId } = input

    // Get flow from store
    const flow = await ctx.flowStore.getFlow(flowId)
    if (!flow) {
      throw new Error(`Flow ${flowId} not found`)
    }

    // Get edge
    const edge = flow.edges.get(edgeId)
    if (!edge) {
      throw new Error(`Edge ${edgeId} not found in flow ${flowId}`)
    }

    // Remove edge from flow
    flow.removeEdge(edgeId)

    return {
      success: true,
      removedEdgeId: edgeId,
    }
  })
