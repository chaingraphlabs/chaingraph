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

export const updateNodeUI = flowContextProcedure
  .input(z.object({
    flowId: z.string(),
    nodeId: z.string(),
    ui: z.object({
      position: z.object({
        x: z.number(),
        y: z.number(),
      }).optional(),
      dimensions: z.object({
        width: z.number(),
        height: z.number(),
      }).optional(),
      style: z.object({
        backgroundColor: z.string().optional(),
        borderColor: z.string().optional(),
      }).optional(),
      state: z.object({
        isSelected: z.boolean().optional(),
        isHighlighted: z.boolean().optional(),
        isDisabled: z.boolean().optional(),
        isErrorPortCollapsed: z.boolean().optional(),
        isHidden: z.boolean().optional(),
        isMovingDisabled: z.boolean().optional(),
      }).optional(),
      title: z.string().optional(),
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

      // Check if the node has been updated since the request was made
      if (node.getVersion() >= input.version) {
        return {
          flowId: input.flowId,
          nodeId: input.nodeId,
          ui: node.metadata.ui,
          version: node.getVersion(),
        }
      }

      node.setUI({
        ...(node.metadata.ui ?? {}),
        ...input.ui,
        style: {
          ...(node.metadata.ui?.style ?? {}),
          ...input.ui.style,
        },
        state: {
          ...(node.metadata.ui?.state ?? {}),
          ...input.ui.state,
        },
      }, true)

      await ctx.flowStore.updateFlow(flow as Flow)

      return {
        flowId: input.flowId,
        nodeId: input.nodeId,
        ui: node.metadata.ui ?? {},
        version: node.getVersion(),
      }
    } finally {
      await ctx.flowStore.unlockFlow(input.flowId)
    }
  })
