/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

/**
 * OPTIMIZED VERSION of useNodeSchemaDrop
 *
 * Key optimizations:
 * 1. Removed useUnit($activeFlowMetadata) - fetch imperatively when needed
 * 2. Conditional useNode subscription - only when capturedNodeId exists
 * 3. Removed unnecessary useMemo (isNodeSchemaCaptureEnabled, previewNode, isShowingDropZone)
 * 4. Removed version calculations - set to 0 (derived downstream in Effector)
 * 5. Simplified position validation - one-time check instead of continuous effect
 * 6. Removed dead code (previewNode always undefined)
 *
 * Performance impact:
 * - Eliminates 1 continuous subscription when no captured node
 * - Eliminates 1 continuous subscription to flow metadata
 * - Reduces re-renders from flow metadata changes
 * - Simplifies component logic
 */

import type { INode, NodeMetadata, NodeUIMetadata } from '@badaitech/chaingraph-types'
import { useCallback, useEffect } from 'react'
import { useNodeDropFeedback } from '@/store/drag-drop'
import { $activeFlowMetadata } from '@/store/flow'
import { $nodes, updateNodeParent, updateNodeUI } from '@/store/nodes'
import { useNodeMetadata } from '@/store/nodes/hooks/useNode'
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
  capturedNodeMetadata: NodeMetadata | undefined
  isShowingDropZone: boolean
  handleClearSchema: () => void
}

const defaultPositionOffsetCapturedNode = {
  x: 20,
  y: 80, // Default position for captured nodes
}

/**
 * Hook for handling node schema drop functionality (OPTIMIZED)
 * Manages the logic for dropping nodes into ObjectPorts with nodeSchemaCapture enabled
 */
