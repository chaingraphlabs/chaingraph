/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { Flow } from '@badaitech/chaingraph-types'
import { NodeStatus } from '@badaitech/chaingraph-types'
import { customAlphabet } from 'nanoid'
import { nolookalikes } from 'nanoid-dictionary'
import { z } from 'zod'
import { flowContextProcedure } from '../../trpc'

// Input schema for node position
const NodePositionSchema = z.object({
  x: z.number(),
  y: z.number(),
})

// Input schema for node metadata
const NodeMetadataSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  category: z.string().optional(),
  tags: z.array(z.string()).optional(),
}).optional()

export function generateNodeID(): string {
  return `NO${customAlphabet(nolookalikes, 16)()}`
}

export const addNode = flowContextProcedure
  .input(z.object({
    flowId: z.string(),
    nodeType: z.string(),
    position: NodePositionSchema,
    metadata: NodeMetadataSchema,
  }))
  .mutation(async ({ input, ctx }) => {
    const { flowId, nodeType, position, metadata } = input

    await ctx.flowStore.lockFlow(flowId)

    try {
      // Get flow from store
      const flow = await ctx.flowStore.getFlow(flowId)
      if (!flow) {
        throw new Error(`Flow ${flowId} not found`)
      }

      // Create node instance
      const nodeId = generateNodeID()
      const newNode = ctx.nodeRegistry.createNode(nodeType, `${nodeType}:${nodeId}`)
      const node = newNode.clone()

      // Initialize node
      // Explicitly provide undefined to use the ports from the decorated node registry
      node.initialize(undefined)

      // Set additional metadata if provided
      if (metadata) {
        const currentMetadata = node.metadata
        node.setMetadata({
          ...currentMetadata,
          ...metadata,
        })
      }

      // Set position
      node.setPosition(position, true)

      console.debug(`[FLOW] Added node ${node.id} to flow ${flowId}`)

      const createdNode = flow.addNode(node)
      await ctx.flowStore.updateFlow(flow as Flow)

      createdNode.setStatus(NodeStatus.Initialized, true)
      flow.updateNode(createdNode)
      await ctx.flowStore.updateFlow(flow as Flow)

      return createdNode
    } finally {
      await ctx.flowStore.unlockFlow(flowId)
    }
  })
