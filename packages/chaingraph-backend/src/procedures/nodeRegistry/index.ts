import type { INode } from '@chaingraph/types'
import { publicProcedure, router } from '@chaingraph/backend/trpc'
import { NodeRegistry } from '@chaingraph/types'
import { z } from 'zod'

export const nodeRegistryProcedures = router({
  listAvailableTypes: publicProcedure
    .query(async () => {
      const nodeTypes = NodeRegistry.getInstance().getNodeTypes()
      const availableNodes = [] as INode[]
      nodeTypes.forEach((type) => {
        availableNodes.push(NodeRegistry.getInstance().createNode(type, `id:${type}`))
      })

      return availableNodes
    }),

  getNodeType: publicProcedure
    .input(z.string())
    .query(async ({ input: nodeType }) => {
      return NodeRegistry.getInstance().createNode(nodeType, `id:${nodeType}`)
    }),
})