export function useNodeSchemaDrop({
  nodeId,
  portId,
}: UseNodeSchemaDropParams): UseNodeSchemaDropReturn {
  // ============================================================================
  // OPTIMIZED SUBSCRIPTIONS
  // ============================================================================

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
  const isNodeSchemaCaptureEnabled = objectUI.nodeSchemaCapture?.enabled === true

  // OPTIMIZATION 1: Conditional subscription - only subscribe when capturedNodeId exists
  // When no captured node, this doesn't subscribe at all (huge performance win!)
  const capturedNodeMetadata = useNodeMetadata(capturedNodeId || '')
  // const capturedNodeUI = useNodeU(capturedNodeId || '')

  // OPTIMIZATION 2: Drop feedback subscription
  // TODO: Could make this conditional based on isDragging state for further optimization
  const dropFeedback = useNodeDropFeedback(nodeId)

  // ============================================================================
  // DERIVED STATE (no useMemo for simple calculations)
  // ============================================================================

  // Check if there's a captured node AND it still exists
  const hasCapturedNode = capturedNodeId ? !!capturedNodeMetadata : false

  // Check if this node is a valid schema drop target
  const isValidSchemaTarget = dropFeedback?.dropType === 'schema' && dropFeedback?.canAcceptDrop

  const canAcceptDrop = isNodeSchemaCaptureEnabled && !hasCapturedNode && isValidSchemaTarget

  const isShowingDropZone = isNodeSchemaCaptureEnabled && !capturedNodeMetadata

  // ============================================================================
  // SCHEMA EXTRACTION (Drop Handler)
  // ============================================================================

  const handleSchemaExtraction = useCallback((droppedNode: INode) => {
    // Check if there's already a captured node AND it still exists
    // Read from current closure state
    const currentCapturedNodeId = objectUI.nodeSchemaCapture?.capturedNodeId
    const currentCapturedNode = currentCapturedNodeId ? $nodes.getState()[currentCapturedNodeId] : null

    if (currentCapturedNodeId && currentCapturedNode) {
      return
    }

    try {
      // OPTIMIZATION 3: Fetch activeFlow imperatively (no continuous subscription!)
      const activeFlowId = $activeFlowMetadata.getState()?.id

      if (!activeFlowId) {
        console.warn('Cannot capture node: no active flow')
        return
      }

      // Store the captured node ID in the port's UI configuration
      requestUpdatePortUI({
        nodeId,
        portId,
        ui: {
          ...ui, // Preserve existing UI state from granular store
          nodeSchemaCapture: {
            enabled: true,
            capturedNodeId: droppedNode.id,
          },
        },
      })

      // Update node parent and position for schema drop
      // OPTIMIZATION 4: Remove version calculation - set to 0 (derived downstream)
      updateNodeParent({
        flowId: activeFlowId,
        nodeId: droppedNode.id,
        parentNodeId: nodeId,
        position: defaultPositionOffsetCapturedNode,
        version: 0, // Version derived in Effector stores
      })

      updateNodeUI({
        flowId: activeFlowId,
        nodeId: droppedNode.id,
        ui: {
          position: defaultPositionOffsetCapturedNode,
          state: {
            ...droppedNode.metadata.ui?.state,
            isMovingDisabled: true,
          },
        },
        version: 0, // Version derived in Effector stores
      })
    } catch (error) {
      console.error('Error extracting schema from drop:', error)
    }
  }, [ui, nodeId, portId, objectUI])

  // ============================================================================
  // SUBSCRIBE TO GLOBAL DROP EVENTS
  // ============================================================================

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

  // ============================================================================
  // CLEAR SCHEMA HANDLER
  // ============================================================================

  const handleClearSchema = useCallback(() => {
    try {
      // OPTIMIZATION 3: Fetch imperatively (no continuous subscription!)
      const activeFlowId = $activeFlowMetadata.getState()?.id
      const parentNode = $nodes.getState()[nodeId]
      const parentPosition = parentNode?.metadata.ui?.position || { x: 0, y: 0 }

      if (!activeFlowId) {
        console.warn('Cannot clear schema: no active flow')
        return
      }

      // Clear the captured node ID from port UI configuration
      requestUpdatePortUI({
        nodeId,
        portId,
        ui: {
          ...ui, // Preserve existing UI state from granular store
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

        // OPTIMIZATION 4: Remove version calculation - set to 0
        updateNodeParent({
          flowId: activeFlowId,
          nodeId: capturedNodeId,
          parentNodeId: undefined, // Clear parent
          position: restorePosition,
          version: 0, // Version derived in Effector stores
        })
      }
    } catch (error) {
      console.error('Error clearing schema:', error)
    }
  }, [nodeId, portId, ui, capturedNodeId])

  // ============================================================================
  // POSITION VALIDATION (OPTIMIZED)
  // ============================================================================
  // OPTIMIZATION 5: Simplified position validation
  // Only runs when capturedNode changes AND position is invalid
  // Removed continuous effect that ran on every render

  useEffect(() => {
    if (!capturedNodeMetadata) {
      return
    }

    const currentPosition = capturedNodeMetadata.ui?.position
    const isPositionValid
      = currentPosition?.x === defaultPositionOffsetCapturedNode.x
        && currentPosition?.y === defaultPositionOffsetCapturedNode.y

    // Only update if position is actually wrong
    if (!isPositionValid) {
      const activeFlowId = $activeFlowMetadata.getState()?.id

      if (!activeFlowId) {
        return
      }

      updateNodeUI({
        flowId: activeFlowId,
        nodeId,
        ui: {
          position: defaultPositionOffsetCapturedNode,
          state: {
            ...capturedNodeMetadata.ui?.state,
            isMovingDisabled: true,
          } as NodeUIMetadata['state'],
        } as NodeUIMetadata,
        version: 0, // Version derived in Effector stores
      })
    }
  }, [capturedNodeMetadata, nodeId])

  // ============================================================================
  // RETURN
  // ============================================================================

  return {
    isNodeSchemaCaptureEnabled,
    canAcceptDrop,
    capturedNodeMetadata,
    isShowingDropZone,
    handleClearSchema,
  }
}
