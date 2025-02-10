/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import { z } from 'zod'
import { publicProcedure } from '../../trpc'

export const updatePortUISchema = z.object({
  flowId: z.string(),
  nodeId: z.string(),
  portId: z.string(),
  ui: z.record(z.any()),
  nodeVersion: z.number(),
})

export type UpdatePortUIInput = z.infer<typeof updatePortUISchema>

export const updatePortUI = publicProcedure
  .input(updatePortUISchema)
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

    const portConfigFromNode = Array.from(node.metadata?.portsConfig?.values() ?? []).find((portConfig) => {
      return portConfig.id === port.id
    })
    if (!portConfigFromNode)
      throw new Error('Port config not found')

    const portConfig = port.getConfig()
    const currentUi = portConfigFromNode.ui
    const newUi = {
      ...currentUi,
      ...portConfig.ui,
      ...input.ui,
    }

    // port.setValue(input.value)
    console.log('Port UI current ui', currentUi)
    console.log('Port UI input', input.ui)
    console.log('Port UI target config', {
      ui: newUi,
    })

    // set config to the port instance
    port.setConfig({
      ...portConfig,
      ui: newUi,
    })
    node.updatePort(port.id, port)

    // set config to the node metadata
    node.metadata.portsConfig!.set(port.getConfig().key ?? port.getConfig().id!, {
      ...portConfigFromNode,
      ui: newUi,
    })

    return {
      flowId: input.flowId,
      nodeId: input.nodeId,
      port,
    }
  })
