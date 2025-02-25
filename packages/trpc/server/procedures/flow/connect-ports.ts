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

export const connectPorts = flowContextProcedure
  .input(z.object({
    flowId: z.string(),
    sourceNodeId: z.string(),
    sourcePortId: z.string(),
    targetNodeId: z.string(),
    targetPortId: z.string(),
    metadata: z.object({
      // Optional edge metadata
      label: z.string().optional(),
      description: z.string().optional(),
    }).optional(),
  }))
  .mutation(async ({ input, ctx }) => {
    const {
      flowId,
      sourceNodeId,
      sourcePortId,
      targetNodeId,
      targetPortId,
      metadata,
    } = input

    // Get flow from store
    const flow = await ctx.flowStore.getFlow(flowId)
    if (!flow) {
      throw new Error(`Flow ${flowId} not found`)
    }

    // Connect ports
    const edge = await flow.connectPorts(sourceNodeId, sourcePortId, targetNodeId, targetPortId)
    if (!edge) {
      throw new Error('Failed to connect ports')
    }

    // Set edge metadata if provided
    if (metadata) {
      edge.metadata.label = metadata.label
      edge.metadata.description = metadata.description
    }

    await ctx.flowStore.updateFlow(flow as Flow)

    return {
      edgeId: edge.id,
      sourceNodeId,
      sourcePortId,
      targetNodeId,
      targetPortId,
      metadata: edge.metadata,
    }
  })
