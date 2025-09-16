/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { INode } from '@badaitech/chaingraph-types'
import type { Node } from '@xyflow/react'
import { useUnit } from 'effector-react'
import { useCallback } from 'react'
import { $hoveredDropTarget } from '@/store/drag-drop'

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
  const hoveredDropTarget = useUnit($hoveredDropTarget)

  // Helper function to check if a node was dropped on a schema-enabled ObjectPort
  const checkForNodeSchemaDrop = useCallback((
    droppedNode: Node,
    droppedPosition: { x: number, y: number },
    allNodes: Record<string, INode>,
  ) => {
    // Use the hoveredDropTarget from the centralized store
    // This already has the correct drop target based on mouse position
    if (hoveredDropTarget && hoveredDropTarget.type === 'schema' && hoveredDropTarget.portId) {
      const sourceNode = allNodes[droppedNode.id]
      const targetNode = allNodes[hoveredDropTarget.nodeId]

      if (sourceNode && targetNode && sourceNode.id !== targetNode.id) {
        // Emit the schema drop event
        emitNodeSchemaDrop({
          droppedNode: sourceNode,
          targetNodeId: targetNode.id,
          targetPortId: hoveredDropTarget.portId,
        })
      }
    }
  }, [hoveredDropTarget])

  return {
    checkForNodeSchemaDrop,
    subscribeToNodeSchemaDrop,
  }
}
