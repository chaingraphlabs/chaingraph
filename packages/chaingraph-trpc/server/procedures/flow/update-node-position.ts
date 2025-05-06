/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { Flow } from '@badaitech/chaingraph-types'
import { DefaultPosition } from '@badaitech/chaingraph-types'
import { z } from 'zod'
import { flowContextProcedure } from '../../trpc'

// export const updateNodePosition = publicProcedure
export const updateNodePosition = flowContextProcedure
  .input(z.object({
    flowId: z.string(),
    nodeId: z.string(),
    position: z.object({
      x: z.number(),
      y: z.number(),
    }),
    version: z.number(),
  }))
  .mutation(async ({ input, ctx }) => {
    await ctx.flowStore.lockFlow(input.flowId)

    try {
      const flow = await ctx.flowStore.getFlow(input.flowId)
      if (!flow)
        throw new Error('Flow not found')

      const node = flow.nodes.get(input.nodeId)
      if (!node)
        throw new Error('Node not found')

      if (node.getVersion() >= input.version) {
        console.warn(`Node ${input.nodeId} has been updated since the request was made, local version: ${node.getVersion()}, request version: ${input.version}`)
        // Node has been updated since the request was made
        return {
          flowId: input.flowId,
          nodeId: input.nodeId,
          position: node.metadata.ui?.position ?? DefaultPosition,
          version: node.getVersion(),
        }
      }

      // const hasPositionChanged = (
      //   !node.metadata.ui?.position
      //   || node.metadata.ui.position.x !== input.position.x
      //   || node.metadata.ui.position.y !== input.position.y
      // )
      // if (!hasPositionChanged) {
      //   return {
      //     flowId: input.flowId,
      //     nodeId: input.nodeId,
      //     position: input.position,
      //     version: node.getVersion(),
      //   }
      // }

      node.setPosition(input.position, true)

      await ctx.flowStore.updateFlow(flow as Flow)

      return {
        flowId: input.flowId,
        nodeId: input.nodeId,
        position: input.position,
        requestedVersion: input.version,
        version: node.getVersion(),
      }
    } finally {
      await ctx.flowStore.unlockFlow(input.flowId)
    }
  })
