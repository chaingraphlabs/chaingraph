import { publicProcedure } from '@chaingraph/backend/trpc'
import { z } from 'zod'

export const connectPorts = publicProcedure
  .input(z.object({
    flowId: z.string(),
    sourceNodeId: z.string(),
    sourcePortId: z.string(),
    targetNodeId: z.string(),
    targetPortId: z.string(),
    metadata: z.object({
      // Optional edge metadata
      label: z.string().optional(),
      description: z.string().optional(),
    }).optional(),
  }))
  .mutation(async ({ input, ctx }) => {
    const {
      flowId,
      sourceNodeId,
      sourcePortId,
      targetNodeId,
      targetPortId,
      metadata,
    } = input

    // Get flow from store
    const flow = await ctx.flowStore.getFlow(flowId)
    if (!flow) {
      throw new Error(`Flow ${flowId} not found`)
    }

    // Connect ports
    const edge = await flow.connectPorts(sourceNodeId, sourcePortId, targetNodeId, targetPortId)
    if (!edge) {
      throw new Error('Failed to connect ports')
    }

    // Set edge metadata if provided
    if (metadata) {
      edge.metadata.label = metadata.label
      edge.metadata.description = metadata.description
    }

    return {
      edgeId: edge.id,
      sourceNodeId,
      sourcePortId,
      targetNodeId,
      targetPortId,
      metadata: edge.metadata,
    }
  })
