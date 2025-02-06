import { v7 as uuidv7 } from 'uuid'
import { z } from 'zod'
import { publicProcedure } from '../../trpc'

// Input schema for node position
const NodePositionSchema = z.object({
  x: z.number(),
  y: z.number(),
})

// Input schema for node metadata
const NodeMetadataSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  category: z.string().optional(),
  tags: z.array(z.string()).optional(),
}).optional()

export const addNode = publicProcedure
  .input(z.object({
    flowId: z.string(),
    nodeType: z.string(),
    position: NodePositionSchema,
    metadata: NodeMetadataSchema,
  }))
  .mutation(async ({ input, ctx }) => {
    const { flowId, nodeType, position, metadata } = input

    // Get flow from store
    const flow = await ctx.flowStore.getFlow(flowId)
    if (!flow) {
      throw new Error(`Flow ${flowId} not found`)
    }

    // Create node instance
    const nodeId = uuidv7()
    const node = ctx.nodeRegistry.createNode(nodeType, `${nodeType}:${nodeId}`)

    // Initialize node
    node.initialize()

    // Set additional metadata if provided
    if (metadata) {
      const currentMetadata = node.metadata
      node.setMetadata({
        ...currentMetadata,
        ...metadata,
      })
    }

    // Set position
    node.setPosition(position)

    // Add node to flow
    return await ctx.flowStore.addNode(flowId, node)
  })
