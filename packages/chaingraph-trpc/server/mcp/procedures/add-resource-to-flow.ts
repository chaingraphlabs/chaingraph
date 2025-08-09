/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { Flow } from '@badaitech/chaingraph-types'
import { z } from 'zod'
import { flowContextProcedure } from '../../trpc'
import { MCPCapabilityService } from '../services/mcp-capability.service'
import { MCPNodeBuilderService } from '../services/mcp-node-builder.service'

const NodePositionSchema = z.object({
  x: z.number(),
  y: z.number(),
})

export const addResourceToFlow = flowContextProcedure
  .input(z.object({
    flowId: z.string(),
    serverId: z.string(),
    resourceName: z.string(),
    position: NodePositionSchema,
  }))
  .mutation(async ({ input, ctx }) => {
    const userId = ctx.session?.user?.id
    if (!userId) {
      throw new Error('User not authenticated')
    }

    await ctx.flowStore.lockFlow(input.flowId)

    try {
      // Get flow from store
      const flow = await ctx.flowStore.getFlow(input.flowId)
      if (!flow) {
        throw new Error(`Flow ${input.flowId} not found`)
      }

      // Initialize services
      const capabilityService = new MCPCapabilityService(ctx.mcpStore)
      const nodeBuilderService = new MCPNodeBuilderService(ctx.nodeRegistry)

      // Get server details
      const server = await ctx.mcpStore.getServer(input.serverId, userId)
      if (!server) {
        throw new Error(`Server '${input.serverId}' not found or access denied`)
      }

      // Get resource from MCP server
      const resource = await capabilityService.getResource(input.serverId, input.resourceName, userId)

      // Build node
      const mcpResourceNode = nodeBuilderService.buildResourceNode(server, resource)

      // Clone the node with a new ID for the flow
      const cloneResult = mcpResourceNode.cloneWithNewId()
      const node = cloneResult.clonedNode

      // Set position
      node.setPosition(input.position, true)

      // Add to flow
      const createdNode = flow.addNode(node)
      await ctx.flowStore.updateFlow(flow as Flow)

      return createdNode
    } finally {
      await ctx.flowStore.unlockFlow(input.flowId)
    }
  })
