/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { ServerCapabilities } from '../services/mcp-capability.service'
import { z } from 'zod'
import { authedProcedure } from '../../trpc'
import { MCPCapabilityService } from '../services/mcp-capability.service'

export const serverCapabilities = authedProcedure
  .input(z.object({
    serverId: z.string(),
  }))
  .query(async ({ input, ctx }): Promise<ServerCapabilities> => {
    const userId = ctx.session?.user?.id
    if (!userId) {
      throw new Error('User not authenticated')
    }

    // Get server details
    const server = await ctx.mcpStore.getServer(input.serverId, userId)
    if (!server) {
      throw new Error(`Server '${input.serverId}' not found or access denied`)
    }

    // Initialize services
    const capabilityService = new MCPCapabilityService(ctx.mcpStore)

    // Get all capabilities from server (this uses internal caching)
    return await capabilityService.getAllCapabilities(input.serverId, userId)
  })
