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

export const updateNodeParent = flowContextProcedure
  .input(z.object({
    flowId: z.string(),
    nodeId: z.string(),
    parentNodeId: z.string().optional(),
    position: z.object({
      x: z.number(),
      y: z.number(),
    }),
    version: z.number(),
  }))
  .mutation(async ({ input, ctx }) => {
    const flow = await ctx.flowStore.getFlow(input.flowId)
    if (!flow)
      throw new Error('Flow not found')

    const node = flow.nodes.get(input.nodeId)
    if (!node)
      throw new Error('Node not found')

    // Check if the node has been updated since the request was made
    // if (node.getVersion() >= input.version) {
    //   return {
    //     flowId: input.flowId,
    //     nodeId: input.nodeId,
    //     parentNodeId: node.metadata.parentNodeId ?? undefined,
    //     position: node.metadata.ui?.position ?? DefaultPosition,
    //     version: node.getVersion(),
    //   }
    // }

    // Update the parent node
    node.setNodeParent(
      input.position,
      input.parentNodeId ?? undefined,
      true,
    )
    flow.updateNode(node)

    console.log(`[FLOW] Updated parent for node ${input.nodeId} to ${input.parentNodeId}`)

    await ctx.flowStore.updateFlow(flow as Flow)

    return {
      flowId: input.flowId,
      nodeId: input.nodeId,
      parentNodeId: input.parentNodeId,
      position: input.position,
      version: node.getVersion(),
    }
  })
