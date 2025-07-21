/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import * as jsonLogic from 'json-logic-js'
import { z } from 'zod'
import { flowContextProcedure } from '../../trpc'

export const getMeta = flowContextProcedure
  .input(z.object({
    flowId: z.string(),
  }))
  .query(async ({ input, ctx }) => {
    const flow = await ctx.flowStore.getFlow(input.flowId)
    if (!flow) {
      throw new Error(`Flow ${input.flowId} not found`)
    }

    const userId = ctx.session?.user?.id
    let canFork = false

    // Evaluate fork rule if user is authenticated
    if (userId) {
      const isOwner = flow.metadata.ownerID === userId

      if (isOwner) {
        // Owners can always fork their own flows
        canFork = true
      } else {
        // Evaluate fork rule for non-owners - default to false (not forkable) if no rule is set
        const forkRule = flow.metadata.forkRule || { '==': [false, true] } // Always false by default
        const context = {
          userId,
          ownerID: flow.metadata.ownerID,
          isOwner: false,
          flowId: input.flowId,
        }
        canFork = jsonLogic.apply(forkRule, context)
      }
    }

    return {
      ...flow.metadata,
      canFork,
    }
  })
