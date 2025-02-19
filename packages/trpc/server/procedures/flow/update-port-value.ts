/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { ObjectPort } from '@badaitech/chaingraph-types'
import { PortPluginRegistry } from '@badaitech/chaingraph-types'
import { z } from 'zod'
import { publicProcedure } from '../../trpc'

export const updatePortValueSchema = z.object({
  flowId: z.string(),
  nodeId: z.string(),
  portId: z.string(),
  value: z.any(),
  nodeVersion: z.number(),
})

export type UpdatePortValueInput = z.infer<typeof updatePortValueSchema>

export const updatePortValue = publicProcedure
  .input(updatePortValueSchema)
  .mutation(async ({ input, ctx }) => {
    // TODO: create nodes store

    const flow = await ctx.flowStore.getFlow(input.flowId)
    if (!flow)
      throw new Error('Flow not found')

    const node = flow.nodes.get(input.nodeId)
    if (!node)
      throw new Error('Node not found')

    const port = node.ports.get(input.portId)
    if (!port)
      throw new Error('Port not found')

    port.setValue(input.value)
    node.updatePort(port.id, port)

    console.log('Port value updated', { flowId: input.flowId, nodeId: input.nodeId, portId: input.portId, value: input.value })

    return {
      flowId: input.flowId,
      nodeId: input.nodeId,
      port,
    }
  })

export const addFieldObjectPort = publicProcedure
  .input(z.object({
    flowId: z.string(),
    nodeId: z.string(),
    portId: z.string(),
    key: z.string(),
    config: PortPluginRegistry.getInstance().getConfigUnionSchema(),
  }))
  .mutation(async ({ input, ctx }) => {
    const flow = await ctx.flowStore.getFlow(input.flowId)
    if (!flow)
      throw new Error('Flow not found')

    const node = flow.nodes.get(input.nodeId)
    if (!node)
      throw new Error('Node not found')

    const port = node.getPort(input.portId)
    if (!port)
      throw new Error('Port not found')

    if (port.getConfig().type !== 'object')
      throw new Error('Port is not an object port')

    const objectPort = port as ObjectPort
    const key = input.key
    const config = input.config

    objectPort.addField(key, config)
    node.initialize()
    node.updatePort(port.id, port)

    console.log('Object port key added', { flowId: input.flowId, nodeId: input.nodeId, portId: input.portId, key, config })

    return {
      flowId: input.flowId,
      nodeId: input.nodeId,
      node,
    }
  })

export const removeFieldObjectPort = publicProcedure
  .input(z.object({
    flowId: z.string(),
    nodeId: z.string(),
    portId: z.string(),
    key: z.string(),
  }))
  .mutation(async ({ input, ctx }) => {
    const flow = await ctx.flowStore.getFlow(input.flowId)
    if (!flow)
      throw new Error('Flow not found')

    const node = flow.nodes.get(input.nodeId)
    if (!node)
      throw new Error('Node not found')

    const port = node.getPort(input.portId)
    if (!port)
      throw new Error('Port not found')

    if (port.getConfig().type !== 'object')
      throw new Error('Port is not an object port')

    const objectPort = port as ObjectPort
    const key = input.key

    if (!objectPort.getConfig().schema.properties[key])
      throw new Error('Key not found in object port')

    objectPort.removeField(key)
    node.initialize()
    node.updatePort(port.id, port)

    console.log('Object port key removed', { flowId: input.flowId, nodeId: input.nodeId, portId: input.portId, key })

    return {
      flowId: input.flowId,
      nodeId: input.nodeId,
      node,
    }
  })
