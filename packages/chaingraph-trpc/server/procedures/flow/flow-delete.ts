/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import { z } from 'zod'
import { flowContextProcedure } from '../../trpc'

export const flowDelete = flowContextProcedure
  .input(z.object({
    flowId: z.string(),
  }))
  .mutation(async ({ input, ctx }) => {
    // check user access
    if (!ctx.session?.user?.id) {
      throw new Error('User not authenticated')
    }

    await ctx.flowStore.lockFlow(input.flowId)

    try {
      // check if flow exists
      const hasAccess = await ctx.flowStore.hasAccess(input.flowId, ctx.session.user.id)
      if (!hasAccess) {
        throw new Error('Flow not found or access denied')
      }

      const success = await ctx.flowStore.deleteFlow(input.flowId)
      return { success }
    } finally {
      await ctx.flowStore.unlockFlow(input.flowId)
    }
  })
