/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { INode } from '@badaitech/chaingraph-types'
import type { Edge } from '@xyflow/react'
import type { AddEdgeEventData, EdgeData, RemoveEdgeEventData } from './types'
import { edgesDomain } from '@/store/domains'
import { attach, combine, sample } from 'effector'
import { globalReset } from '../common'
import { $executionNodes, $executionState, $highlightedEdgeId, $highlightedNodeId } from '../execution'
import { $xyflowNodes } from '../nodes'
import { $trpcClient } from '../trpc/store'
import { EDGE_STYLES } from './consts'

// EVENTS

export const removeEdge = edgesDomain.createEvent<RemoveEdgeEventData>()
export const setEdges = edgesDomain.createEvent<EdgeData[]>()
export const setEdge = edgesDomain.createEvent<EdgeData>()
export const resetEdges = edgesDomain.createEvent()

export const requestAddEdge = edgesDomain.createEvent<AddEdgeEventData>()
export const requestRemoveEdge = edgesDomain.createEvent<RemoveEdgeEventData>()

// EFFECTS
const addEdgeFx = attach({
  source: $trpcClient,
  effect: async (client, event: AddEdgeEventData) => {
    if (!client) {
      throw new Error('TRPC client is not initialized')
    }
    return client.flow.connectPorts.mutate({
      flowId: event.flowId,
      sourceNodeId: event.sourceNodeId,
      sourcePortId: event.sourcePortId,
      targetNodeId: event.targetNodeId,
      targetPortId: event.targetPortId,
      metadata: event.metadata,
    })
  },
})

const removeEdgeFx = attach({
  source: $trpcClient,
  effect: async (client, event: RemoveEdgeEventData) => {
    if (!client) {
      throw new Error('TRPC client is not initialized')
    }
    return client.flow.removeEdge.mutate({
      flowId: event.flowId,
      edgeId: event.edgeId,
    })
  },
})

// STORES
export const $edges = edgesDomain.createStore<EdgeData[]>([])
  .on(setEdges, (source, edges) => [
    ...source,
    ...edges,
  ])
  .on(setEdge, (edges, edge) => [
    ...edges,
    { ...edge },
  ])
  .on(removeEdge, (edges, event) => edges.filter(
    edge => edge.edgeId !== event.edgeId,
  ))
  .reset(resetEdges)
  .reset(globalReset)
  // .reset(clearActiveFlow)

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
        if (executionId && (!targetNodeExecution)) {
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

// SAMPLES

sample({
  clock: requestAddEdge,
  target: addEdgeFx,
})

sample({
  clock: requestRemoveEdge,
  target: removeEdgeFx,
})

// Handle successful edge additions
sample({
  clock: addEdgeFx.doneData,
  target: [], // Add any additional targets for successful edge creation
})

// Handle successful edge removals
sample({
  clock: removeEdgeFx.doneData,
  target: [], // Add any additional targets for successful edge removal
})
