/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { IPort, ObjectPort } from '@badaitech/chaingraph-types'
import { generatePortIDArrayElement, NodeEventType } from '@badaitech/chaingraph-types'
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
    // TODO: create nodes store?

    await ctx.flowStore.lockFlow(input.flowId)

    try {
      const flow = await ctx.flowStore.getFlow(input.flowId)
      if (!flow)
        throw new Error('Flow not found')

      const node = flow.nodes.get(input.nodeId)
      if (!node)
        throw new Error('Node not found')

      node.bindPortBindings()

      const port = node.ports.get(input.portId)
      if (!port)
        throw new Error('Port not found')

      port.setValue(input.value)

      const portsToUpdate = [port]

      // find all parents of this port and update their values
      let currentPort = port
      while (currentPort.getConfig().parentId) {
        const parentPort = node.getPort(currentPort.getConfig().parentId!)
        if (!parentPort) {
          throw new Error(`Parent port ${currentPort.getConfig().parentId} not found for port ${currentPort.id}`)
        }
        portsToUpdate.push(parentPort)
        currentPort = parentPort
      }

      // Start batch update mode to collect all port updates
      node.startBatchUpdate()
      
      // Update ports - these will be collected, not emitted immediately
      node.updatePorts(portsToUpdate)
      
      // Commit all updates via flow.updateNode (auto-commits the batch)
      flow.updateNode(node)

      // console.log('Port value updated', { flowId: input.flowId, nodeId: input.nodeId, portId: input.portId, value: input.value })

      await ctx.flowStore.updateFlow(flow)

      return {
        flowId: input.flowId,
        nodeId: input.nodeId,
        port,
      }
    } finally {
      await ctx.flowStore.unlockFlow(input.flowId)
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
    await ctx.flowStore.lockFlow(input.flowId)

    try {
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
      }

      const createdPort = node.addObjectProperty(port, key, config)
      if (!createdPort)
        throw new Error('Failed to create port')

      await node.emit({
        type: NodeEventType.PortCreate,
        portId: createdPort.id,
        port: createdPort,
        nodeId: node.id,
        timestamp: new Date(),
        version: node.getVersion(),
      })
      flow.updateNode(node)

      // console.log('Object port key added', { flowId: input.flowId, nodeId: input.nodeId, portId: input.portId, key, config })

      await ctx.flowStore.updateFlow(flow)

      return {
        flowId: input.flowId,
        nodeId: input.nodeId,
        node,
      }
    } finally {
      await ctx.flowStore.unlockFlow(input.flowId)
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
    await ctx.flowStore.lockFlow(input.flowId)

    try {
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

      node.removeObjectProperty(port, key)

      node.emit({
        type: NodeEventType.PortDelete,
        portId: keyPort.id,
        port: keyPort,
        nodeId: node.id,
        timestamp: new Date(),
        version: node.getVersion(),
      })

      // emits for all parents port update:
      let currentPort: IPort | undefined = keyPort

      while (currentPort?.getConfig().parentId) {
        const parentPort = node.getPort(currentPort.getConfig().parentId!)
        if (!parentPort) {
          break
        }

        node.emit({
          type: NodeEventType.PortUpdate,
          portId: parentPort.id,
          port: parentPort,
          nodeId: node.id,
          timestamp: new Date(),
          version: node.getVersion(),
        })

        currentPort = parentPort
      }

      // trigger node update
      flow.updateNode(node)

      // console.log('Object port key removed', { flowId: input.flowId, nodeId: input.nodeId, portId: input.portId, key })

      await ctx.flowStore.updateFlow(flow)

      return {
        flowId: input.flowId,
        nodeId: input.nodeId,
        node,
      }
    } finally {
      await ctx.flowStore.unlockFlow(input.flowId)
    }
  })

export const updateItemConfigArrayPort = flowContextProcedure
  .input(z.object({
    flowId: z.string(),
    nodeId: z.string(),
    portId: z.string(),
    itemConfig: z.any(),
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

      const port = node.getPort(input.portId)
      if (!port)
        throw new Error('Port not found')

      const config = port.getConfig()
      if (config.type !== 'array')
        throw new Error('Port is not an array port')

      port.setConfig({
        ...config,
        itemConfig: input.itemConfig,
      })

      node.updateArrayItemConfig(port)

      //

      flow.updateNode(node)

      await ctx.flowStore.updateFlow(flow)

      return {
        flowId: input.flowId,
        nodeId: input.nodeId,
        node,
      }
    } finally {
      await ctx.flowStore.unlockFlow(input.flowId)
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
    await ctx.flowStore.lockFlow(input.flowId)

    try {
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

      node.appendArrayItem(port, input.value)
      flow.updateNode(node)

      // console.log('Object port key added', { flowId: input.flowId, nodeId: input.nodeId, portId: input.portId, key, config })

      await ctx.flowStore.updateFlow(flow)

      return {
        flowId: input.flowId,
        nodeId: input.nodeId,
        node,
      }
    } finally {
      await ctx.flowStore.unlockFlow(input.flowId)
    }
  })

export const removeElementArrayPort = flowContextProcedure
  .input(z.object({
    flowId: z.string(),
    nodeId: z.string(),
    portId: z.string(),
    index: z.number(),
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

      const port = node.getPort(input.portId)
      if (!port)
        throw new Error('Port not found')

      if (port.getConfig().type !== 'array')
        throw new Error('Port is not an array port')

      const itemPortId = generatePortIDArrayElement(port.id, input.index)
      flow.removePort(node.id, itemPortId)

      node.removeArrayItem(port, input.index)
      flow.updateNode(node)

      // console.log('Object port key added', { flowId: input.flowId, nodeId: input.nodeId, portId: input.portId, key, config })

      await ctx.flowStore.updateFlow(flow)

      return {
        flowId: input.flowId,
        nodeId: input.nodeId,
        node,
      }
    } finally {
      await ctx.flowStore.unlockFlow(input.flowId)
    }
  })
