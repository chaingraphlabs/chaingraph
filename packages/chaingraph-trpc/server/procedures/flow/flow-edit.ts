/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { Flow } from '@badaitech/chaingraph-types'
import { z } from 'zod'
import { flowContextProcedure } from '../../trpc'

export const edit = flowContextProcedure
  .input(z.object({
    flowId: z.string(),
    name: z.string().optional(),
    description: z.string().optional(),
    tags: z.array(z.string()).optional(),
  }))
  .mutation(async ({ input, ctx }) => {
    const { flowId, name, description, tags } = input
    const flow = await ctx.flowStore.getFlow(flowId)
    if (!flow) {
      throw new Error(`Flow ${flowId} not found`)
    }

    if (name) {
      flow.metadata.name = name
    }
    if (description) {
      flow.metadata.description = description
    }
    if (tags) {
      flow.metadata.tags = tags
    }

    flow.metadata.updatedAt = new Date()

    return await ctx.flowStore.updateFlow(flow as Flow)
  })
