/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { INode, IPort, ObjectPortConfig } from '@badaitech/chaingraph-types'
import type { PortContextValue } from '../../context/PortContext'
import { useUnit } from 'effector-react'
import { useCallback, useEffect, useMemo } from 'react'
import { useNodeDropFeedback } from '@/store/drag-drop'
import { $activeFlowMetadata } from '@/store/flow'
import { $nodes, updateNodeParent, updateNodeUI } from '@/store/nodes'
import { requestUpdatePortUI } from '@/store/ports'
import { subscribeToNodeSchemaDrop } from '../../../../../hooks/useFlowCallbacks'

export interface UseNodeSchemaDropParams {
  node: INode
  port: IPort<ObjectPortConfig>
  context: PortContextValue
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
  node,
  port,
  context,
}: UseNodeSchemaDropParams): UseNodeSchemaDropReturn {
  const config = port.getConfig()
  const activeFlow = useUnit($activeFlowMetadata)
  const nodes = useUnit($nodes)

  const isNodeSchemaCaptureEnabled = useMemo(() => {
    return config?.ui?.nodeSchemaCapture?.enabled === true
  }, [config.ui?.nodeSchemaCapture?.enabled])

  // Use centralized drag/drop feedback
  const dropFeedback = useNodeDropFeedback(node.id)

  const canAcceptDrop = useMemo(() => {
    // Check if there's a captured node AND it still exists
    const capturedNodeId = config.ui?.nodeSchemaCapture?.capturedNodeId
    const hasCapturedNode = capturedNodeId ? !!nodes[capturedNodeId] : false

    // Check if this node is a valid schema drop target in the drag/drop system
    const isValidSchemaTarget = dropFeedback?.dropType === 'schema' && dropFeedback?.canAcceptDrop

    return isNodeSchemaCaptureEnabled && !hasCapturedNode && isValidSchemaTarget
  }, [isNodeSchemaCaptureEnabled, config.ui?.nodeSchemaCapture?.capturedNodeId, nodes, dropFeedback])

  // For preview, we'll need to get the dragged node from the global store
  // For now, we'll just use the canAcceptDrop flag
  const previewNode = useMemo(() => {
    // This will be undefined for now - the actual preview logic needs to be implemented
    // by getting the dragged node from the centralized store
    return undefined
  }, [])

  const capturedNode = useMemo(() => {
    const capturedNodeId = config.ui?.nodeSchemaCapture?.capturedNodeId
    return capturedNodeId ? nodes[capturedNodeId] : undefined
  }, [config.ui?.nodeSchemaCapture?.capturedNodeId, nodes])

  const isShowingDropZone = useMemo(() => {
    return isNodeSchemaCaptureEnabled && !previewNode && !capturedNode
  }, [isNodeSchemaCaptureEnabled, previewNode, capturedNode])

  // Schema extraction handler for drop events
  const handleSchemaExtraction = useCallback((droppedNode: INode) => {
    // Check if there's already a captured node AND it still exists
    const capturedNodeId = config.ui?.nodeSchemaCapture?.capturedNodeId
    if (capturedNodeId) {
      const capturedNode = nodes[capturedNodeId]
      if (capturedNode) {
        return
      }
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
        nodeId: node.id,
        portId: port.id,
        ui: {
          ...config.ui,
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
        parentNodeId: node.id,
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
  }, [activeFlow?.id, config.ui, node.id, nodes, port.id])

  // Subscribe to global node schema drop events from ReactFlow
  useEffect(() => {
    const unsubscribe = subscribeToNodeSchemaDrop((event) => {
      // Check if this drop event is for our node and port
      if (event.targetNodeId === node.id && event.targetPortId === port.id) {
        handleSchemaExtraction(event.droppedNode)
      }
    })

    return () => {
      unsubscribe()
    }
  }, [node.id, port.id, handleSchemaExtraction])

  const handleClearSchema = useCallback(() => {
    try {
      // Get the captured node ID from port configuration
      const capturedNodeId = config.ui?.nodeSchemaCapture?.capturedNodeId

      // Clear the schema from ObjectPort
      // requestUpdatePortValue({
      //   nodeId: node.id,
      //   portId: port.id,
      //   value: {},
      // })

      // Clear the captured node ID from port UI configuration
      requestUpdatePortUI({
        nodeId: node.id,
        portId: port.id,
        ui: {
          ...config.ui,
          nodeSchemaCapture: {
            enabled: true,
            capturedNodeId: undefined,
          },
        },
      })

      // If there's a captured node, restore it
      if (capturedNodeId) {
        const toolDefinerPosition = node.metadata.ui?.position || { x: 0, y: 0 }
        const restorePosition = {
          x: toolDefinerPosition.x + 300, // Place to the right of Tool Definer
          y: toolDefinerPosition.y,
        }

        // Restore the hidden node
        // updateNodeUI({
        //   flowId: activeFlow?.id || '',
        //   nodeId: capturedNodeId,
        //   ui: {
        //     state: {
        //       // isHidden: false,
        //     },
        //     position: restorePosition,
        //   },
        //   version: (nodes[capturedNodeId]?.metadata?.version || 0) + 1,
        // })

        updateNodeParent({
          flowId: activeFlow?.id || '',
          nodeId: capturedNodeId,
          parentNodeId: undefined, // Clear parent
          position: restorePosition,
          version: (nodes[capturedNodeId]?.getVersion() || 0) + 2,
        })
      }
    } catch (error) {
      console.error('Error clearing schema:', error)
    }
  }, [node.id, node.metadata.ui?.position, port.id, config.ui, activeFlow?.id, nodes])

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
