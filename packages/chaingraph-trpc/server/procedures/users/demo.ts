/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import { z } from 'zod'
import { publicProcedure, router } from '../../trpc'

export const demoProcedures = router({
  /**
   * Create a demo session (public endpoint - no auth required).
   * Returns a stateless JWT token valid for 7 days.
   *
   * Frontend can call this to get instant demo access.
   */
  createDemoSession: publicProcedure
    .input(z.object({
      displayName: z.string().optional(),
    }).optional())
    .mutation(async ({ input, ctx }) => {
      const { user, token } = await ctx.userStore.createDemoUser(
        input?.displayName,
      )

      return {
        token,
        user: {
          id: user.id,
          displayName: user.displayName,
          role: user.role,
        },
      }
    }),
})
