/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import { z } from 'zod'
import { publicProcedure } from '../../trpc'

export const get = publicProcedure
  .input(z.string())
  .query(async ({ input: flowId, ctx }) => {
    const flow = await ctx.flowStore.getFlow(flowId)
    if (!flow) {
      throw new Error(`Flow ${flowId} not found`)
    }

    return flow
  })
