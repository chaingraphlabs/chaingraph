/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import { z } from 'zod'
import { flowContextProcedure } from '../../trpc'

export const setPublic = flowContextProcedure
  .input(z.object({
    flowId: z.string(),
    isPublic: z.boolean(),
  }))
  .mutation(async ({ input, ctx }) => {
    const userId = ctx.session?.user?.id
    if (!userId) {
      throw new Error('User not authenticated')
    }

    // Get the flow
    const flow = await ctx.flowStore.getFlow(input.flowId)
    if (!flow) {
      throw new Error(`Flow ${input.flowId} not found`)
    }

    // Check if user owns this flow (flowContextProcedure already handles this, but being explicit)
    if (flow.metadata.ownerID !== userId) {
      throw new Error('Only the flow owner can change visibility settings')
    }

    // Update the public visibility
    flow.metadata.isPublic = input.isPublic
    flow.metadata.updatedAt = new Date()

    // Save the updated flow
    await ctx.flowStore.updateFlow(flow)

    return { success: true, isPublic: flow.metadata.isPublic }
  })
