/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import { z } from 'zod'
import { publicProcedure, router } from '../../trpc'

// Enhanced input validation schema for demo session creation
const createDemoSessionInput = z.object({
  displayName: z.string()
    .min(1, 'Display name must not be empty')
    .max(50, 'Display name must be 50 characters or less')
    .regex(
      /^[\w \-.']+$/,
      'Display name can only contain letters, numbers, spaces, hyphens, underscores, apostrophes, and periods',
    )
    .optional(),
}).optional()

export const demoProcedures = router({
  /**
   * Create a demo session (public endpoint - no auth required).
   * Returns a stateless JWT token valid for 7 days.
   *
   * Frontend can call this to get instant demo access.
   *
   * Input validation:
   * - displayName: 1-50 characters, alphanumeric + spaces/hyphens/underscores/apostrophes/periods
   */
  createDemoSession: publicProcedure
    .input(createDemoSessionInput)
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
