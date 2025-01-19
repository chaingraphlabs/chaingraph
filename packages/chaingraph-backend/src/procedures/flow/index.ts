import { addNode } from '@chaingraph/backend/procedures/flow/add-node'
import { connectPorts } from '@chaingraph/backend/procedures/flow/connect-ports'
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

  getMeta: publicProcedure
    .input(z.string())
    .query(async ({ input: flowId, ctx }) => {
      const flow = await ctx.flowStore.getFlow(flowId)
      if (!flow) {
        throw new Error(`Flow ${flowId} not found`)
      }
      return flow.metadata
    }),

  list: publicProcedure
    .query(async ({ ctx }) => {
      const flows = await ctx.flowStore.listFlows()

      return flows
        .map(flow => flow.metadata)
        .filter(flowMeta =>
          flowMeta
          && flowMeta.id !== ''
          && flowMeta.createdAt !== null
          && flowMeta.updatedAt !== null,
        )
    }),

  delete: publicProcedure
    .input(z.string())
    .mutation(async ({ input: flowId, ctx }) => {
      const success = await ctx.flowStore.deleteFlow(flowId)
      return { success }
    }),

  edit: publicProcedure
    .input(z.object({
      flowId: z.string(),
      name: z.string().optional(),
      description: z.string().optional(),
      tags: z.array(z.string()).optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const { flowId, name, description, tags } = input
      const flow = await ctx.flowStore.getFlow(flowId)
      if (!flow) {
        throw new Error(`Flow ${flowId} not found`)
      }

      if (name) {
        flow.metadata.name = name
      }
      if (description) {
        flow.metadata.description = description
      }
      if (tags) {
        flow.metadata.tags = tags
      }

      flow.metadata.updatedAt = new Date()

      return await ctx.flowStore.updateFlow(flowId, flow)
    }),

  subscribeToEvents,
  addNode,
  removeNode,
  connectPorts,
})
