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
import { FORK_DENY_RULE, safeApplyJsonLogic } from '../../utils/fork-security'

export const fork = flowContextProcedure
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

    // Check if user is the owner - owners can always fork their own flows
    // Add explicit null/undefined checks to prevent permission bypass
    const isOwner = !!(
      userId
      && originalFlow.metadata.ownerID
      && typeof userId === 'string'
      && typeof originalFlow.metadata.ownerID === 'string'
      && originalFlow.metadata.ownerID === userId
    )

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

    // Clone the flow (this creates a new flow with new ID)
    const clonedFlow = originalFlow.clone() as Flow

    // Update metadata for the forked flow
    clonedFlow.metadata.name = input.name || `${originalFlow.metadata.name} (Fork)`
    clonedFlow.metadata.createdAt = new Date()
    clonedFlow.metadata.updatedAt = new Date()
    clonedFlow.metadata.ownerID = userId
    clonedFlow.metadata.parentId = originalFlow.id
    clonedFlow.metadata.forkRule = FORK_DENY_RULE // Reset to default: not forkable

    // Save the forked flow with all its nodes and edges
    const savedFlow = await ctx.flowStore.updateFlow(clonedFlow)

    return savedFlow.metadata
  })
