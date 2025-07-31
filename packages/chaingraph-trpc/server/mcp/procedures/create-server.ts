/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import { z } from 'zod'
import { authedProcedure } from '../../trpc'

const authHeaderSchema = z.object({
  key: z.string(),
  value: z.string(),
})

export const createServer = authedProcedure
  .input(z.object({
    title: z.string().min(1, 'Title is required'),
    url: z.string().url('Invalid URL format'),
    authHeaders: z.array(authHeaderSchema),
  }))
  .mutation(async ({ input, ctx }) => {
    const userId = ctx.session?.user?.id
    if (!userId) {
      throw new Error('User not authenticated')
    }

    return await ctx.mcpStore.createServer(userId, {
      title: input.title,
      url: input.url,
      authHeaders: input.authHeaders,
    })
  })
