/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import { authedProcedure } from '../../trpc'
import { FORK_DENY_RULE, safeApplyJsonLogic } from '../../utils/fork-security'

const defaultFlowLimit = 1000

export const list = authedProcedure
  .query(async ({ ctx }) => {
    const userId = ctx.session?.user?.id
    if (!userId) {
      throw new Error('User not authenticated')
    }

    const flows = await ctx.flowStore.listFlows(
      userId,
      'updatedAtDesc',
      defaultFlowLimit,
    )

    // TODO: lately we have added a shared flow feature, consider to add a query to get all flows

    return flows
      .map((flow) => {
        const metadata = flow.metadata

        // Compute canFork for each flow
        let canFork = false

        // Owners can always fork their own flows
        if (metadata.ownerID === userId) {
          canFork = true
        } else if (metadata.isPublic) {
          // For public flows, evaluate fork rule for non-owners
          const forkRule = metadata.forkRule || FORK_DENY_RULE
          const context = {
            userId,
            isOwner: false,
            flow: metadata,
          }

          try {
            canFork = safeApplyJsonLogic(forkRule, context)
          } catch (error) {
            // Treat any evaluation error as permission denied for security
            canFork = false
          }
        }

        return {
          ...metadata,
          canFork,
        }
      })
      .filter(flowMeta =>
        flowMeta
        && flowMeta.id !== ''
        && flowMeta.createdAt !== null
        && flowMeta.updatedAt !== null,
      )
  })
