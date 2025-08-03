/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { ObjectPort } from '../../../port'
import type { EdgeAddedEventData, EdgesAddedEventData, PortUpdatedEventData } from '../../events'
import type { ActionContext, PropagationAction } from '../types'
import { AnyPort } from '../../../port'
import { deepCopy } from '../../../utils'
import { FlowEventType } from '../../events'

/**
 * Action that transfers object schemas between connected ports
 *
 * Trigger: EdgeAdded/EdgesAdded OR PortUpdated (for object ports)
 * Condition:
 *   - Both ports are type 'object'
 *   - targetPort.isSchemaMutable === true
 *   - Target has no schema OR empty schema
 * Execute:
 *   1. Copy source schema
 *   2. Apply to target via copyObjectSchemaTo()
 */
export class SchemaTransferAction implements PropagationAction {
  readonly name = 'SchemaTransfer'

  canExecute(context: ActionContext): boolean {
    const eventType = context.event.type

    // Handle PortUpdated events
    if (eventType === FlowEventType.PortUpdated) {
      const eventData = context.event.data as PortUpdatedEventData
      const updatedPort = eventData.port
      let updatedPortConfig = updatedPort.getConfig()

      // Handle AnyPort unwrapping
      if (updatedPortConfig.type === 'any' && updatedPort instanceof AnyPort) {
        const underlyingType = (updatedPort as AnyPort).unwrapUnderlyingType()
        if (!underlyingType)
          return false
        updatedPortConfig = underlyingType
      }

      // Only process object ports
      return updatedPortConfig.type === 'object'
    }

    // Handle edge events
    return eventType === FlowEventType.EdgeAdded || eventType === FlowEventType.EdgesAdded
  }

  execute(context: ActionContext): void {
    const eventType = context.event.type

    if (eventType === FlowEventType.PortUpdated) {
      this.handlePortUpdate(context)
    } else {
      this.handleEdgeCreation(context)
    }
  }

  private handlePortUpdate(context: ActionContext): void {
    const eventData = context.event.data as PortUpdatedEventData
    const updatedPort = eventData.port
    const nodeId = updatedPort.getConfig().nodeId!
    const node = context.flow.nodes.get(nodeId)!

    // Get outgoing edges from this port
    const outgoingEdges = context.flow.getOutgoingEdges(node)

    for (const edge of outgoingEdges) {
      if (edge.sourcePort.id !== updatedPort.id) {
        continue
      }

      const targetPortConfig = edge.targetPort instanceof AnyPort
        ? edge.targetPort.unwrapUnderlyingType() || edge.targetPort.getConfig()
        : edge.targetPort.getConfig()

      if (targetPortConfig.type === 'object' && targetPortConfig.isSchemaMutable) {
        edge.targetNode.copyObjectSchemaTo(
          edge.sourceNode,
          edge.sourcePort as ObjectPort,
          edge.targetPort as ObjectPort,
          true,
        )

        // Update value as well
        edge.targetPort.setValue(deepCopy(updatedPort.getValue()))
        edge.targetNode.updatePort(edge.targetPort)

        // Update the target node in the flow
        const targetNode = context.flow.nodes.get(edge.targetNode.id)
        if (targetNode) {
          context.flow.updateNode(targetNode)
        }
      }
    }
  }

  private handleEdgeCreation(context: ActionContext): void {
    const edges: EdgeAddedEventData[] = []

    if (context.event.type === FlowEventType.EdgesAdded) {
      const edgesAddedEventData = context.event.data as EdgesAddedEventData
      edges.push(...edgesAddedEventData.edges)
    } else {
      const edgeAddedEventData = context.event.data as EdgeAddedEventData
      edges.push(edgeAddedEventData)
    }

    for (const edgeData of edges) {
      const sourceNode = context.flow.nodes.get(edgeData.sourceNodeId)
      const targetNode = context.flow.nodes.get(edgeData.targetNodeId)

      if (!sourceNode || !targetNode)
        continue

      const sourcePort = sourceNode.getPort(edgeData.sourcePortId)
      const targetPort = targetNode.getPort(edgeData.targetPortId)

      if (!sourcePort || !targetPort)
        continue

      const sourcePortConfig = sourcePort.getConfig()
      const targetPortConfig = targetPort.getConfig()

      // Check if both are object ports and target is mutable
      if (sourcePortConfig.type === 'object' && targetPortConfig.type === 'object') {
        if (
          targetPortConfig.isSchemaMutable
          && (!targetPortConfig.schema.properties || Object.keys(targetPortConfig.schema.properties || []).length === 0)
        ) {
          targetNode.copyObjectSchemaTo(
            sourceNode,
            sourcePort as ObjectPort,
            targetPort as ObjectPort,
            true,
          )

          // Transfer initial value
          const targetValue = sourcePort.getValue() ?? sourcePortConfig.defaultValue ?? undefined
          targetPort.setValue(deepCopy(targetValue))
          targetNode.updatePort(targetPort)
        }
      }
    }
  }
}
