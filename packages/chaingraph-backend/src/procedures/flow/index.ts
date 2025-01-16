import { connectPorts } from '@chaingraph/backend/procedures/flow/connect-ports'
import { addNode } from '@chaingraph/backend/procedures/flow/nodes'
import { removeNode } from '@chaingraph/backend/procedures/flow/remove-node'
import { subscribeToEvents } from '@chaingraph/backend/procedures/flow/subscriptions'
import { publicProcedure, router } from '@chaingraph/backend/trpc'
import { z } from 'zod'

export const flowProcedures = router({
  create: publicProcedure
    .input(z.object({
      name: z.string(),
      description: z.string().optional(),
      tags: z.array(z.string()).optional(),
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

  subscribeToEvents,
  addNode,
  removeNode,
  connectPorts,
})
