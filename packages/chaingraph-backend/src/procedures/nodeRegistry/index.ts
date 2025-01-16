import type { INode } from '@chaingraph/types'
import { publicProcedure, router } from '@chaingraph/backend/trpc'
import { z } from 'zod'

export const nodeRegistryProcedures = router({
  listAvailableTypes: publicProcedure
    .query(async ({ ctx }) => {
      const nodeTypes = ctx.nodeRegistry.getNodeTypes()
      const availableNodes = [] as INode[]
      nodeTypes.forEach((type) => {
        availableNodes.push(ctx.nodeRegistry.createNode(type, `id:${type}`))
      })

      return availableNodes
    }),

  getNodeType: publicProcedure
    .input(z.string())
    .query(async ({ input: nodeType, ctx }) => {
      return ctx.nodeRegistry.createNode(nodeType, `id:${nodeType}`)
    }),
})
