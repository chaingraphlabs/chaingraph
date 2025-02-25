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

export const updatePortUISchema = z.object({
  flowId: z.string(),
  nodeId: z.string(),
  portId: z.string(),
  ui: z.record(z.any()),
  nodeVersion: z.number(),
})

export type UpdatePortUIInput = z.infer<typeof updatePortUISchema>

export const updatePortUI = flowContextProcedure
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

    const portConfig = port.getConfig()
    portConfig.ui = {
      ...portConfig.ui,
      ...input.ui,
    }

    // set config to the port instance
    port.setConfig(portConfig)
    // node.updatePort(port.id, port)
    node.initialize()
    flow.updateNode(node)

    await ctx.flowStore.updateFlow(flow as Flow)

    return {
      flowId: input.flowId,
      nodeId: input.nodeId,
      port,
    }
  })
