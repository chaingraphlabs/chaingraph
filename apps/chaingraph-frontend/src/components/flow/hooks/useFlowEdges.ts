/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { Edge } from '@xyflow/react'
import type { EdgeData } from 'store'
import { useFlowNodes } from '@/components/flow/hooks/useFlowNodes.ts'
import { $executionState, $highlightedEdgeId, $highlightedNodeId } from '@/store/execution'
import { useUnit } from 'effector-react'
import { useMemo, useRef } from 'react'
import { $activeFlowId, $edges, $flows } from 'store'
import { $ports } from 'store/ports/stores'

// Constants for edge styling
const EDGE_STYLES = {
  DEFAULT: {
    strokeOpacity: 0.8,
    strokeWidth: 4,
  },
  HIGHLIGHTED: {
    strokeOpacity: 1,
    strokeWidth: 6,
  },
  DIMMED: {
    strokeOpacity: 0.1,
    strokeWidth: 4,
  },
}

/**
 * Helper type for edge styling data
 */
interface EdgeStylingData {
  edgeType: string
  shouldAnimate: boolean
  style: {
    stroke: string
    strokeWidth: number
    strokeOpacity: number
  }
}

/**
 * Hook to transform flow edges into ReactFlow edges with appropriate highlighting
 * Optimized to minimize rerenders by separating edge structure from styling
 */
