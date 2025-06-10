/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { INode, IPort, ObjectPortConfig } from '@badaitech/chaingraph-types'
import type { PortContextValue } from '../../context/PortContext'
import { $activeFlowMetadata } from '@/store/flow'
import { $nodes, updateNodeParent, updateNodeUI } from '@/store/nodes'
import { requestUpdatePortUI } from '@/store/ports'
import { useUnit } from 'effector-react'
import { useCallback, useEffect, useMemo } from 'react'
import { subscribeToNodeSchemaDrop } from '../../../../../hooks/useFlowCallbacks'
import { useDragAndDrop } from './useDragAndDrop'

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

  const {
    canDropSingleNode,
    draggedNode,
    isValidDrop,
  } = useDragAndDrop({
    rootNodeId: config.nodeId,
    overlapThreshold: 0.05, // 0.05 = 5% overlap
  })

  const canAcceptDrop = useMemo(() => {
    // Don't accept drops if there's already a captured node
    const hasCapturedNode = !!config.ui?.nodeSchemaCapture?.capturedNodeId
    return isNodeSchemaCaptureEnabled && !hasCapturedNode && canDropSingleNode && isValidDrop && !!draggedNode
  }, [isNodeSchemaCaptureEnabled, config.ui?.nodeSchemaCapture?.capturedNodeId, canDropSingleNode, isValidDrop, draggedNode])

  const previewNode = useMemo(() => {
    return canAcceptDrop ? draggedNode : undefined
  }, [canAcceptDrop, draggedNode])

  const capturedNode = useMemo(() => {
    const capturedNodeId = config.ui?.nodeSchemaCapture?.capturedNodeId
    return capturedNodeId ? nodes[capturedNodeId] : undefined
  }, [config.ui?.nodeSchemaCapture?.capturedNodeId, nodes])

  const isShowingDropZone = useMemo(() => {
    return isNodeSchemaCaptureEnabled && !previewNode && !capturedNode
  }, [isNodeSchemaCaptureEnabled, previewNode, capturedNode])

  // Schema extraction handler for drop events
  const handleSchemaExtraction = useCallback((droppedNode: INode) => {
    // Check if there's already a captured node - if so, ignore the drop
    if (config.ui?.nodeSchemaCapture?.capturedNodeId) {
      // check if the node really exists
      const capturedNode = nodes[config.ui.nodeSchemaCapture.capturedNodeId]
      if (capturedNode) {
        console.log('Schema drop ignored - port already has a captured node:', {
          targetNode: node.id,
          targetPort: port.id,
          currentCapturedNodeId: config.ui.nodeSchemaCapture.capturedNodeId,
          attemptedDropNodeId: droppedNode.id,
        })
        return
      }
    }

    console.log('Schema drop detected via ReactFlow onNodeDragStop:', {
      targetNode: node.id,
      targetPort: port.id,
      sourceNode: droppedNode.id,
      sourceNodeTitle: droppedNode.metadata.title,
    })

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

      // log parent and node position for debugging
      console.log('Updating node parent and position for schema drop:', {
        flowId: activeFlow?.id,
        nodeId: droppedNode.id,
        parentNodeId: node.id,
        parentPosition: node.metadata.ui?.position || { x: 0, y: 0 },
        nodePosition: droppedNode.metadata.ui?.position || { x: 0, y: 0 },
      })

      updateNodeParent({
        flowId: activeFlow?.id || '',
        nodeId: droppedNode.id,
        parentNodeId: node.id,
        position: {
          x: 20,
          y: 80, // Default position, can be adjusted as needed
        },
        version: droppedNode.getVersion() + 1,
      })

      updateNodeUI({
        flowId: activeFlow?.id || '',
        nodeId: droppedNode.id,
        ui: {
          position: {
            x: 20,
            y: 80, // Default position, can be adjusted as needed
          },
          state: {
            ...droppedNode.metadata.ui?.state,
            isMovingDisabled: true,
          },
        },
        version: droppedNode.getVersion(),
      })

      // updateNodePosition({
      //   flowId: activeFlow?.id || '',
      //   nodeId: droppedNode.id,
      //   position: {
      //     x: 20,
      //     y: 80, // Default position, can be adjusted as needed
      //   },
      //   version: droppedNode.getVersion(),
      // })

      // iterate over the dropped node's ports and add them as field object ports
      // droppedNode.ports.forEach((port) => {
      //   if (port.getConfig().parentId) {
      //     // Skip child ports
      //     return
      //   }
      //
      //   // Add each port as a field object port
      //   addFieldObjectPort({
      //     nodeId: node.id,
      //     portId: port.id,
      //     config: {
      //       ...port.getConfig(),
      //     },
      //     key: port.getConfig().key || port.id, // Use key or fallback to port ID
      //   })
      // })

      // Hide the dropped node
      // updateNodeUI({
      //   flowId: activeFlow?.id || '',
      //   nodeId: droppedNode.id,
      //   ui: {
      //     ...droppedNode.metadata.ui,
      //     state: {
      //       ...droppedNode.metadata.ui?.state,
      //       // isHidden: true,
      //     },
      //   },
      //   version: droppedNode.getVersion() + 1,
      // })

      console.log('Successfully applied schema and hid source node')
    } catch (error) {
      console.error('Error extracting schema from drop:', error)
    }
  }, [activeFlow?.id, config.ui, node.id, node.metadata.ui?.position, nodes, port.id])

  // Subscribe to global node schema drop events from ReactFlow
  useEffect(() => {
    const unsubscribe = subscribeToNodeSchemaDrop((event) => {
      // Check if this drop event is for our node and port
      if (event.targetNodeId === node.id && event.targetPortId === port.id) {
        console.log('Received schema drop event for our port!')
        handleSchemaExtraction(event.droppedNode)
      }
    })

    return () => {
      unsubscribe()
    }
  }, [node.id, port.id, handleSchemaExtraction])

  const handleClearSchema = useCallback(() => {
    console.log('Clearing schema from ObjectPort:', {
      targetNode: node.id,
      targetPort: port.id,
    })

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

        console.log('Restored hidden node:', capturedNodeId, 'to position:', restorePosition)
      }

      console.log('Successfully cleared schema')
    } catch (error) {
      console.error('Error clearing schema:', error)
    }
  }, [node.id, node.metadata.ui?.position, port.id, config.ui, activeFlow?.id, nodes])

  return {
    isNodeSchemaCaptureEnabled,
    canAcceptDrop,
    previewNode,
    capturedNode,
    isShowingDropZone,
    handleClearSchema,
  }
}
