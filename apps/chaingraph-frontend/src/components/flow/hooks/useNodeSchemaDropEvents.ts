/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { INode, ObjectPortConfig } from '@badaitech/chaingraph-types'
import type { Node } from '@xyflow/react'
import { useCallback } from 'react'

// Custom event for node schema drop detection
export interface NodeSchemaDropEvent {
  droppedNode: INode
  targetNodeId: string
  targetPortId: string
}

// Global event emitter for node schema drops
const nodeSchemaDropCallbacks = new Set<(event: NodeSchemaDropEvent) => void>()

export function subscribeToNodeSchemaDrop(callback: (event: NodeSchemaDropEvent) => void) {
  nodeSchemaDropCallbacks.add(callback)
  return () => nodeSchemaDropCallbacks.delete(callback)
}

function emitNodeSchemaDrop(event: NodeSchemaDropEvent) {
  nodeSchemaDropCallbacks.forEach(callback => callback(event))
}

/**
 * Hook for handling node schema drop detection
 */
export function useNodeSchemaDropEvents() {
  // Helper function to check if a node was dropped on a schema-enabled ObjectPort
  const checkForNodeSchemaDrop = useCallback((
    droppedNode: Node,
    droppedPosition: { x: number, y: number },
    allNodes: Record<string, INode>,
  ) => {
    // Find all nodes that might have schema-enabled ObjectPorts
    const potentialTargetNodes = Object.values(allNodes).filter((node) => {
      // Look for nodes that have ports with nodeSchemaCapture enabled
      return Array.from(node.ports.values()).some((port) => {
        const config = port.getConfig()
        // Check if it's an object port first, then cast to ObjectPortConfig
        if (config.type === 'object') {
          const objectConfig = config as ObjectPortConfig
          return objectConfig.ui?.nodeSchemaCapture?.enabled === true
        }

        return false
      })
    })

    for (const targetNode of potentialTargetNodes) {
      const targetPosition = targetNode.metadata.ui?.position
      const targetDimensions = targetNode.metadata.ui?.dimensions

      if (!targetPosition || !targetDimensions)
        continue

      // Check if dropped node overlaps with target node
      const droppedNodeBounds = {
        x: droppedPosition.x,
        y: droppedPosition.y,
        width: droppedNode.width || 200, // Default width if not available
        height: droppedNode.height || 100, // Default height if not available
      }

      const targetNodeBounds = {
        x: targetPosition.x,
        y: targetPosition.y,
        width: targetDimensions.width,
        height: targetDimensions.height,
      }

      // Calculate overlap area
      const overlapX = Math.max(0, Math.min(
        droppedNodeBounds.x + droppedNodeBounds.width,
        targetNodeBounds.x + targetNodeBounds.width,
      ) - Math.max(droppedNodeBounds.x, targetNodeBounds.x))

      const overlapY = Math.max(0, Math.min(
        droppedNodeBounds.y + droppedNodeBounds.height,
        targetNodeBounds.y + targetNodeBounds.height,
      ) - Math.max(droppedNodeBounds.y, targetNodeBounds.y))

      const overlapArea = overlapX * overlapY
      const droppedNodeArea = droppedNodeBounds.width * droppedNodeBounds.height

      // Check if overlap is sufficient (5% threshold)
      if (overlapArea / droppedNodeArea > 0.05) {
        // Find the schema-enabled port
        const schemaPort = Array.from(targetNode.ports.values()).find((port) => {
          const config = port.getConfig()
          // Check if it's an object port first, then cast to ObjectPortConfig
          if (config.type === 'object') {
            const objectConfig = config as ObjectPortConfig
            return objectConfig.ui?.nodeSchemaCapture?.enabled === true
          }

          return false
        })

        if (schemaPort) {
          const sourceNode = allNodes[droppedNode.id]
          if (sourceNode && sourceNode.id !== targetNode.id) {
            // Emit the schema drop event
            emitNodeSchemaDrop({
              droppedNode: sourceNode,
              targetNodeId: targetNode.id,
              targetPortId: schemaPort.id,
            })
          }
        }
      }
    }
  }, [])

  return {
    checkForNodeSchemaDrop,
    subscribeToNodeSchemaDrop,
  }
}