export function useFlowEdges() {
  const activeFlowId = useUnit($activeFlowId)
  const flows = useUnit($flows)
  const storeEdges = useUnit($edges)
  const nodes = useFlowNodes()
  const ports = useUnit($ports)

  const { nodeStates, edgeStates, executionId } = useUnit($executionState)
  const highlightedNodeId = useUnit($highlightedNodeId)
  const highlightedEdgeId = useUnit($highlightedEdgeId)

  // Ref to store the latest base edges without styling
  const baseEdgesRef = useRef<Map<string, Edge>>(new Map())

  // Track if base edge structure changed to force recomputation
  const edgeStructureRef = useRef<string>('')

  // Process edges into a map for easy lookup
  const edgesMap = useMemo(() => {
    const edges = new Map<string, EdgeData>()
    for (const edge of storeEdges) {
      edges.set(edge.edgeId, edge)
    }
    return edges
  }, [storeEdges])

  // Compute base edges structure (rarely changes)
  const baseEdges = useMemo(() => {
    const flow = flows.find(f => f.id === activeFlowId)
    if (!flow)
      return []

    // Filter valid edges (with existing source and target nodes)
    const filteredEdges = Array.from(edgesMap.values())
      .filter((edge) => {
        const sourceNode = nodes.find(n => n.id === edge.sourceNodeId)
        const targetNode = nodes.find(n => n.id === edge.targetNodeId)

        return sourceNode && targetNode
          && sourceNode.position && targetNode.position
          && !Number.isNaN(sourceNode.position.x) && !Number.isNaN(sourceNode.position.y)
          && !Number.isNaN(targetNode.position.x) && !Number.isNaN(targetNode.position.y)
      })
      .map((edge) => {
        const sourceNode = nodes.find(n => n.id === edge.sourceNodeId)
        const targetNode = nodes.find(n => n.id === edge.targetNodeId)
        if (!sourceNode || !targetNode) {
          return null
        }

        const sourcePort = ports[`${edge.sourceNodeId}-${edge.sourcePortId}`]
        const targetPort = ports[`${edge.targetNodeId}-${edge.targetPortId}`]
        if (!sourcePort || !targetPort) {
          return null
        }

        const config = sourcePort.getConfig()
        const edgeColor = config.ui?.bgColor ?? 'currentColor'

        // Create base edge without styling details
        const baseEdge: Edge = {
          id: edge.edgeId,
          source: edge.sourceNodeId,
          target: edge.targetNodeId,
          sourceHandle: edge.sourcePortId,
          targetHandle: edge.targetPortId,
          type: 'default', // Will be updated in styling phase
          style: {
            stroke: edgeColor,
            strokeWidth: EDGE_STYLES.DEFAULT.strokeWidth,
            strokeOpacity: EDGE_STYLES.DEFAULT.strokeOpacity,
          },
          data: {
            animated: false, // Will be updated in styling phase
            edgeData: edge, // Include original edge data
            sourcePortId: edge.sourcePortId,
            targetPortId: edge.targetPortId,
            version: `${(sourceNode.data?.node as any).getVersion()}_${(targetNode.data?.node as any).getVersion()}`,
          },
        }

        return baseEdge
      })
      .filter(Boolean) as Edge[]

    // Update ref with current base edges
    const newBaseEdgesMap = new Map<string, Edge>()
    filteredEdges.forEach(edge => newBaseEdgesMap.set(edge.id, edge))
    baseEdgesRef.current = newBaseEdgesMap

    // Generate a structure hash to detect changes
    const structureHash = filteredEdges.map(e =>
      `${e.id}:${e.source}:${e.sourceHandle}:${e.target}:${e.targetHandle}:${e.style?.stroke}:${e.data?.version ?? ''}`,
    ).join('|')
    edgeStructureRef.current = structureHash

    return filteredEdges
  }, [activeFlowId, edgesMap, flows, nodes, ports])

  // Compute edge styling (changes frequently)
  const edgeStylingMap = useMemo(() => {
    const stylingMap = new Map<string, EdgeStylingData>()

    // Create styling data for each edge
    baseEdges.forEach((edge) => {
      const edgeData = edgesMap.get(edge.id) as EdgeData
      if (!edgeData)
        return

      const sourceNode = nodeStates.get(edgeData.sourceNodeId)
      const targetNode = nodeStates.get(edgeData.targetNodeId)

      const sourcePort = ports[`${edgeData.sourceNodeId}-${edgeData.sourcePortId}`]
      const targetPort = ports[`${edgeData.targetNodeId}-${edgeData.targetPortId}`]

      if (!sourcePort || !targetPort)
        return

      const config = sourcePort.getConfig()
      const edgeColor = config.ui?.bgColor ?? 'currentColor'

      let shouldAnimate = false
      let edgeStyle = EDGE_STYLES.DEFAULT
      let edgeType = 'default'

      const isHighlighted = highlightedEdgeId && highlightedEdgeId.includes(edgeData.edgeId)
      const isSourceHighlighted = highlightedNodeId && highlightedNodeId.includes(edgeData.sourceNodeId)
      const isTargetHighlighted = highlightedNodeId && highlightedNodeId.includes(edgeData.targetNodeId)
      const hasHighlights = highlightedEdgeId || highlightedNodeId

      if (targetPort && targetPort.isSystem() && !targetPort.isSystemError()) {
        edgeType = 'flow'
        shouldAnimate = false
        edgeStyle = EDGE_STYLES.DEFAULT
      }

      if (targetNode && (
        targetNode.status === 'running'
        || targetNode.status === 'completed'
        || targetNode.status === 'failed'
      )) {
        edgeType = 'flow'
        shouldAnimate = targetPort.isSystem() && !targetPort.isSystemError()
        edgeStyle = EDGE_STYLES.HIGHLIGHTED
      }

      if (targetNode && targetNode.status === 'skipped') {
        edgeType = 'default'
        shouldAnimate = false
        edgeStyle = EDGE_STYLES.DIMMED
      }

      if (targetNode && targetNode.status === 'failed') {
        edgeType = 'flow'
        shouldAnimate = targetPort.isSystem() && !targetPort.isSystemError()
        edgeStyle = EDGE_STYLES.DEFAULT
      }

      if (targetNode && targetNode.status === 'running') {
        edgeType = 'flow'
        shouldAnimate = (targetPort.isSystem() && !targetPort.isSystemError()) || targetPort.getConfig().type === 'stream'
        edgeStyle = EDGE_STYLES.HIGHLIGHTED
      }

      if (executionId && (targetNode && (targetNode.status === 'idle' || !targetNode.status))) {
        edgeStyle = EDGE_STYLES.DIMMED
        edgeType = 'default'
      }

      if (hasHighlights) {
        if (highlightedNodeId) {
          if (isSourceHighlighted || isTargetHighlighted) {
            edgeStyle = EDGE_STYLES.HIGHLIGHTED
          } else {
            edgeType = 'default'
            edgeStyle = EDGE_STYLES.DIMMED
          }
        }

        if (highlightedEdgeId) {
          if (highlightedEdgeId.includes(edgeData.edgeId)) {
            edgeStyle = EDGE_STYLES.HIGHLIGHTED
          } else {
            edgeType = 'default'
            edgeStyle = EDGE_STYLES.DIMMED
          }
        }
      }

      if (isHighlighted) {
        edgeStyle = EDGE_STYLES.HIGHLIGHTED
      }

      // Store styling data
      stylingMap.set(edge.id, {
        edgeType,
        shouldAnimate,
        style: {
          stroke: edgeColor,
          strokeWidth: edgeStyle.strokeWidth,
          strokeOpacity: edgeStyle.strokeOpacity,
        },
      })
    })

    return stylingMap
  }, [baseEdges, edgesMap, nodeStates, ports, highlightedEdgeId, highlightedNodeId, executionId])

  // Memoize the final edges by combining base structure with styling
  // Only re-compute when base edges or their structure changes
  const reactFlowEdges = useMemo(() => {
    return baseEdges.map((baseEdge) => {
      const styling = edgeStylingMap.get(baseEdge.id)

      if (!styling)
        return baseEdge

      return {
        ...baseEdge,
        type: styling.edgeType,
        style: styling.style,
        data: {
          ...baseEdge.data,
          animated: styling.shouldAnimate,
        },
      }
    })
  }, [
    // Depend on base edges structure (rarely changes)
    baseEdges,
    // Depend on the styling map (frequently changes, but lightweight)
    edgeStylingMap,
  ])

  return reactFlowEdges
}
