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

export const removeEdge = flowContextProcedure
  .input(z.object({
    flowId: z.string(),
    edgeId: z.string(),
  }))
  .mutation(async ({ input, ctx }) => {
    const { flowId, edgeId } = input

    // Get flow from store
    const flow = await ctx.flowStore.getFlow(flowId)
    if (!flow) {
      throw new Error(`Flow ${flowId} not found`)
    }

    // Get edge
    const edge = flow.edges.get(edgeId)
    if (!edge) {
      throw new Error(`Edge ${edgeId} not found in flow ${flowId}`)
    }

    // Remove edge from flow
    flow.removeEdge(edgeId)

    await ctx.flowStore.updateFlow(flow as Flow)

    return {
      success: true,
      removedEdgeId: edgeId,
    }
  })
