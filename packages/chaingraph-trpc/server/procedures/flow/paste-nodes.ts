/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type {
  Flow,
  INode,
  IPort,
  SerializedEdge,
} from '@badaitech/chaingraph-types'
import {
  SerializedNodeSchemaV1Legacy,
} from '@badaitech/chaingraph-types'
import {
  isObjectPortConfig,
} from '@badaitech/chaingraph-types'
import { NodeStatus } from '@badaitech/chaingraph-types'
import { SerializedEdgeSchema, SerializedNodeSchema } from '@badaitech/chaingraph-types'
import { z } from 'zod'
import { flowContextProcedure } from '../../trpc'

// Input schema for position
const PositionSchema = z.object({
  x: z.number(),
  y: z.number(),
})

const ClipboardDataSchema = z.object({
  nodes: z.array(z.union([SerializedNodeSchema, SerializedNodeSchemaV1Legacy])),
  edges: z.array(SerializedEdgeSchema),
  timestamp: z.number().optional().default(() => Date.now()),
})

export type PasteNodesClipboardDataType = z.infer<typeof ClipboardDataSchema>

export const PasteNodesInputSchema = z.object({
  flowId: z.string(),
  clipboardData: ClipboardDataSchema,
  pastePosition: PositionSchema,
  virtualOrigin: PositionSchema.optional(),
})

export type PasteNodesInputType = z.infer<typeof PasteNodesInputSchema>

/**
 * Procedure to paste nodes and edges into a flow
 * It clones nodes with new IDs and re-establishes edges using the new IDs.
 */
