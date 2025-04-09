/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { INode } from '@badaitech/chaingraph-types'
import type { Edge } from '@xyflow/react'
import { $edges } from '@/store'
import { $executionState, $highlightedEdgeId, $highlightedNodeId } from '@/store/execution'
import { $executionNodes } from '@/store/execution/stores'
import { $xyflowNodes } from '@/store/nodes/xyflow-nodes'
import { combine } from 'effector'

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
 * Store that directly computes XYFlow-compatible edges from the internal stores
 * Separates base edge structure (which rarely changes) from styling (which changes more often)
 */
export const $xyflowEdges = combine(
  $edges,
  $xyflowNodes,
  $executionNodes,
  $executionState,
  $highlightedNodeId,
  $highlightedEdgeId,
  (
    storeEdges,
    nodes,
    // ports,
    executionNodes,
    // activeFlowMetadata,
    executionState,
    highlightedNodeId,
    highlightedEdgeId,
  ) => {
    const { executionId } = executionState

    // Filter valid edges (with existing source and target nodes)
    const filteredEdges = storeEdges
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

        const sourcePort = (sourceNode.data?.node as INode).getPort(edge.sourcePortId)
        const targetPort = (targetNode.data?.node as INode).getPort(edge.targetPortId)
        if (!sourcePort || !targetPort) {
          return null
        }

        const config = sourcePort.getConfig()
        const edgeColor = config.ui?.bgColor ?? 'currentColor'

        // Get execution state for this edge's target node
        const targetNodeExecution = executionNodes[edge.targetNodeId]

        // Determine edge styling based on execution state and highlighting
        let shouldAnimate = false
        let edgeStyle = EDGE_STYLES.DEFAULT
        let edgeType = 'default'

        const isHighlighted = highlightedEdgeId && highlightedEdgeId.includes(edge.edgeId)
        const isSourceHighlighted = highlightedNodeId && highlightedNodeId.includes(edge.sourceNodeId)
        const isTargetHighlighted = highlightedNodeId && highlightedNodeId.includes(edge.targetNodeId)
        const hasHighlights = highlightedEdgeId || highlightedNodeId

        if (targetPort && targetPort.isSystem() && !targetPort.isSystemError()) {
          edgeType = 'flow'
          shouldAnimate = false
          edgeStyle = EDGE_STYLES.DEFAULT
        }

        if (targetNodeExecution && (
          targetNodeExecution.status === 'running'
          || targetNodeExecution.status === 'completed'
          || targetNodeExecution.status === 'failed'
        )) {
          edgeType = 'flow'
          shouldAnimate = targetPort.isSystem() && !targetPort.isSystemError()
          edgeStyle = EDGE_STYLES.HIGHLIGHTED
        }

        if (targetNodeExecution && targetNodeExecution.status === 'skipped') {
          edgeType = 'default'
          shouldAnimate = false
          edgeStyle = EDGE_STYLES.DIMMED
        }

        if (targetNodeExecution && targetNodeExecution.status === 'failed') {
          edgeType = 'flow'
          shouldAnimate = targetPort.isSystem() && !targetPort.isSystemError()
          edgeStyle = EDGE_STYLES.DEFAULT
        }

        if (targetNodeExecution && targetNodeExecution.status === 'running') {
          edgeType = 'flow'
          shouldAnimate = (targetPort.isSystem() && !targetPort.isSystemError()) || targetPort.getConfig().type === 'stream'
          edgeStyle = EDGE_STYLES.HIGHLIGHTED
        }

        if (executionId && (targetNodeExecution && (targetNodeExecution.status === 'idle' || !targetNodeExecution.status))) {
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
            if (highlightedEdgeId.includes(edge.edgeId)) {
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

        // Create final edge with all computed styling
        const reactFlowEdge: Edge = {
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
            edgeData: edge,
            sourcePortId: edge.sourcePortId,
            targetPortId: edge.targetPortId,
            version: `${(sourceNode.data?.node as any).getVersion()}_${(targetNode.data?.node as any).getVersion()}`,
          },
        }

        return reactFlowEdge
      })
      .filter(Boolean) as Edge[]

    return filteredEdges
  },
)
