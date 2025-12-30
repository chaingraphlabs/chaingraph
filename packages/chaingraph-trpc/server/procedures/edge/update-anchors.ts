/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { Flow } from '@badaitech/chaingraph-types'
import { EdgeAnchorSchema } from '@badaitech/chaingraph-types'
import { z } from 'zod'
import { flowContextProcedure } from '../../trpc'

/**
 * Batch update all anchors for an edge
 * Uses version-based conflict resolution (server version wins if newer)
 */
export const updateAnchors = flowContextProcedure
  .input(z.object({
    flowId: z.string(),
    edgeId: z.string(),
    anchors: z.array(EdgeAnchorSchema),
    version: z.number(),
  }))
  .mutation(async ({ input, ctx }) => {
    const { flowId, edgeId, anchors, version } = input

    await ctx.flowStore.lockFlow(flowId)

    try {
      const flow = await ctx.flowStore.getFlow(flowId)
      if (!flow) {
        throw new Error(`Flow ${flowId} not found`)
      }

      const edge = flow.edges.get(edgeId)
      if (!edge) {
        throw new Error(`Edge ${edgeId} not found`)
      }

      // Version check - reject if server has newer version
      const currentVersion = edge.metadata.version ?? 0
      if (currentVersion > version) {
        console.warn(`[updateAnchors] Version conflict for edge ${edgeId} in flow ${flowId}: server version ${currentVersion} > client version ${version}`)
        return {
          edgeId,
          anchors: edge.metadata.anchors ?? [],
          version: currentVersion,
          stale: true,
        }
      }

      // Validate parent nodes exist and are groups
      for (const anchor of anchors) {
        if (anchor.parentNodeId) {
          const parentNode = flow.nodes.get(anchor.parentNodeId)

          if (!parentNode) {
            throw new Error(`Parent node ${anchor.parentNodeId} not found for anchor ${anchor.id}`)
          }

          if (parentNode.metadata.category !== 'group') {
            throw new Error(`Parent node ${anchor.parentNodeId} is not a group node`)
          }
        }
      }

      // Update metadata (emits EdgeMetadataUpdated event)
      await flow.updateEdgeMetadata(edgeId, { anchors })
      await ctx.flowStore.updateFlow(flow as Flow)

      return {
        edgeId,
        anchors,
        version: currentVersion + 1,
        stale: false,
      }
    } finally {
      await ctx.flowStore.unlockFlow(flowId)
    }
  })
