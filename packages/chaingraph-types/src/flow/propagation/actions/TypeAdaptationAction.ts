/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { EdgeAddedEventData, EdgesAddedEventData } from '../../events'
import type { ActionContext, PropagationAction } from '../types'
import { AnyPort } from '../../../port'
import { deepCopy } from '../../../utils'
import { FlowEventType } from '../../events'

/**
 * Action that adapts AnyPort types when edges are connected
 *
 * Trigger: EdgeAdded or EdgesAdded event
 * Condition: targetPort.type === 'any'
 * Execute:
 *   1. Extract source port config
 *   2. Set target underlying type
 *   3. Preserve target metadata (id, direction, etc.)
 */
export class TypeAdaptationAction implements PropagationAction {
  readonly name = 'TypeAdaptation'

  canExecute(context: ActionContext): boolean {
    // Only execute for edge events
    if (context.event.type !== FlowEventType.EdgeAdded
      && context.event.type !== FlowEventType.EdgesAdded) {
      return false
    }

    // For EdgesAdded, we'll return true and handle each edge in execute
    // For EdgeAdded, check if the target is an AnyPort
    if (context.event.type === FlowEventType.EdgeAdded) {
      const eventData = context.event.data as EdgeAddedEventData
      const targetNode = context.flow.nodes.get(eventData.targetNodeId)
      if (!targetNode)
        return false

      const targetPort = targetNode.getPort(eventData.targetPortId)
      return targetPort?.getConfig().type === 'any'
    }

    return true
  }

  execute(context: ActionContext): void {
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

      if (!sourceNode || !targetNode) {
        continue
      }

      const sourcePort = sourceNode.getPort(edgeData.sourcePortId)
      const targetPort = targetNode.getPort(edgeData.targetPortId)

      if (!sourcePort || !targetPort) {
        continue
      }

      // Check if target port is an AnyPort
      if (targetPort.getConfig().type === 'any' && targetPort instanceof AnyPort) {
        const sourcePortConfig = sourcePort.getConfig()
        const targetPortConfig = targetPort.getConfig()

        // Get the value to transfer
        const targetValue = sourcePort.getValue() ?? sourcePortConfig.defaultValue ?? undefined

        // Set the underlying type, preserving target port metadata
        targetPort.setUnderlyingType({
          ...deepCopy(sourcePortConfig),
          id: targetPortConfig.id,
          direction: targetPortConfig.direction,
          parentId: targetPortConfig.parentId,
          nodeId: targetPortConfig.nodeId,
          order: targetPortConfig.order,
          key: targetPortConfig.key,
          title: targetPortConfig.title,
          description: targetPortConfig.description,
          defaultValue: deepCopy(sourcePortConfig.defaultValue),
        })

        // Set the initial value
        targetPort.setValue(deepCopy(targetValue))
        targetNode.updatePort(targetPort)
      }
    }
  }
}
