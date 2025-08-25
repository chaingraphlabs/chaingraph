/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { INode } from '@badaitech/chaingraph-types'
import { z } from 'zod'
import { authedProcedure } from '../../trpc'
import { MCPCapabilityService } from '../services/mcp-capability.service'
import { MCPNodeBuilderService } from '../services/mcp-node-builder.service'

export interface AllNodesResponse {
  tools: INode[]
  resources: INode[]
  prompts: INode[]
  serverId: string
  serverTitle: string
}

// Cache for built nodes
const nodeCache = new Map<string, { nodes: AllNodesResponse, timestamp: number }>()
const NODE_CACHE_DURATION = 30 * 1000 // 30 seconds

export const getAllNodesForServer = authedProcedure
  .input(z.object({
    serverId: z.string(),
  }))
  .query(async ({ input, ctx }): Promise<AllNodesResponse> => {
    const userId = ctx.session?.user?.id
    if (!userId) {
      throw new Error('User not authenticated')
    }

    // Check node cache first
    const cacheKey = `${input.serverId}-${userId}`
    const cached = nodeCache.get(cacheKey)
    if (cached && Date.now() - cached.timestamp < NODE_CACHE_DURATION) {
      return cached.nodes
    }

    // Get server details
    const server = await ctx.mcpStore.getServer(input.serverId, userId)
    if (!server) {
      throw new Error(`Server '${input.serverId}' not found or access denied`)
    }

    // Initialize services
    const capabilityService = new MCPCapabilityService(ctx.mcpStore)
    const nodeBuilderService = new MCPNodeBuilderService(ctx.nodeRegistry)

    // Get all capabilities from server (this uses internal caching)
    const capabilities = await capabilityService.getAllCapabilities(input.serverId, userId)

    // Build all nodes in parallel
    const [toolNodes, resourceNodes, promptNodes] = await Promise.all([
      // Build tool nodes
      Promise.all(
        capabilities.tools.map(tool =>
          nodeBuilderService.buildToolNode(server, tool),
        ) || [],
      ),
      // Build resource nodes
      Promise.all(
        capabilities.resources.map(resource =>
          nodeBuilderService.buildResourceNode(server, resource),
        ) || [],
      ),
      // Build prompt nodes
      Promise.all(
        capabilities.prompts.map(prompt =>
          nodeBuilderService.buildPromptNode(server, prompt),
        ) || [],
      ),
    ])

    const response: AllNodesResponse = {
      tools: toolNodes,
      resources: resourceNodes,
      prompts: promptNodes,
      serverId: server.id,
      serverTitle: server.title,
    }

    // Cache the built nodes
    nodeCache.set(cacheKey, {
      nodes: response,
      timestamp: Date.now(),
    })

    return response
  })
