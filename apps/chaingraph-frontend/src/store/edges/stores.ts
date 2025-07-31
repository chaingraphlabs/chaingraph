/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { INode, IPort } from '@badaitech/chaingraph-types'
import type { Edge, FinalConnectionState, HandleType } from '@xyflow/react'
import type { AddEdgeEventData, EdgeData, RemoveEdgeEventData } from './types'
import { edgesDomain, portsDomain } from '@/store/domains'
import { getDefaultPortCompatibilityChecker } from '@badaitech/chaingraph-types'
import { attach, combine, sample } from 'effector'
import { globalReset } from '../common'
import { $executionNodes, $executionState, $highlightedEdgeId, $highlightedNodeId } from '../execution'
import { $nodeLayerDepth, $nodes, $xyflowNodes } from '../nodes'
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

// event connection start
interface DraggingEdge {
  nodeId: string | null
  handleId: string | null
  handleType: HandleType | null
}

export const $isConnectingBeginEvent = edgesDomain.createEvent<DraggingEdge>()
export const $isConnectingEndEvent = edgesDomain.createEvent<FinalConnectionState>()

export const $draggingEdge = edgesDomain.createStore<DraggingEdge | null>(null)
  .on($isConnectingBeginEvent, (_, { nodeId, handleId, handleType }) => ({
    nodeId,
    handleId,
    handleType,
  }))
  .on($isConnectingEndEvent, () => null)
  .reset(resetEdges)
  .reset(globalReset)

export const $draggingEdgePort = edgesDomain.createStore<{
  draggingEdge: DraggingEdge | null
  draggingPort: IPort | null
} | null
>(null)
  .on($draggingEdge, (state, draggingEdge) => {
    if (!draggingEdge || !draggingEdge.nodeId || !draggingEdge.handleId) {
      return null
    }

    const node = $nodes.getState()[draggingEdge.nodeId]
    if (!node) {
      console.warn(`Node with ID ${draggingEdge.nodeId} not found while getting dragging edge port.`)
      return null
    }

    const draggingPort = node.getPort(draggingEdge.handleId)
    if (!draggingPort) {
      console.warn(`Port with ID ${draggingEdge.handleId} not found in node ${draggingEdge.nodeId} while getting dragging edge port.`)
      return null
    }

    return {
      draggingEdge,
      draggingPort,
    }
  })

export const $compatiblePortsToDraggingEdge = portsDomain.createStore<string[] | null>(null)
  .on($draggingEdgePort, (state, draggingEdgePort) => {
    if (!draggingEdgePort || !draggingEdgePort.draggingPort || !draggingEdgePort.draggingEdge) {
      // No dragging port or edge, return empty array
      return null
    }

    const draggingPortDirection = draggingEdgePort.draggingEdge?.handleType
    const draggingPort = draggingEdgePort.draggingPort

    const compatiblePorts: string[] = []

    const checker = getDefaultPortCompatibilityChecker()

    // iterate over all ports and find compatible ones
    const nodes = Object.values($nodes.getState())

    if (!nodes || nodes.length === 0) {
      return null
    }

    nodes.forEach((node) => {
      for (const port of Array.from(node.ports.values())) {
        // Skip if the port is not in the correct direction for the dragging port
        if (draggingPortDirection === 'source' && (port.getConfig().direction !== 'input' && port.getConfig().direction !== 'passthrough')) {
          continue
        }

        if (draggingPortDirection === 'target' && (port.getConfig().direction !== 'output' && port.getConfig().direction !== 'passthrough')) {
          continue
        }

        // Skip if the port same node as the dragging port
        if (port.getConfig().nodeId === draggingPort.getConfig().nodeId) {
          continue
        }

        // Skip if the port is not compatible with the dragging port
        if (!checker.canConnect(draggingPort, port)) {
          continue
        }

        // Skip if the port is the same as the dragging port
        if (port.id === draggingPort.id) {
          continue
        }

        compatiblePorts.push(port.id)
      }
    })

    return compatiblePorts
  })

export const $isConnecting = edgesDomain.createStore<boolean>(false)
  .on($isConnectingBeginEvent, () => true)
  .on($isConnectingEndEvent, () => false)
  .reset(resetEdges)
  .reset(globalReset)

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
  $nodeLayerDepth,
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

        const sourceINode = sourceNode.data?.node as INode
        const targetINode = targetNode.data?.node as INode

        const sourcePort = sourceINode.getPort(edge.sourcePortId)
        const targetPort = targetINode.getPort(edge.targetPortId)
        if (!sourcePort || !targetPort) {
          return null
        }

        const sourcePortConfig = sourcePort.getConfig()
        const edgeColor = sourcePortConfig.ui?.bgColor ?? 'currentColor'

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

        // edge zIndex is determined by the max zIndex of source and target nodes
        const sourceZIndex = $nodeLayerDepth[sourceNode.id] ?? 0
        const targetZIndex = $nodeLayerDepth[targetNode.id] ?? 0
        const zIndex = Math.max(sourceZIndex, targetZIndex) + 1

        // Create final edge with all computed styling
        const reactFlowEdge: Edge = {
          id: edge.edgeId,
          source: edge.sourceNodeId,
          target: edge.targetNodeId,
          sourceHandle: edge.sourcePortId,
          targetHandle: edge.targetPortId,
          type: edgeType,
          zIndex,
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
