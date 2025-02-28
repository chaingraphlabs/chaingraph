/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { ArrayPort, Flow, ObjectPort } from '@badaitech/chaingraph-types'
import { findPort } from '@badaitech/chaingraph-types'
import { z } from 'zod'
import { flowContextProcedure } from '../../trpc'

export const updatePortValueSchema = z.object({
  flowId: z.string(),
  nodeId: z.string(),
  portId: z.string(),
  value: z.any(),
  nodeVersion: z.number(),
})

export type UpdatePortValueInput = z.infer<typeof updatePortValueSchema>

export const updatePortValue = flowContextProcedure
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
    node.updatePort(port)

    console.log('Port value updated', { flowId: input.flowId, nodeId: input.nodeId, portId: input.portId, value: input.value })

    await ctx.flowStore.updateFlow(flow as Flow)

    return {
      flowId: input.flowId,
      nodeId: input.nodeId,
      port,
    }
  })

export const addFieldObjectPort = flowContextProcedure
  .input(z.object({
    flowId: z.string(),
    nodeId: z.string(),
    portId: z.string(),
    key: z.string(),
    // config: PortPluginRegistry.getInstance().getConfigUnionSchema(),
    config: z.any(),
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

    // check if key already exists
    if (objectPort.getConfig().schema.properties[key]) {
      throw new Error('Key already exists in object port')

      // const newPortConfig = (new PortConfigProcessor()).processPortConfig(
      //   config,
      //   {
      //     nodeId: node.id,
      //     parentPortConfig: objectPort.getConfig(),
      //     propertyKey: key,
      //     propertyValue: config.defaultValue,
      //   },
      // )

      // const newChildPort = PortFactory.create(newPortConfig)
      // objectPort.addField(key, config)
      // node.setPort(newChildPort as IPort)
    }

    node.addObjectProperty(objectPort, key, config)
    flow.updateNode(node)

    // console.log('Object port key added', { flowId: input.flowId, nodeId: input.nodeId, portId: input.portId, key, config })

    await ctx.flowStore.updateFlow(flow as Flow)

    return {
      flowId: input.flowId,
      nodeId: input.nodeId,
      node,
    }
  })

export const removeFieldObjectPort = flowContextProcedure
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

    // find any connections to this key and remove them
    // find port related to this key
    const keyPort = findPort(node, (port) => {
      return port.getConfig().parentId === objectPort.id && port.getConfig().key === key
    })

    if (!keyPort) {
      throw new Error(`Key port [${key}] not found in object port [${objectPort.id}], node [${node.id}]`)
    }

    // remove port, child ports, and all connections to this ports subtree
    flow.removePort(node.id, keyPort.id)

    node.removeObjectProperty(objectPort, key)

    // remove key from object port schema
    // objectPort.removeField(key)

    // node.updatePort(objectPort as IPort)

    // trigger node update
    flow.updateNode(node)

    console.log('Object port key removed', { flowId: input.flowId, nodeId: input.nodeId, portId: input.portId, key })

    await ctx.flowStore.updateFlow(flow as Flow)

    return {
      flowId: input.flowId,
      nodeId: input.nodeId,
      node,
    }
  })

export const appendElementArrayPort = flowContextProcedure
  .input(z.object({
    flowId: z.string(),
    nodeId: z.string(),
    portId: z.string(),
    value: z.any(),
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

    if (port.getConfig().type !== 'array')
      throw new Error('Port is not an array port')

    const arrayPort = port as ArrayPort
    // const key = input.key
    // const config = input.config

    // check if key already exists
    // if (objectPort.getConfig().schema.properties[key])
    //   throw new Error('Key already exists in object port')

    // const arrayLength = arrayPort.getValue()?.length ?? 0
    // arrayPort.setValue([...arrayPort.getValue() ?? [], input.value])
    //
    // const itemConfig = arrayPort.getConfig().itemConfig
    // const newPortConfig = (new PortConfigProcessor()).processPortConfig(
    //   { ...itemConfig },
    //   {
    //     nodeId: node.id,
    //     parentPortConfig: arrayPort.getConfig(),
    //     propertyKey: arrayLength.toString(),
    //     propertyValue: input.value,
    //   },
    // )
    //
    // const newChildPort = PortFactory.create(newPortConfig) as IPort
    // newChildPort.setValue(input.value)
    //
    // node.setPort(arrayPort as IPort)
    // node.setPort(newChildPort as IPort)
    node.appendArrayItem(arrayPort, input.value)
    flow.updateNode(node)

    // console.log('Object port key added', { flowId: input.flowId, nodeId: input.nodeId, portId: input.portId, key, config })

    await ctx.flowStore.updateFlow(flow as Flow)

    return {
      flowId: input.flowId,
      nodeId: input.nodeId,
      node,
    }
  })

export const removeElementArrayPort = flowContextProcedure
  .input(z.object({
    flowId: z.string(),
    nodeId: z.string(),
    portId: z.string(),
    value: z.any(),
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

    if (port.getConfig().type !== 'array')
      throw new Error('Port is not an array port')

    node.removeArrayItem(arrayPort, input.value)
    flow.updateNode(node)

    // console.log('Object port key added', { flowId: input.flowId, nodeId: input.nodeId, portId: input.portId, key, config })

    await ctx.flowStore.updateFlow(flow as Flow)

    return {
      flowId: input.flowId,
      nodeId: input.nodeId,
      node,
    }
  })
