/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import { z } from 'zod'
import { authedProcedure } from '../../trpc'

export const deleteServer = authedProcedure
  .input(z.object({
    id: z.string(),
  }))
  .mutation(async ({ input, ctx }) => {
    const userId = ctx.session?.user?.id
    if (!userId) {
      throw new Error('User not authenticated')
    }

    const success = await ctx.mcpStore.deleteServer(input.id, userId)
    if (!success) {
      throw new Error('Server not found or access denied')
    }

    return { success }
  })