export const pasteNodes = flowContextProcedure
  .input(PasteNodesInputSchema)
  .mutation(async ({ input, ctx }) => {
    const { flowId, clipboardData, pastePosition, virtualOrigin } = input

    if (!virtualOrigin) {
      console.warn(`[FLOW] No virtual origin provided, using default { x: 0, y: 0 }`)
    }
    const actualVirtualOrigin = virtualOrigin || { x: 0, y: 0 }

    // Get flow from store
    const flow = await ctx.flowStore.getFlow(flowId)
    if (!flow) {
      throw new Error(`Flow ${flowId} not found`)
    }

    await ctx.flowStore.lockFlow(flowId)

    try {
      flow.setIsDisabledPropagationEvents(true)

      // Step 1: Clone nodes with new IDs using cloneWithNewId()
      const nodeIdMapping = new Map<string, string>()
      const portIdMapping = new Map<string, string>()
      const createdNodes: INode[] = []

      for (let i = 0; i < clipboardData.nodes.length; i++) {
        try {
          const nodeData = clipboardData.nodes[i]

          // Create a temporary node instance to deserialize the data
          // This assumes we can get the node type from the serialized data
          if (!nodeData.metadata?.type) {
            throw new Error(`Node ${i} missing type information`)
          }

          const nodeType = nodeData.metadata.type
          const tempNode = ctx.nodeRegistry.createNode(nodeType, nodeData.id, nodeData.metadata)

          // Deserialize the node data into the temporary instance
          const originalNode = tempNode.deserialize(nodeData) as INode

          // Clone with new ID using the new method
          const cloneResult = originalNode.cloneWithNewId()
          const clonedNode = cloneResult.clonedNode as INode

          // Only adjust position for root nodes (nodes without parents)
          // Child nodes keep their relative position to their parent
          if (!originalNode.metadata.parentNodeId) {
            // This is a root node, calculate new position using virtual origin system
            const originalPosition = originalNode.metadata.ui?.position || { x: 0, y: 0 }
            const relativePosition = {
              x: originalPosition.x - actualVirtualOrigin.x,
              y: originalPosition.y - actualVirtualOrigin.y,
            }
            const newPosition = {
              x: pastePosition.x + relativePosition.x,
              y: pastePosition.y + relativePosition.y,
            }

            clonedNode.setPosition(newPosition, true)
          } else {
            console.debug(`[FLOW] Child node ${originalNode.id} keeping relative position:`, originalNode.metadata.ui?.position)
          }
          // For child nodes, keep the original position (relative to parent)

          // Store ID mappings
          nodeIdMapping.set(cloneResult.nodeIdMapping.originalId, cloneResult.nodeIdMapping.newId)

          // Store port ID mappings
          cloneResult.portIdMapping.forEach((newPortId, originalPortId) => {
            portIdMapping.set(originalPortId, newPortId)
          })

          // console.debug(`[FLOW] Cloned node ${cloneResult.nodeIdMapping.originalId} -> ${cloneResult.nodeIdMapping.newId}`)

          clonedNode.setStatus(NodeStatus.Initialized, false)

          // Add to flow
          createdNodes.push(clonedNode)
        } catch (error) {
          console.error(`[FLOW] Failed to clone node ${i}:`, error)
          throw new Error(`Failed to clone node ${i}: ${error instanceof Error ? error.message : 'Unknown error'}`)
        }
      }

      for (const node of createdNodes) {
      // iterate over created nodes and fix the parent ID if it exists
        if (node.metadata.parentNodeId) {
          const newParentId = nodeIdMapping.get(node.metadata.parentNodeId)
          if (newParentId) {
            node.metadata.parentNodeId = newParentId
          } else {
            // if there is no new parent ID, remove the parent reference
            node.metadata.parentNodeId = undefined
            console.warn(`[FLOW] Node ${node.id} has a parent node ID ${node.metadata.parentNodeId} that does not exist in the clipboard data`)
          }
        }

        // fix the port nodeSchemaCapture for the node with the new actual node ID
        const ports = node.ports as Map<string, IPort>
        for (const port of ports.values()) {
          const portConfig = port.getConfig()
          if (isObjectPortConfig(portConfig) && portConfig.ui?.nodeSchemaCapture?.capturedNodeId) {
            const newCapturedNodeId = nodeIdMapping.get(portConfig.ui.nodeSchemaCapture.capturedNodeId)
            if (newCapturedNodeId) {
              // If the captured node ID exists, update it
              port.setConfig({
                ...portConfig,
                ui: {
                  ...portConfig.ui,
                  nodeSchemaCapture: {
                    ...portConfig.ui.nodeSchemaCapture,
                    capturedNodeId: newCapturedNodeId,
                  },
                },
              })
            } else {
              // If the captured node ID does not exist, clear it
              port.setConfig({
                ...portConfig,
                ui: {
                  ...portConfig.ui,
                  nodeSchemaCapture: {
                    enabled: true,
                    capturedNodeId: undefined, // Clear the captured node ID
                  },
                },
              })
            }
            node.setPort(port) // Update the port in the node
          }
        }
      }

      const addedNodes = await flow.addNodes(createdNodes)

      // Step 2: Recreate edges using new IDs
      const createdEdges: SerializedEdge[] = []

      // Prepare edge connection data with validated IDs
      const edgeConnectionTasks = clipboardData.edges
        .map((edgeData) => {
          const newSourceNodeId = nodeIdMapping.get(edgeData.sourceNodeId)
          const newTargetNodeId = nodeIdMapping.get(edgeData.targetNodeId)
          const newSourcePortId = portIdMapping.get(edgeData.sourcePortId)
          const newTargetPortId = portIdMapping.get(edgeData.targetPortId)

          if (!newSourceNodeId || !newTargetNodeId || !newSourcePortId || !newTargetPortId) {
            return null
          }

          return {
            originalEdgeData: edgeData,
            newSourceNodeId,
            newTargetNodeId,
            newSourcePortId,
            newTargetPortId,
          }
        })
        .filter((task): task is NonNullable<typeof task> => task !== null)

      // Execute all edge connections in parallel
      const edgeConnectionResults = await Promise.allSettled(
        edgeConnectionTasks.map(async task => ({
          task,
          edge: await flow.connectPorts(
            task.newSourceNodeId,
            task.newSourcePortId,
            task.newTargetNodeId,
            task.newTargetPortId,
          ),
        })),
      )

      // Process results and update metadata
      for (const result of edgeConnectionResults) {
        if (result.status === 'rejected') {
          console.error('[FLOW] Failed to create edge:', result.reason)
          continue
        }

        const { task, edge } = result.value

        if (!edge) {
          console.warn(`[FLOW] Failed to connect ports for edge ${task.originalEdgeData.id}`)
          continue
        }

        // Set edge metadata if provided
        if (task.originalEdgeData.metadata) {
          if (task.originalEdgeData.metadata.label && typeof task.originalEdgeData.metadata.label === 'string') {
            edge.metadata.label = task.originalEdgeData.metadata.label
          }
          if (task.originalEdgeData.metadata.description) {
            edge.metadata.description = task.originalEdgeData.metadata.description
          }
        }

        createdEdges.push({
          id: edge.id,
          metadata: edge.metadata,
          status: edge.status,
          sourceNodeId: task.newSourceNodeId,
          sourcePortId: task.newSourcePortId,
          targetNodeId: task.newTargetNodeId,
          targetPortId: task.newTargetPortId,
        })

        console.debug(`[FLOW] Created edge ${edge.id}`)
      }

      // Save the updated flow
      await ctx.flowStore.updateFlow(flow as Flow)

      return {
        success: true,
        nodeCount: createdNodes.length,
        edgeCount: createdEdges.length,
        createdNodes: createdNodes.map(node => ({
          id: node.id,
          type: node.metadata.type,
          title: node.metadata.title,
          position: node.metadata.ui?.position,
        })),
        createdEdges,
        nodeIdMapping: Object.fromEntries(nodeIdMapping),
        portIdMapping: Object.fromEntries(portIdMapping),
      }
    } catch (error) {
      console.error(`[FLOW] Paste operation failed:`, error)
      throw new Error(`Paste operation failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      flow.setIsDisabledPropagationEvents(false)
      await ctx.flowStore.unlockFlow(flowId)
    }
  })
