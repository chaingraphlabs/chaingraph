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
import { useMemo } from 'react'
import { $activeFlowId, $edges } from 'store'
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
 * Hook to transform flow edges into ReactFlow edges with appropriate highlighting
 */
export function useFlowEdges() {
  const activeFlowId = useUnit($activeFlowId)
  const storeEdges = useUnit($edges)
  const nodes = useFlowNodes()
  const ports = useUnit($ports)

  const { nodeStates, edgeStates, executionId } = useUnit($executionState)
  const highlightedNodeId = useUnit($highlightedNodeId)
  const highlightedEdgeId = useUnit($highlightedEdgeId)
  // const updateNodeInternals = useUpdateNodeInternals()

  const edges = useMemo(() => {
    const edges = new Map<string, EdgeData>()

    for (const edge of storeEdges) {
      edges.set(edge.edgeId, edge)
    }

    // storeEdges

    // if (activeFlowId && edgeStates.size > 0) {
    //   for (const edge of edgeStates.values()) {
    //     edges.set(
    //       edge.edge.id,
    //       {
    //         flowId: activeFlowId,
    //         edgeId: edge.edge.id,
    //         sourceNodeId: edge.edge.sourceNode.id,
    //         sourcePortId: edge.edge.sourcePort.id,
    //         targetNodeId: edge.edge.targetNode.id,
    //         targetPortId: edge.edge.targetPort.id,
    //         metadata: edge.edge.metadata,
    //       },
    //     )
    //   }
    // }

    return edges
  }, [storeEdges])

  const reactFlowEdges = useMemo(() => {
    // Filter valid edges (with existing source and target nodes)
    return Array.from(edges.values())
      .filter((edge) => {
        const sourceNode = nodes.find(n => n.id === edge.sourceNodeId)
        const targetNode = nodes.find(n => n.id === edge.targetNodeId)

        return sourceNode && targetNode
          && sourceNode.position && targetNode.position
          && !Number.isNaN(sourceNode.position.x) && !Number.isNaN(sourceNode.position.y)
          && !Number.isNaN(targetNode.position.x) && !Number.isNaN(targetNode.position.y)
      })
      .map((edge) => {
        // const sourceNode = nodes.find(n => n.id === edge.sourceNodeId)
        // const targetNode = nodes.find(n => n.id === edge.targetNodeId)

        const sourceNode = nodeStates.get(edge.sourceNodeId)
        const targetNode = nodeStates.get(edge.targetNodeId)
        const sourcePort = ports[`${edge.sourceNodeId}-${edge.sourcePortId}`]
        const targetPort = ports[`${edge.targetNodeId}-${edge.targetPortId}`]

        if (!sourcePort || !targetPort) {
          return null
        }

        const config = sourcePort.getConfig()
        const edgeColor = config.ui?.bgColor ?? 'currentColor'

        let shouldAnimate = false
        let edgeStyle = EDGE_STYLES.DEFAULT
        let edgeType = 'default'

        const isHighlighted = highlightedEdgeId && highlightedEdgeId.includes(edge.edgeId)
        const isSourceHighlighted = highlightedNodeId && highlightedNodeId.includes(edge.sourceNodeId)
        const isTargetHighlighted = highlightedNodeId && highlightedNodeId.includes(edge.targetNodeId)
        const hasHighlightes = highlightedEdgeId || highlightedNodeId

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

        if (hasHighlightes) {
          if (highlightedNodeId) {
            if (isSourceHighlighted || isTargetHighlighted) {
              // edgeType = 'default'
              edgeStyle = EDGE_STYLES.HIGHLIGHTED
            } else {
              edgeType = 'default'
              edgeStyle = EDGE_STYLES.DIMMED
            }
          }

          if (highlightedEdgeId) {
            if (highlightedEdgeId.includes(edge.edgeId)) {
              // edgeType = 'default'
              edgeStyle = EDGE_STYLES.HIGHLIGHTED
            } else {
              edgeType = 'default'
              edgeStyle = EDGE_STYLES.DIMMED
            }
          }
        }

        const rfEdge: Edge = {
          id: edge.edgeId,
          source: edge.sourceNodeId,
          target: edge.targetNodeId,
          sourceHandle: edge.sourcePortId,
          targetHandle: edge.targetPortId,
          type: edgeType,
          style: {
            stroke: edgeColor,
            strokeWidth: edgeStyle.strokeWidth,
            strokeOpacity: edgeStyle.strokeOpacity,
          },
          data: {
            animated: shouldAnimate,
          },
        }

        return rfEdge
      })
      .filter(Boolean) as Edge[]
  }, [edges, nodes, nodeStates, ports, highlightedEdgeId, highlightedNodeId])

  return reactFlowEdges
}
