/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import { z } from 'zod'
import { authedProcedure } from '../../trpc'
import { MCPCapabilityService } from '../services/mcp-capability.service'
import { MCPNodeBuilderService } from '../services/mcp-node-builder.service'

export const buildToolNode = authedProcedure
  .input(z.object({
    serverId: z.string(),
    toolName: z.string(),
  }))
  .query(async ({ input, ctx }) => {
    const userId = ctx.session?.user?.id
    if (!userId) {
      throw new Error('User not authenticated')
    }

    // Initialize services
    const capabilityService = new MCPCapabilityService(ctx.mcpStore)
    const nodeBuilderService = new MCPNodeBuilderService(ctx.nodeRegistry)

    // Get server details
    const server = await ctx.mcpStore.getServer(input.serverId, userId)
    if (!server) {
      throw new Error(`Server '${input.serverId}' not found or access denied`)
    }

    // Get tool from MCP server
    const tool = await capabilityService.getTool(input.serverId, input.toolName, userId)

    // Build node
    const node = nodeBuilderService.buildToolNode(server, tool)

    // Serialize and return
    return node
  })
