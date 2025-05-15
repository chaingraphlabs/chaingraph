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
      }).optional(),
    }),
    version: z.number(),
  }))
  .mutation(async ({ input, ctx }) => {
    // TODO: create nodes store

    await ctx.flowStore.lockFlow(input.flowId)

    console.log(`[updateNodeUI] Locking flow ${input.flowId} for connection...`)

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

      // Log the node title and ID and the input UI
      // console.log('Node title:', node.metadata.title)
      // console.log('Node ID:', node.metadata.id)

      // Log the Node ports erializedJson:
      // console.log('Node ports:', Array.from(node.ports.values()).map((port) => {
      //   return port.serialize()
      // }))

      // // Update dimensions if present
      // const hasInputDimensions
      //   = input.ui.dimensions
      //     && input.ui.dimensions.width > 0
      //     && input.ui.dimensions.height > 0
      //
      // const hasDimensionsChanged = (
      //   hasInputDimensions
      //   && (
      //     !node.metadata.ui?.dimensions
      //     || node.metadata.ui.dimensions.width !== input.ui.dimensions?.width
      //     || node.metadata.ui.dimensions.height !== input.ui.dimensions?.height
      //   )
      // )
      //
      // if (hasDimensionsChanged) {
      //   node.setDimensions(input.ui.dimensions!, true)
      // }

      // Update metadata

      // ...updatedNode.metadata.ui,
      //       ...ui,
      //       style: {
      //         ...updatedNode.metadata.ui?.style,
      //         ...ui.style,
      //       },
      //       state: {
      //         ...updatedNode.metadata.ui?.state,
      //         ...ui.state,
      //       },

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
      console.log(`[updateNodeUI] Unlocking flow ${input.flowId} for connection...`)
      await ctx.flowStore.unlockFlow(input.flowId)
    }
  })
