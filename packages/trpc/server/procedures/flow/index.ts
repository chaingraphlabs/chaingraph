/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { Flow } from '@badaitech/chaingraph-types'
import { z } from 'zod'
import { flowContextProcedure, publicProcedure, router } from '../../trpc'
import { addNode } from './add-node'
import { connectPorts } from './connect-ports'
import { removeEdge } from './remove-edge'
import { removeNode } from './remove-node'
import { subscribeToEvents } from './subscriptions'
import { updateNodeParent } from './update-node-parent'
import { updateNodePosition } from './update-node-position'
import { updateNodeUI } from './update-node-ui'
import { updatePortUI } from './update-port-ui'
import {
  addFieldObjectPort,
  appendElementArrayPort,
  removeElementArrayPort,
  removeFieldObjectPort,
  updatePortValue,
} from './update-port-value'

export const flowProcedures = router({
  create: publicProcedure
    .input(z.object({
      name: z.string(),
      description: z.string().optional(),
      tags: z.array(z.string()).optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const flow = await ctx.flowStore.createFlow({
        name: input.name,
        description: input.description,
        createdAt: new Date(),
        updatedAt: new Date(),
        tags: input.tags,
      })

      return flow.metadata
    }),

  get: publicProcedure
    .input(z.string())
    .query(async ({ input: flowId, ctx }) => {
      const flow = await ctx.flowStore.getFlow(flowId)
      if (!flow) {
        throw new Error(`Flow ${flowId} not found`)
      }

      return flow
    }),

  getMeta: publicProcedure
    .input(z.string())
    .query(async ({ input: flowId, ctx }) => {
      const flow = await ctx.flowStore.getFlow(flowId)
      if (!flow) {
        throw new Error(`Flow ${flowId} not found`)
      }
      return flow.metadata
    }),

  list: publicProcedure
    .query(async ({ ctx }) => {
      const flows = await ctx.flowStore.listFlows()

      return flows
        .map(flow => flow.metadata)
        .filter(flowMeta =>
          flowMeta
          && flowMeta.id !== ''
          && flowMeta.createdAt !== null
          && flowMeta.updatedAt !== null,
        )
    }),

  // TODO: flowContextProcedure ??
  delete: publicProcedure
    .input(z.string())
    .mutation(async ({ input: flowId, ctx }) => {
      const success = await ctx.flowStore.deleteFlow(flowId)
      return { success }
    }),

  edit: flowContextProcedure
    .input(z.object({
      flowId: z.string(),
      name: z.string().optional(),
      description: z.string().optional(),
      tags: z.array(z.string()).optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const { flowId, name, description, tags } = input
      const flow = await ctx.flowStore.getFlow(flowId)
      if (!flow) {
        throw new Error(`Flow ${flowId} not found`)
      }

      if (name) {
        flow.metadata.name = name
      }
      if (description) {
        flow.metadata.description = description
      }
      if (tags) {
        flow.metadata.tags = tags
      }

      flow.metadata.updatedAt = new Date()

      return await ctx.flowStore.updateFlow(flow as Flow)
    }),

  subscribeToEvents,
  addNode,
  removeNode,
  connectPorts,
  removeEdge,
  updateNodeUI,
  updateNodePosition,
  updateNodeParent,
  updatePortValue,
  updatePortUI,
  addFieldObjectPort,
  removeFieldObjectPort,
  appendElementArrayPort,
  removeElementArrayPort,
})
