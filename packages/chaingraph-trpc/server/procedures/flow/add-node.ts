/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { Flow, IPortConfig, PortType } from '@badaitech/chaingraph-types'
import { PortPluginRegistry } from '@badaitech/chaingraph-types'
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
    // portsConfig?: Record<string, IPortConfig>
    portsConfig: z.map(z.string(), z.any()).optional(),
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

      // If portsConfig is provided, create a map of ports
      let portsConfigMap: Map<string, IPortConfig> | undefined
      if (input.portsConfig && input.portsConfig.size > 0) {
        portsConfigMap = new Map<string, IPortConfig>()

        // for each input.portsConfig deserialize the config
        // using PortPluginRegistry to ensure compatibility with the node type
        for (const [key, value] of input.portsConfig.entries()) {
          if (!value || typeof value !== 'object') {
            continue
          }

          if (!value.type) {
            throw new Error(`Port config for key "${key}" is missing type property`)
          }

          const portConfig = PortPluginRegistry.getInstance().deserializeConfig(
            value.type as PortType,
            value,
          )

          portsConfigMap.set(key, {
            ...portConfig,
            id: undefined, // Ensure ID is undefined to let the node handle it
            nodeId: node.id, // Set the node ID to the new node's ID
            parentId: undefined, // Ensure parentId is undefined to let the node handle it
          })
        }
      }

      // console.log(`[addNode] Ports config map:`, portsConfigMap)

      // Initialize node
      // Explicitly provide undefined to use the ports from the decorated node registry
      node.initialize(portsConfigMap)

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

      const createdNode = await flow.addNode(node)
      await ctx.flowStore.updateFlow(flow as Flow)

      createdNode.setStatus(NodeStatus.Initialized, true)
      await flow.updateNode(createdNode)
      await ctx.flowStore.updateFlow(flow as Flow)

      return createdNode
    } finally {
      await ctx.flowStore.unlockFlow(flowId)
    }
  })
