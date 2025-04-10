/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import { publicProcedure } from '../../trpc'

export const list = publicProcedure
  .query(async ({ ctx }) => {
    const flows = await ctx.flowStore.listFlows()

    return flows
      .map(flow => flow.metadata)
      .filter(flowMeta =>
        flowMeta
        && flowMeta.id !== ''
        && flowMeta.createdAt !== null
        && flowMeta.updatedAt !== null,
      )
  })
