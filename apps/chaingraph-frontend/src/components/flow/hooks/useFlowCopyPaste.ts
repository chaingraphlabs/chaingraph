/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { PasteNodesEvent } from '@/store/nodes'

import type {
  INode,
  SerializedEdgeType,
  SerializedNodeType,
} from '@badaitech/chaingraph-types'
import type { EdgeData } from '../../../store/edges/types'
import {
  EdgeStatus,
} from '@badaitech/chaingraph-types'

import { useReactFlow } from '@xyflow/react'
import { useUnit } from 'effector-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { $edges } from '../../../store/edges/stores'
import { $activeFlowMetadata } from '../../../store/flow/stores'
import { $nodes, pasteNodesToFlowFx } from '../../../store/nodes/stores'
import { useNodeSelection } from './useNodeSelection'

/**
 * Structure for clipboard data containing nodes and their internal edges
 */
export interface ClipboardData {
  /** Nodes that were copied */
  nodes: INode[]
  /** Edges between the copied nodes (internal edges only) */
  edges: EdgeData[]
  /** Timestamp when the data was copied */
  timestamp: number
  /** Virtual origin point (top-left corner of bounding box) for relative positioning */
  virtualOrigin: { x: number, y: number }
}

/**
 * Copy/paste operation result
 */
export interface CopyPasteResult {
  /** Whether the operation was successful */
  success: boolean
  /** Number of nodes affected */
  nodeCount: number
  /** Number of edges affected */
  edgeCount: number
  /** Error message if operation failed */
  error?: string
}

/**
 * Configuration for paste operation
 */
export interface PasteOptions {
  /** Target position for paste operation (where virtual origin should be placed) */
  targetPosition?: { x: number, y: number }
  /** Offset from original position for pasted nodes */
  positionOffset?: { x: number, y: number }
  /** Whether to clear selection after paste */
  clearSelection?: boolean
}

/**
 * Hook return interface
 */
export interface UseFlowCopyPasteReturn {
  /** Copy currently selected nodes and their internal edges */
  copySelectedNodes: () => Promise<CopyPasteResult>
  /** Paste nodes from clipboard */
  pasteNodes: (options?: PasteOptions) => Promise<CopyPasteResult>
  /** Whether there is data in clipboard that can be pasted */
  hasClipboardData: boolean
  /** Number of nodes in clipboard */
  clipboardNodeCount: number
  /** Number of edges in clipboard */
  clipboardEdgeCount: number
  /** Clear the clipboard */
  clearClipboard: () => void
}

/**
 * Hook for implementing copy-paste functionality in the flow editor
 * Handles copying selected nodes with their internal edges and pasting them with new IDs
 */
