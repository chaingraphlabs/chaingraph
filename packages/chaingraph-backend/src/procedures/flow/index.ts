import { publicProcedure, router } from '@chaingraph/backend/trpc'
import { z } from 'zod'

export const flowProcedures = router({
  create: publicProcedure
    .input(z.object({
      name: z.string(),
      description: z.string().optional(),
      tags: z.array(z.string()).optional(),
      // metadata: z.record(z.string(), z.unknown()).optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      return await ctx.flowStore.createFlow({
        name: input.name,
        description: input.description,
        createdAt: new Date(),
        updatedAt: new Date(),
        tags: input.tags,
      })
    }),

  get: publicProcedure
    .input(z.string())
    .query(async ({ input: flowId, ctx }) => {
      const flow = await ctx.flowStore.getFlow(flowId)
      if (!flow) {
        throw new Error(`Flow ${flowId} not found`)
      }
      return flow
    }),

  list: publicProcedure
    .query(async ({ ctx }) => {
      return ctx.flowStore.listFlows()
    }),

  delete: publicProcedure
    .input(z.string())
    .mutation(async ({ input: flowId, ctx }) => {
      const success = await ctx.flowStore.deleteFlow(flowId)
      return { success }
    }),
})
