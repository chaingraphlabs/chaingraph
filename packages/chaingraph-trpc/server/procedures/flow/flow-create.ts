/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import { z } from 'zod'
import { authedProcedure } from '../../trpc'

export const create = authedProcedure
  .input(z.object({
    name: z.string(),
    description: z.string().optional(),
    tags: z.array(z.string()).optional(),
  }))
  .mutation(async ({ input, ctx }) => {
    const userId = ctx.session?.user?.id
    if (!userId) {
      throw new Error('User not authenticated')
    }

    const flow = await ctx.flowStore.createFlow({
      name: input.name,
      description: input.description,
      createdAt: new Date(),
      updatedAt: new Date(),
      tags: input.tags,
      ownerID: userId,
      forkRule: { '==': [false, true] }, // Default: always false (not forkable)
    })

    return flow.metadata
  })
