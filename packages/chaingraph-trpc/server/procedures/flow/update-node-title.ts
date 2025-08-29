/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { Flow, INode } from '@badaitech/chaingraph-types'
import { NodeEventType } from '@badaitech/chaingraph-types'
import { z } from 'zod'
import { flowContextProcedure } from '../../trpc'

export const updateNodeTitle = flowContextProcedure
  .input(z.object({
    flowId: z.string(),
    nodeId: z.string(),
    title: z.string().max(500).trim().optional(),
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
          title: node.metadata.title || '',
          version: node.getVersion(),
        }
      }

      const oldTitle = node.metadata.title

      node.setMetadata({
        ...node.metadata,
        title: input.title,
      })
      node.incrementVersion()

      await node.emit({
        type: NodeEventType.TitleChange,
        nodeId: node.id,
        timestamp: new Date(),
        version: node.getVersion(),
        oldTitle,
        newTitle: input.title || '',
      })
      await flow.updateNode(node as INode)

      await ctx.flowStore.updateFlow(flow as Flow)

      return {
        flowId: input.flowId,
        nodeId: input.nodeId,
        title: node.metadata.title || '',
        version: node.getVersion(),
      }
    } finally {
      await ctx.flowStore.unlockFlow(input.flowId)
    }
  })
