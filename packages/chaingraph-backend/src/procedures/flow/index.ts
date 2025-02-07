import { z } from 'zod'
import { publicProcedure, router } from '../../trpc'
import { addNode } from './add-node'
import { connectPorts } from './connect-ports'
import { removeEdge } from './remove-edge'
import { removeNode } from './remove-node'
import { subscribeToEvents } from './subscriptions'
import { updateNodeParent } from './update-node-parent'
import { updateNodePosition } from './update-node-position'
import { updateNodeUI } from './update-node-ui'

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
  removeEdge,
  updateNodeUI,
  updateNodePosition,
  updateNodeParent,
})
