/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { INode } from '@badaitech/chaingraph-types'
import { useUnit } from 'effector-react'
import { useCallback, useEffect, useMemo } from 'react'
import { useNodeDropFeedback } from '@/store/drag-drop'
import { $activeFlowMetadata } from '@/store/flow'
import { $nodes, updateNodeParent, updateNodeUI } from '@/store/nodes'
import { useNode } from '@/store/nodes/hooks/useNode'
import { requestUpdatePortUI } from '@/store/ports'
import { usePortUI } from '@/store/ports-v2'
import { subscribeToNodeSchemaDrop } from '../../../../../hooks/useFlowCallbacks'

export interface UseNodeSchemaDropParams {
  nodeId: string
  portId: string
}

export interface UseNodeSchemaDropReturn {
  isNodeSchemaCaptureEnabled: boolean
  canAcceptDrop: boolean
  previewNode: INode | undefined
  capturedNode: INode | undefined
  isShowingDropZone: boolean
  handleClearSchema: () => void
}

const defaultPositionOffsetCapturedNode = {
  x: 20,
  y: 80, // Default position for captured nodes
}

/**
 * Hook for handling node schema drop functionality
 * Manages the logic for dropping nodes into ObjectPorts with nodeSchemaCapture enabled
 */
export function useNodeSchemaDrop({
  nodeId,
  portId,
}: UseNodeSchemaDropParams): UseNodeSchemaDropReturn {
  const activeFlow = useUnit($activeFlowMetadata)

  // Read nodeSchemaCapture state from granular $portUI store (ports-v2)
  const ui = usePortUI(nodeId, portId)

  // Cast UI for type-safe property access
  const objectUI = ui as {
    nodeSchemaCapture?: {
      enabled?: boolean
      capturedNodeId?: string
    }
  }

  const capturedNodeId = objectUI.nodeSchemaCapture?.capturedNodeId

  // Only subscribe to the specific captured node (not parent node!)
  // Parent node subscription removed - eliminates 100+ unnecessary subscriptions
  const capturedNode = useNode(capturedNodeId || '')

  const isNodeSchemaCaptureEnabled = useMemo(() => {
    return objectUI.nodeSchemaCapture?.enabled === true
  }, [objectUI.nodeSchemaCapture?.enabled])

  // Use centralized drag/drop feedback
  const dropFeedback = useNodeDropFeedback(nodeId)

  const canAcceptDrop = useMemo(() => {
    // Check if there's a captured node AND it still exists
    const hasCapturedNode = capturedNodeId ? !!capturedNode : false

    // Check if this node is a valid schema drop target in the drag/drop system
    const isValidSchemaTarget = dropFeedback?.dropType === 'schema' && dropFeedback?.canAcceptDrop

    return isNodeSchemaCaptureEnabled && !hasCapturedNode && isValidSchemaTarget
  }, [isNodeSchemaCaptureEnabled, capturedNodeId, capturedNode, dropFeedback])

  // For preview, we'll need to get the dragged node from the global store
  // For now, we'll just use the canAcceptDrop flag
  const previewNode = useMemo(() => {
    // This will be undefined for now - the actual preview logic needs to be implemented
    // by getting the dragged node from the centralized store
    return undefined
  }, [])

  const isShowingDropZone = useMemo(() => {
    return isNodeSchemaCaptureEnabled && !previewNode && !capturedNode
  }, [isNodeSchemaCaptureEnabled, previewNode, capturedNode])

  // Schema extraction handler for drop events
  const handleSchemaExtraction = useCallback((droppedNode: INode) => {
    // Check if there's already a captured node AND it still exists
    if (capturedNodeId && capturedNode) {
      return
    }

    try {
      // Extract schema from the dropped node
      // const extractedSchema = extractNodeSchema(droppedNode)

      // Apply schema to the ObjectPort
      // requestUpdatePortValue({
      //   nodeId: node.id,
      //   portId: port.id,
      //   value: extractedSchema,
      // })

      // Store the captured node ID in the port's UI configuration
      requestUpdatePortUI({
        nodeId,
        portId,
        ui: {
          ...ui,  // Preserve existing UI state from granular store
          nodeSchemaCapture: {
            enabled: true,
            capturedNodeId: droppedNode.id,
          },
        },
      })

      // Update node parent and position for schema drop

      updateNodeParent({
        flowId: activeFlow?.id || '',
        nodeId: droppedNode.id,
        parentNodeId: nodeId,
        position: defaultPositionOffsetCapturedNode,
        version: droppedNode.getVersion(),
      })

      updateNodeUI({
        flowId: activeFlow?.id || '',
        nodeId: droppedNode.id,
        ui: {
          position: defaultPositionOffsetCapturedNode,
          state: {
            ...droppedNode.metadata.ui?.state,
            isMovingDisabled: true,
          },
        },
        version: droppedNode.getVersion() + 1,
      })
    } catch (error) {
      console.error('Error extracting schema from drop:', error)
    }
  }, [activeFlow?.id, ui, nodeId, capturedNode, capturedNodeId, portId])

  // Subscribe to global node schema drop events from ReactFlow
  useEffect(() => {
    const unsubscribe = subscribeToNodeSchemaDrop((event) => {
      // Check if this drop event is for our node and port
      if (event.targetNodeId === nodeId && event.targetPortId === portId) {
        handleSchemaExtraction(event.droppedNode)
      }
    })

    return () => {
      unsubscribe()
    }
  }, [nodeId, portId, handleSchemaExtraction])

  const handleClearSchema = useCallback(() => {
    try {
      // Fetch parent node position only when clearing (rare operation)
      // Don't subscribe continuously - huge performance win!
      const parentNode = $nodes.getState()[nodeId]
      const parentPosition = parentNode?.metadata.ui?.position || { x: 0, y: 0 }

      // Clear the captured node ID from port UI configuration
      requestUpdatePortUI({
        nodeId,
        portId,
        ui: {
          ...ui,  // Preserve existing UI state from granular store
          nodeSchemaCapture: {
            enabled: true,
            capturedNodeId: undefined,
          },
        },
      })

      // If there's a captured node, restore it
      if (capturedNodeId) {
        const restorePosition = {
          x: parentPosition.x + 300, // Place to the right of parent
          y: parentPosition.y,
        }

        updateNodeParent({
          flowId: activeFlow?.id || '',
          nodeId: capturedNodeId,
          parentNodeId: undefined, // Clear parent
          position: restorePosition,
          version: (capturedNode?.getVersion() || 0) + 2,
        })
      }
    } catch (error) {
      console.error('Error clearing schema:', error)
    }
  }, [nodeId, portId, ui, activeFlow?.id, capturedNode, capturedNodeId])

  // subscribe to capturedNode changes and if the position is not 20, 80 then update it
  useEffect(() => {
    if (!capturedNode) {
      return
    }

    const isPositionValid = capturedNode.metadata.ui?.position
      && capturedNode.metadata.ui.position.x === defaultPositionOffsetCapturedNode.x
      && capturedNode.metadata.ui.position.y === defaultPositionOffsetCapturedNode.y

    if (!isPositionValid) {
      updateNodeUI({
        flowId: activeFlow?.id || '',
        nodeId: capturedNode.id,
        ui: {
          position: defaultPositionOffsetCapturedNode,
          state: {
            ...capturedNode.metadata.ui?.state,
            isMovingDisabled: true,
          },
        },
        version: capturedNode.getVersion() + 1,
      })
    }
  }, [activeFlow?.id, capturedNode])

  return {
    isNodeSchemaCaptureEnabled,
    canAcceptDrop,
    previewNode,
    capturedNode,
    isShowingDropZone,
    handleClearSchema,
  }
}
