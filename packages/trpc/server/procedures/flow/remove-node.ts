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

export const removeNode = flowContextProcedure
  .input(z.object({
    flowId: z.string(),
    nodeId: z.string(),
  }))
  .mutation(async ({ input, ctx }) => {
    const { flowId, nodeId } = input

    // Get flow from store
    const flow = await ctx.flowStore.getFlow(flowId)
    if (!flow) {
      throw new Error(`Flow ${flowId} not found`)
    }

    // Get node
    const node = flow.nodes.get(nodeId)
    if (!node) {
      throw new Error(`Node ${nodeId} not found in flow ${flowId}`)
    }

    // Remove node from flow
    flow.removeNode(nodeId)
    await ctx.flowStore.updateFlow(flow as Flow)

    return {
      success: true,
      removedNodeId: nodeId,
    }
  })
