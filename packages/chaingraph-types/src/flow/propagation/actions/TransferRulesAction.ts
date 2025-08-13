/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type {
  EdgeAddedEventData,
  EdgeRemovedEventData,
  EdgesAddedEventData,
  PortUpdatedEventData,
} from '../../events'
import type { ActionContext, PropagationAction } from '../types'
import { getDefaultTransferEngine } from '../../../port/transfer-rules'
import { FlowEventType } from '../../events'

/**
 * Unified propagation action that uses the Transfer Rules System
 * This replaces the separate SchemaTransferAction, ArrayConfigTransferAction,
 * TypeAdaptationAction, and ValuePropagationAction
 */
export class TransferRulesAction implements PropagationAction {
  readonly name = 'TransferRulesAction'

  /**
   * Check if this action can execute for the given context
   */
  canExecute(context: ActionContext): boolean {
    const { event } = context

    // This action handles all edge-related events and port updates
    return (
      event.type === FlowEventType.EdgeAdded
      || event.type === FlowEventType.EdgesAdded
      || event.type === FlowEventType.EdgeRemoved
      || event.type === FlowEventType.PortUpdated
    )
  }

  /**
   * Execute the Transfer Rules System for edge connections and port updates
   */
  async execute(context: ActionContext): Promise<void> {
    const { event, flow } = context

    // TODO: DI the transfer engine
    const engine = getDefaultTransferEngine()

    switch (event.type) {
      case FlowEventType.EdgeAdded:
      case FlowEventType.EdgesAdded:
      {
        const edges: EdgeAddedEventData[] = []
        if (event.type === FlowEventType.EdgesAdded) {
          const eventEdgesAdded = event.data as EdgesAddedEventData
          edges.push(...eventEdgesAdded.edges)
        } else {
          const eventEdgeAdded = event.data as EdgeAddedEventData
          edges.push(eventEdgeAdded)
        }

        for (const edgeData of edges) {
          const edge = flow.edges.get(edgeData.edgeId)
          if (!edge) {
            console.warn(`Edge ${edgeData.edgeId} not found in flow`)
            return
          }

          // Execute onConnect for new edge
          const result = await engine.onConnect(
            edge.sourcePort,
            edge.targetPort,
            edge.sourceNode,
            edge.targetNode,
          )

          if (!result.success) {
            console.warn(
              `Transfer failed for edge ${edge.id}: ${result.message}`,
              result.error,
            )
          }
        }

        break
      }

      case FlowEventType.EdgeRemoved:
      {
        const eventData: EdgeRemovedEventData = event.data as EdgeRemovedEventData

        console.debug(`[TransferRulesAction] Edge removed: ${eventData.edgeId}`)

        const sourceNode = flow.nodes.get(eventData.sourceNodeId)
        const targetNode = flow.nodes.get(eventData.targetNodeId)
        if (!sourceNode || !targetNode) {
          console.warn(
            `[TransferRulesAction] Source or target node not found for edge ${eventData.edgeId}`,
          )
          return
        }

        const sourcePort = sourceNode.getPort(eventData.sourcePortId)
        const targetPort = targetNode.getPort(eventData.targetPortId)
        if (!sourcePort || !targetPort) {
          console.warn(
            `[TransferRulesAction] Source or target port not found for edge ${eventData.edgeId}`,
          )
          return
        }

        // Execute onConnect for new edge
        const result = await engine.onDisconnect(
          sourcePort,
          targetPort,
          sourceNode,
          targetNode,
        )

        if (!result.success) {
          console.warn(
            `Transfer failed for edge ${eventData.edgeId}: ${result.message}`,
            result.error,
          )
        }

        break
      }

      case FlowEventType.PortUpdated:
      {
        const eventPortUpdated = event.data as PortUpdatedEventData

        // Find all edges connected to this port and propagate changes
        const nodeId = eventPortUpdated.port.getConfig().nodeId
        if (!nodeId) {
          console.warn(`[TransferRulesAction] Port update event has no nodeId for port ${eventPortUpdated.port.id}`)
          return
        }

        const portId = eventPortUpdated.port.id
        const node = flow.nodes.get(nodeId)

        if (!node) {
          console.warn(`Node ${nodeId} not found`)
          return
        }

        const port = node.getPort(portId)
        if (!port) {
          console.warn(`Port ${portId} not found in node ${nodeId}`)
          return
        }

        // Check if this is an output port with connections
        const portConfig = port.getConfig()
        if (portConfig.direction === 'output' || portConfig.direction === 'passthrough') {
          const nodeEdges = flow.getOutgoingEdges(node)

          // Find edges where this port is the source
          for (const edge of nodeEdges) {
            if (edge.sourcePort.id !== portId || edge.sourceNode.id !== nodeId) {
              continue // Only process edges where this port is the source
            }

            // Execute onSourceUpdate for existing edge
            const result = await engine.onSourceUpdate(
              edge.sourcePort,
              edge.targetPort,
              edge.sourceNode,
              edge.targetNode,
            )

            if (!result.success) {
              console.warn(
                `Transfer failed for edge ${edge.id} [${edge.sourcePort.id} -> ${edge.targetPort.id}] after port update: ${result.error}`,
                result.error,
              )
            }
          }
        }
        break
      }
    }
  }
}
