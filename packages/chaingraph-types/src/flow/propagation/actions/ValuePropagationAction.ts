/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { PortUpdatedEventData } from '../../events'
import type { ActionContext, PropagationAction } from '../types'
import { AnyPort } from '../../../port'
import { deepCopy } from '../../../utils'
import { FlowEventType } from '../../events'

/**
 * Action that propagates port values to all connected downstream ports
 *
 * Trigger: PortUpdated event
 * Condition: Port has outgoing edges
 * Execute:
 *   1. Get port value (or defaultValue)
 *   2. For each outgoing edge:
 *      - deepCopy(value) → targetPort.setValue()
 *      - Update target node
 */
export class ValuePropagationAction implements PropagationAction {
  readonly name = 'ValuePropagation'

  canExecute(context: ActionContext): boolean {
    // Only execute for PortUpdated events
    if (context.event.type !== FlowEventType.PortUpdated) {
      return false
    }

    const eventData = context.event.data as PortUpdatedEventData
    const updatedPort = eventData.port
    const nodeId = updatedPort.getConfig().nodeId

    if (!nodeId) {
      return false
    }

    const node = context.flow.nodes.get(nodeId)
    if (!node) {
      return false
    }

    // Check if port has outgoing edges
    const outgoingEdges = context.flow.getOutgoingEdges(node)
    return outgoingEdges.some(edge => edge.sourcePort.id === updatedPort.id)
  }

  execute(context: ActionContext): void {
    const eventData = context.event.data as PortUpdatedEventData
    const updatedPort = eventData.port
    let updatedPortConfig = updatedPort.getConfig()
    const nodeId = updatedPort.getConfig().nodeId!
    const node = context.flow.nodes.get(nodeId)!

    // Handle AnyPort unwrapping
    if (updatedPortConfig.type === 'any' && updatedPort instanceof AnyPort) {
      const underlyingType = (updatedPort as AnyPort).unwrapUnderlyingType()
      if (!underlyingType) {
        // If the port is an any port and has no underlying type, skip the update
        return
      }
      updatedPortConfig = underlyingType
    }

    // Find all edges where this port is the source
    const edges = context.flow.filterEdges((edge) => {
      return edge.sourceNode.id === nodeId && edge.sourcePort.id === updatedPort.id
    })

    // Propagate value to each connected target port
    edges.forEach((edge) => {
      const sourceValue = updatedPort.getValue() ?? updatedPortConfig.defaultValue ?? undefined

      edge.targetPort.setValue(deepCopy(sourceValue))
      edge.targetNode.updatePort(edge.targetPort)

      // Update the target node in the flow
      const targetNode = context.flow.nodes.get(edge.targetNode.id)
      if (targetNode) {
        context.flow.updateNode(targetNode)
      }
    })
  }
}
