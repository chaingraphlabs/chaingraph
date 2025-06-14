/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { EdgeData } from '@/store/edges/types'
import type { PasteNodesEvent } from '@/store/nodes'
import type { INode, SerializedEdgeType, SerializedNodeType } from '@badaitech/chaingraph-types'
import { $edges } from '@/store/edges/stores'
import { $activeFlowMetadata } from '@/store/flow/stores'
import { $nodes, pasteNodesToFlowFx } from '@/store/nodes/stores'
import { EdgeStatus } from '@badaitech/chaingraph-types'
import { useReactFlow } from '@xyflow/react'
import { useUnit } from 'effector-react'
import { useCallback, useMemo } from 'react'

/**
 * Structure for exported flow data
 */
export interface ExportedFlowData {
  version: '1.0'
  timestamp: number
  exportMode: 'all' | 'selected'
  flowMetadata: {
    id?: string
    name?: string
    description?: string
    tags?: string[]
  }
  virtualOrigin: { x: number, y: number }
  nodes: SerializedNodeType[]
  edges: SerializedEdgeType[]
  nodeCount: number
  edgeCount: number
}

/**
 * Import result
 */
export interface ImportResult {
  success: boolean
  nodeCount: number
  edgeCount: number
}

/**
 * Validation result
 */
export interface ValidationResult {
  isValid: boolean
  error?: string
  data?: ExportedFlowData
}

/**
 * Hook for exporting and importing flow data
 */
export function useExportImport() {
  const nodes = useUnit($nodes)
  const edges = useUnit($edges)
  const activeFlowMetadata = useUnit($activeFlowMetadata)
  const { getViewport } = useReactFlow()

  // Get selected nodes
  const selectedNodes = useMemo(() => {
    return Object.values(nodes).filter(node =>
      node.metadata.ui?.state?.isSelected === true,
    )
  }, [nodes])

  // Get internal edges for a set of node IDs
  const getInternalEdges = useCallback((nodeIds: Set<string>): EdgeData[] => {
    return edges.filter(edge =>
      nodeIds.has(edge.sourceNodeId) && nodeIds.has(edge.targetNodeId),
    )
  }, [edges])

  // Calculate virtual origin (top-left corner of bounding box)
  const calculateVirtualOrigin = useCallback((nodes: INode[]): { x: number, y: number } => {
    if (nodes.length === 0) {
      return { x: 0, y: 0 }
    }

    let minX = Infinity
    let minY = Infinity

    for (const node of nodes) {
      const position = node.metadata.ui?.position || { x: 0, y: 0 }
      minX = Math.min(minX, position.x)
      minY = Math.min(minY, position.y)
    }

    return { x: minX, y: minY }
  }, [])

  // Export flow as JSON
  const exportFlow = useCallback(async (mode: 'all' | 'selected'): Promise<string> => {
    if (!activeFlowMetadata) {
      throw new Error('No active flow to export')
    }

    let nodesToExport: INode[]
    let edgesToExport: EdgeData[]

    if (mode === 'all') {
      // Export all nodes and edges
      nodesToExport = Object.values(nodes)
      edgesToExport = edges
    } else {
      // Export only selected nodes and their internal edges
      nodesToExport = selectedNodes
      if (nodesToExport.length === 0) {
        throw new Error('No nodes selected for export')
      }
      const selectedNodeIds = new Set(nodesToExport.map(n => n.id))
      edgesToExport = getInternalEdges(selectedNodeIds)
    }

    // Calculate virtual origin
    const virtualOrigin = calculateVirtualOrigin(nodesToExport)

    // Create export data
    const exportData: ExportedFlowData = {
      version: '1.0',
      timestamp: Date.now(),
      exportMode: mode,
      flowMetadata: {
        id: activeFlowMetadata.id,
        name: activeFlowMetadata.name,
        description: activeFlowMetadata.description,
        tags: activeFlowMetadata.tags,
      },
      virtualOrigin,
      nodes: nodesToExport.map(node => node.serialize() as SerializedNodeType),
      edges: edgesToExport.map(edge => ({
        id: edge.edgeId,
        metadata: edge.metadata,
        status: EdgeStatus.Active,
        sourceNodeId: edge.sourceNodeId,
        sourcePortId: edge.sourcePortId,
        targetNodeId: edge.targetNodeId,
        targetPortId: edge.targetPortId,
      })),
      nodeCount: nodesToExport.length,
      edgeCount: edgesToExport.length,
    }

    return JSON.stringify(exportData, null, 2)
  }, [activeFlowMetadata, nodes, edges, selectedNodes, getInternalEdges, calculateVirtualOrigin])

  // Validate import data
  const validateImportData = useCallback((jsonString: string): ValidationResult => {
    try {
      const data = JSON.parse(jsonString) as ExportedFlowData

      // Check version
      if (!data.version || data.version !== '1.0') {
        return { isValid: false, error: 'Unsupported version. Expected version 1.0' }
      }

      // Check required fields
      if (!data.nodes || !Array.isArray(data.nodes)) {
        return { isValid: false, error: 'Invalid data: missing nodes array' }
      }

      if (!data.edges || !Array.isArray(data.edges)) {
        return { isValid: false, error: 'Invalid data: missing edges array' }
      }

      if (!data.virtualOrigin || typeof data.virtualOrigin.x !== 'number' || typeof data.virtualOrigin.y !== 'number') {
        return { isValid: false, error: 'Invalid data: missing or invalid virtual origin' }
      }

      // Basic validation passed
      return { isValid: true, data }
    } catch (error) {
      return { isValid: false, error: 'Invalid JSON format' }
    }
  }, [])

  // Import flow from JSON
  const importFlow = useCallback(async (jsonString: string): Promise<ImportResult> => {
    if (!activeFlowMetadata?.id) {
      throw new Error('No active flow to import into')
    }

    // Validate the data
    const validation = validateImportData(jsonString)
    if (!validation.isValid || !validation.data) {
      throw new Error(validation.error || 'Invalid import data')
    }

    const importData = validation.data

    // Get the current viewport center as paste position
    const viewport = getViewport()
    const viewportCenter = {
      x: -viewport.x + (window.innerWidth / 2) / viewport.zoom,
      y: -viewport.y + (window.innerHeight / 2) / viewport.zoom,
    }

    // Prepare paste event
    const pasteEvent: PasteNodesEvent = {
      flowId: activeFlowMetadata.id,
      clipboardData: {
        nodes: importData.nodes,
        edges: importData.edges,
        timestamp: importData.timestamp,
      },
      pastePosition: viewportCenter,
      virtualOrigin: importData.virtualOrigin,
    }

    // Execute the paste
    const result = await pasteNodesToFlowFx(pasteEvent)

    return {
      success: result.success,
      nodeCount: result.nodeCount,
      edgeCount: result.edgeCount,
    }
  }, [activeFlowMetadata, validateImportData, getViewport])

  return {
    exportFlow,
    importFlow,
    selectedNodeCount: selectedNodes.length,
    validateImportData,
  }
}
