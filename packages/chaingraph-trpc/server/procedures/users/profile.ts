/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import { authedProcedure, router } from '../../trpc'

export const profileProcedures = router({
  /**
   * Get the current user's profile
   */
  getProfile: authedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user?.id
    if (!userId) {
      throw new Error('User not authenticated')
    }

    const user = await ctx.userStore.getUserById(userId)
    return user
  }),

  /**
   * List all external accounts linked to the current user
   */
  listExternalAccounts: authedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user?.id
    if (!userId) {
      throw new Error('User not authenticated')
    }

    const accounts = await ctx.userStore.getExternalAccounts(userId)
    return accounts
  }),

  /**
   * Check if the current user is a demo user
   * (has only one external account with provider='demo')
   */
  isDemo: authedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user?.id
    if (!userId) {
      throw new Error('User not authenticated')
    }

    const isDemo = await ctx.userStore.isUserDemo(userId)
    return { isDemo }
  }),

  /**
   * Get demo expiration date if user is demo
   */
  getDemoExpiration: authedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user?.id
    if (!userId) {
      throw new Error('User not authenticated')
    }

    const expiration = await ctx.userStore.getDemoExpiration(userId)
    return { expiration }
  }),
})
