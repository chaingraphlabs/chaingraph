/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import { z } from 'zod'
import { authedProcedure } from '../../trpc'
import { FORK_DENY_RULE, safeApplyJsonLogic } from '../../utils/fork-security'

export const getMeta = authedProcedure
  .input(z.object({
    flowId: z.string(),
  }))
  .query(async ({ input, ctx }) => {
    const flow = await ctx.flowStore.getFlow(input.flowId)
    if (!flow) {
      throw new Error(`Flow ${input.flowId} not found`)
    }

    const userId = ctx.session?.user?.id
    const isAdmin = ctx.session?.user?.role === 'admin'

    // Check ownership
    const isOwner = !!(
      userId
      && flow.metadata.ownerID
      && typeof userId === 'string'
      && typeof flow.metadata.ownerID === 'string'
      && flow.metadata.ownerID === userId
    ) || isAdmin // Admin always has owner access

    // Security: Only allow access to owners or if flow is explicitly public
    const isPublic = flow.metadata.isPublic === true
    if (!isOwner && !isPublic) {
      throw new Error('Access denied: Flow is private')
    }

    let canFork = false

    // Evaluate fork permissions if user is authenticated
    if (userId) {
      if (isOwner) {
        // Owners can always fork their own flows
        canFork = true
      } else if (isPublic) {
        // For public flows, evaluate fork rule for non-owners
        const forkRule = flow.metadata.forkRule || FORK_DENY_RULE
        const context = {
          userId,
          ownerID: flow.metadata.ownerID,
          isOwner: false,
          flowId: input.flowId,
        }

        try {
          canFork = safeApplyJsonLogic(forkRule, context)
        } catch (error) {
          // Treat any evaluation error as permission denied for security
          canFork = false
        }
      }
    }

    return {
      ...flow.metadata,
      canFork,
    }
  })
