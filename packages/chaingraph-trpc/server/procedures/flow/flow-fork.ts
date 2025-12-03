/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { IFlowStore } from '../../stores/flowStore/types'
import { Flow } from '@badaitech/chaingraph-types'
import { z } from 'zod'
import { authedProcedure } from '../../trpc'
import { FORK_DENY_RULE, safeApplyJsonLogic } from '../../utils/fork-security'

export const fork = authedProcedure
  .input(z.object({
    flowId: z.string(),
    name: z.string().optional(),
  }))
  .mutation(async ({ input, ctx }) => {
    const userId = ctx.session?.user?.id
    if (!userId) {
      throw new Error('User not authenticated')
    }

    // Get the original flow
    const originalFlow = await ctx.flowStore.getFlow(input.flowId)
    if (!originalFlow) {
      throw new Error(`Flow ${input.flowId} not found`)
    }

    const isAdmin = ctx.session?.user?.role === 'admin'

    // Fork access control: Allow owners and users who pass fork rules
    // Add explicit null/undefined checks to prevent permission bypass
    const isOwner = !!(
      userId
      && originalFlow.metadata.ownerID
      && typeof userId === 'string'
      && typeof originalFlow.metadata.ownerID === 'string'
      && originalFlow.metadata.ownerID === userId
    ) || isAdmin // Admin always has owner access

    if (!isOwner) {
      // Evaluate fork rule for non-owners - default to deny if no rule is set
      const forkRule = originalFlow.metadata.forkRule || FORK_DENY_RULE
      const context = {
        userId,
        ownerID: originalFlow.metadata.ownerID,
        isOwner: false,
        flowId: input.flowId,
      }

      try {
        const canFork = safeApplyJsonLogic(forkRule, context)
        if (!canFork) {
          throw new Error('You do not have permission to fork this flow')
        }
      } catch (error) {
        // Treat any evaluation error as permission denied for security
        throw new Error('You do not have permission to fork this flow')
      }
    }

    // Clone the flow with a new unique ID
    const clonedFlow = await originalFlow.clone()

    // Create new flow with unique ID to prevent conflicts with original
    const { id: _, ...metadataWithoutId } = clonedFlow.metadata
    const forkedFlow = new Flow(metadataWithoutId)

    // Configure fork metadata
    forkedFlow.metadata.name = input.name || `${originalFlow.metadata.name} (Fork)`
    forkedFlow.metadata.createdAt = new Date()
    forkedFlow.metadata.updatedAt = new Date()
    forkedFlow.metadata.ownerID = userId
    forkedFlow.metadata.parentId = originalFlow.id
    forkedFlow.metadata.forkRule = FORK_DENY_RULE

    // Store the forked flow
    const createdFlow = await ctx.flowStore.createFlow(forkedFlow.metadata)

    // Transfer nodes and edges to the new flow
    await createdFlow.addNodes(Array.from(clonedFlow.nodes.values()), true)
    await createdFlow.addEdges(Array.from(clonedFlow.edges.values()), true)
    const updatedFlow = await ctx.flowStore.updateFlow(createdFlow)

    return updatedFlow.metadata
  })
