/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import { NodeUIMetadataSchema } from '@badaitech/chaingraph-types'
import { z } from 'zod'
import { publicProcedure } from '../../trpc'

export const updateNodeUI = publicProcedure
  .input(z.object({
    flowId: z.string(),
    nodeId: z.string(),
    // FIXME: FIX Cycle types
    ui: NodeUIMetadataSchema,
    version: z.number(),
  }))
  .mutation(async ({ input, ctx }) => {
    // TODO: create nodes store

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

    // Update dimensions if present
    // const hasInputDimensions
    //   = input.ui.dimensions
    //     && input.ui.dimensions.width > 0
    //     && input.ui.dimensions.height > 0

    // const hasDimensionsChanged = (
    //   hasInputDimensions
    //   && (
    //     !node.metadata.ui?.dimensions
    //     || node.metadata.ui.dimensions.width !== input.ui.dimensions?.width
    //     || node.metadata.ui.dimensions.height !== input.ui.dimensions?.height
    //   )
    // )

    // if (hasDimensionsChanged) {
    //   node.setDimensions(input.ui.dimensions!, true)
    // } else {
    //   node.incrementVersion()
    // }

    // Update metadata
    // node.setMetadata({
    //   ...node.metadata,
    //   ui: {
    //     ...(node.metadata.ui ?? {}),
    //     ...input.ui,
    //   },
    // })

    return {
      flowId: input.flowId,
      nodeId: input.nodeId,
      ui: node.metadata.ui ?? {},
      version: node.getVersion(),
    }
  })
