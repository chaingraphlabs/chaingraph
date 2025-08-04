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

  async execute(context: ActionContext): Promise<void> {
    const eventType = context.event.type

    if (eventType === FlowEventType.PortUpdated) {
      return this.handlePortUpdate(context)
    } else if (eventType === FlowEventType.EdgeAdded || eventType === FlowEventType.EdgesAdded) {
      return this.handleEdgeCreation(context)
    }
  }

  private async handlePortUpdate(context: ActionContext): Promise<void> {
    const eventData = context.event.data as PortUpdatedEventData
    const updatedPort = eventData.port
    const nodeId = updatedPort.getConfig().nodeId!
    const node = context.flow.nodes.get(nodeId)!

    // Get outgoing edges from this port
    const outgoingEdges = context.flow.getOutgoingEdges(node)

    const promises: Promise<void>[] = []

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
          edge.sourcePort as ObjectPort | AnyPort,
          edge.targetPort as ObjectPort | AnyPort,
          true,
        )

        // Update value as well
        edge.targetPort.setValue(deepCopy(updatedPort.getValue()))
        edge.targetNode.updatePort(edge.targetPort)

        // Update the target node in the flow
        const targetNode = context.flow.nodes.get(edge.targetNode.id)
        if (targetNode) {
          promises.push(context.flow.updateNode(targetNode))
        }
      }
    }

    // Wait for all updates to complete
    return Promise.all(promises).then(() => {})
  }

  private async handleEdgeCreation(context: ActionContext): Promise<void> {
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
        if (targetPortConfig.isSchemaMutable) {
          targetNode.copyObjectSchemaTo(
            sourceNode,
            sourcePort as ObjectPort | AnyPort,
            targetPort as ObjectPort | AnyPort,
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
