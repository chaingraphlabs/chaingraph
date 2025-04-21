/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import { authedProcedure } from '../../trpc'

const defaultFlowLimit = 1000

export const list = authedProcedure
  .query(async ({ ctx }) => {
    const userId = ctx.session?.user?.id
    if (!userId) {
      throw new Error('User not authenticated')
    }

    const flows = await ctx.flowStore.listFlows(
      userId,
      'updatedAtDesc',
      defaultFlowLimit,
    )

    // TODO: lately we have added a shared flow feature, consider to add a query to get all flows

    return flows
      .map(flow => flow.metadata)
      .filter(flowMeta =>
        flowMeta
        && flowMeta.id !== ''
        && flowMeta.createdAt !== null
        && flowMeta.updatedAt !== null,
      )
  })