export function useFlowCopyPaste(): UseFlowCopyPasteReturn {
  // Get state from stores
  const nodes = useUnit($nodes)
  const edges = useUnit($edges)
  const activeFlowMetadata = useUnit($activeFlowMetadata)
  const { screenToFlowPosition } = useReactFlow()

  // Get node selection utilities
  const {
    getAllChildrenRecursive,
    getAbsolutePosition,
    getSelectedNodesWithChildren,
    calculateVirtualOrigin,
    getInternalEdges,
    adjustOrphanedNodePositions,
  } = useNodeSelection({ nodes })

  // Clipboard state - stores copied nodes and edges
  const [clipboard, setClipboard] = useState<ClipboardData | null>(null)

  // Track mouse position for paste operations
  const mousePositionRef = useRef<{ x: number, y: number }>({ x: 0, y: 0 })

  // Helper function to get currently selected nodes
  const getSelectedNodes = useCallback((): INode[] => {
    return Object.values(nodes).filter(node =>
      node.metadata.ui?.state?.isSelected === true,
    )
  }, [nodes])

  // Copy selected nodes and their internal edges
  const copySelectedNodes = useCallback(async (): Promise<CopyPasteResult> => {
    console.log('🔄 Copy operation started...')
    try {
      // Get selected nodes including their children
      const selectedNodes = getSelectedNodes()
      const selectedNodesWithChildren = getSelectedNodesWithChildren(selectedNodes)
      console.log(`📋 Found ${selectedNodesWithChildren.length} nodes (including children):`, selectedNodesWithChildren.map(n => ({ id: n.id, title: n.metadata.title, parent: n.metadata.parentNodeId })))

      if (selectedNodesWithChildren.length === 0) {
        console.log('❌ No nodes selected for copying')
        return {
          success: false,
          nodeCount: 0,
          edgeCount: 0,
          error: 'No nodes selected',
        }
      }

      // Get node IDs for edge filtering
      const selectedNodeIds = new Set(selectedNodesWithChildren.map(node => node.id))
      console.log('🔗 Selected node IDs:', Array.from(selectedNodeIds))

      // Get internal edges (edges between selected nodes only)
      const internalEdges = getInternalEdges(selectedNodeIds, edges)
      console.log(`🔗 Found ${internalEdges.length} internal edges:`, internalEdges.map(e => ({ id: e.edgeId, source: e.sourceNodeId, target: e.targetNodeId })))

      // Adjust positions for nodes whose parents aren't included in the selection
      const adjustedNodes = adjustOrphanedNodePositions(selectedNodesWithChildren, selectedNodeIds)
      console.log('📄 Nodes cloned and positions adjusted successfully')

      // Calculate virtual origin (top-left bounding box) using adjusted positions
      const virtualOrigin = calculateVirtualOrigin(adjustedNodes)
      console.log('📐 Calculated virtual origin:', virtualOrigin)

      // Store in clipboard
      const clipboardData: ClipboardData = {
        nodes: adjustedNodes,
        edges: [...internalEdges], // Spread to create a copy
        timestamp: Date.now(),
        virtualOrigin,
      }

      setClipboard(clipboardData)
      console.log('✅ Copy operation completed successfully!', {
        nodeCount: selectedNodesWithChildren.length,
        edgeCount: internalEdges.length,
        timestamp: clipboardData.timestamp,
        virtualOrigin: clipboardData.virtualOrigin,
        nodes: adjustedNodes,
      })

      return {
        success: true,
        nodeCount: selectedNodesWithChildren.length,
        edgeCount: internalEdges.length,
      }
    } catch (error) {
      console.error('❌ Copy operation failed:', error)
      return {
        success: false,
        nodeCount: 0,
        edgeCount: 0,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      }
    }
  }, [getSelectedNodes, getSelectedNodesWithChildren, getInternalEdges, calculateVirtualOrigin, adjustOrphanedNodePositions, edges])

  // Paste nodes from clipboard
  const pasteNodes = useCallback(async (options?: PasteOptions): Promise<CopyPasteResult> => {
    console.log('📋 Paste operation started...')

    if (!clipboard || !activeFlowMetadata || !activeFlowMetadata.id) {
      const error = !clipboard ? 'No data in clipboard' : 'No active flow'
      console.log(`❌ Paste failed: ${error}`)
      return {
        success: false,
        nodeCount: 0,
        edgeCount: 0,
        error,
      }
    }

    try {
      // Determine paste position - use provided target position, or mouse position, or default
      const pastePosition = options?.targetPosition
        || screenToFlowPosition({ x: mousePositionRef.current.x, y: mousePositionRef.current.y })
        || { x: 100, y: 100 }

      console.log('🔄 Calling pasteNodesToFlowFx with:', {
        flowId: activeFlowMetadata.id,
        nodeCount: clipboard.nodes.length,
        edgeCount: clipboard.edges.length,
        pastePosition,
        virtualOrigin: clipboard.virtualOrigin,
      })

      // Convert our ClipboardData to the format expected by the backend
      const pasteData: PasteNodesEvent = {
        flowId: activeFlowMetadata.id,
        clipboardData: {
          nodes: clipboard.nodes.map(node => node.serialize() as SerializedNodeType), // Serialize nodes
          edges: clipboard.edges.map((e) => {
            const edgeSerialized: SerializedEdgeType = {
              id: e.edgeId,
              metadata: e.metadata,
              status: EdgeStatus.Active,
              sourceNodeId: e.sourceNodeId,
              sourcePortId: e.sourcePortId,
              targetNodeId: e.targetNodeId,
              targetPortId: e.targetPortId,
            }

            return edgeSerialized
          }),
          timestamp: clipboard.timestamp,
        },
        pastePosition,
        virtualOrigin: clipboard.virtualOrigin,
      }

      const result = await pasteNodesToFlowFx(pasteData)

      console.log('✅ Paste operation completed successfully!', result)

      // clean up clipboard after successful paste
      setClipboard(null)

      return {
        success: result.success,
        nodeCount: result.nodeCount,
        edgeCount: result.edgeCount,
      }
    } catch (error) {
      console.error('❌ Paste operation failed:', error)
      return {
        success: false,
        nodeCount: 0,
        edgeCount: 0,
        error: error instanceof Error ? error.message : 'Unknown paste error',
      }
    }
  }, [clipboard, activeFlowMetadata, screenToFlowPosition])

  // Track mouse position for paste operations
  const handleMouseMove = useCallback((event: MouseEvent) => {
    mousePositionRef.current = {
      x: event.clientX,
      y: event.clientY,
    }
  }, [])

  // Handle keyboard events
  const handleKeyDown = useCallback(async (event: KeyboardEvent) => {
    // Check for modifier key (Cmd on Mac, Ctrl on Windows/Linux)
    const isModifierPressed = event.metaKey || event.ctrlKey

    if (!isModifierPressed) {
      return
    }

    console.log(`⌨️ Keyboard shortcut detected: ${event.metaKey ? 'Cmd' : 'Ctrl'}+${event.key}`)

    switch (event.key.toLowerCase()) {
      case 'c': {
        console.log('📋 Copy shortcut triggered')
        const copyResult = await copySelectedNodes()
        if (copyResult.success) {
          event.preventDefault()
          console.log(`✅ Successfully copied ${copyResult.nodeCount} nodes and ${copyResult.edgeCount} edges`)
        }
        break
      }
      case 'v': {
        console.log('📋 Paste shortcut triggered')
        const pasteResult = await pasteNodes()
        if (pasteResult.success) {
          event.preventDefault()
          console.log(`✅ Successfully pasted ${pasteResult.nodeCount} nodes and ${pasteResult.edgeCount} edges`)
        }
        break
      }
      default:
        // Do nothing for other keys
        break
    }
  }, [copySelectedNodes, pasteNodes])

  // Set up event listeners
  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown)
    document.addEventListener('mousemove', handleMouseMove)

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.removeEventListener('mousemove', handleMouseMove)
    }
  }, [handleKeyDown, handleMouseMove])

  // Clear clipboard
  const clearClipboard = useCallback(() => {
    setClipboard(null)
  }, [])

  return {
    copySelectedNodes,
    pasteNodes,
    hasClipboardData: !!clipboard,
    clipboardNodeCount: clipboard?.nodes.length ?? 0,
    clipboardEdgeCount: clipboard?.edges.length ?? 0,
    clearClipboard,
  }
}
