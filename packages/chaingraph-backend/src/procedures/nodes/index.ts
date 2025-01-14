import { publicProcedure, router } from '@chaingraph/backend/trpc'
import { z } from 'zod'

export const nodeProcedures = router({
  add: publicProcedure
    .input(z.object({
      flowId: z.string(),
      nodeType: z.string(),
      position: z.object({
        x: z.number(),
        y: z.number(),
      }),
      metadata: z.record(z.string(), z.unknown()).optional(),
    }))
    .mutation(async ({ input }) => {
      return { nodeId: 'new-node-id' }
    }),

  remove: publicProcedure
    .input(z.object({
      flowId: z.string(),
      nodeId: z.string(),
    }))
    .mutation(async ({ input }) => {
      return { success: true }
    }),

  update: publicProcedure
    .input(z.object({
      flowId: z.string(),
      nodeId: z.string(),
      metadata: z.record(z.string(), z.unknown()),
    }))
    .mutation(async ({ input }) => {
      return { success: true }
    }),

  listInFlow: publicProcedure
    .input(z.string())
    .query(async ({ input: flowId }) => {
      return []
    }),
})
