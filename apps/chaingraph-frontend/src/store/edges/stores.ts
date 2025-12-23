/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { IPort } from '@badaitech/chaingraph-types'
import type { Edge, FinalConnectionState, HandleType } from '@xyflow/react'
import type { AddEdgeEventData, EdgeData, EdgeRenderData, RemoveEdgeEventData } from './types'
import { getDefaultTransferEngine } from '@badaitech/chaingraph-types'
import { attach, sample } from 'effector'
import { trace } from '@/lib/perf-trace'
import { edgesDomain, portsDomain } from '@/store/domains'
import { globalReset } from '../common'
import { $executionNodes, $executionState, $highlightedEdgeId, $highlightedNodeId } from '../execution'
import { $nodeLayerDepth, $nodes } from '../nodes'
import { $portConfigs, $portUI, toPortKey } from '../ports-v2'
import { $trpcClient } from '../trpc/store'
import { $xyflowNodesList } from '../xyflow'
import { EDGE_STYLES } from './consts'
import { computeExecutionStyle, computeHighlightStyle, extractEdgeColor } from './utils'

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
  .on(setEdges, (source, edges) => {
    const spanId = trace.start('store.$edges.setEdges', {
      category: 'store',
      tags: { count: edges.length },
    })
    const result = [
      ...source,
      ...edges,
    ]
    trace.end(spanId)
    return result
  })
  .on(setEdge, (edges, edge) => {
    const spanId = trace.start('store.$edges.setEdge', { category: 'store' })
    const result = [
      ...edges,
      { ...edge },
    ]
    trace.end(spanId)
    return result
  })
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

const $draggingEdgePortUpdated = sample({
  source: $nodes,
  clock: $draggingEdge,
  fn: (nodes, draggingEdge) => {
    if (!draggingEdge || !draggingEdge.nodeId || !draggingEdge.handleId) {
      return null
    }

    const node = nodes[draggingEdge.nodeId]
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
  },
})

export const $draggingEdgePort = edgesDomain.createStore<{
  draggingEdge: DraggingEdge | null
  draggingPort: IPort | null
} | null
>(null)
  .on($draggingEdgePortUpdated, (_, draggingEdgePort) => draggingEdgePort)
  .reset(resetEdges)
  .reset(globalReset)

export const $compatiblePortsToDraggingEdge = portsDomain.createStore<string[] | null>(null)
  .on($draggingEdgePort, (state, draggingEdgePort) => {
    if (!draggingEdgePort || !draggingEdgePort.draggingPort || !draggingEdgePort.draggingEdge) {
      // No dragging port or edge, return empty array
      return null
    }

    const draggingPortDirection = draggingEdgePort.draggingEdge?.handleType
    const draggingPort = draggingEdgePort.draggingPort

    const compatiblePorts: string[] = []

    const engine = getDefaultTransferEngine()

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
        } else if (draggingPortDirection === 'target' && (port.getConfig().direction !== 'output' && port.getConfig().direction !== 'passthrough')) {
          continue
        }

        // Skip if the port same node as the dragging port
        if (port.getConfig().nodeId === draggingPort.getConfig().nodeId) {
          continue
        }

        // Skip if the port is the same as the dragging port
        if (port.id === draggingPort.id) {
          continue
        }

        // Skip if the port is not compatible with the dragging port
        if (draggingPortDirection === 'source' && !engine.canConnect(draggingPort, port)) {
          continue
        } else if (draggingPortDirection === 'target' && !engine.canConnect(port, draggingPort)) {
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

// ============================================================================
// EDGE RENDER MAP - GRANULAR DELTA UPDATES
// ============================================================================

/**
 * Event for surgical edge updates
 * Each wire (sample) targets this event with only the edges that changed
 */
export const edgeDataChanged = edgesDomain.createEvent<{
  changes: Array<{ edgeId: string, changes: Partial<EdgeRenderData> }>
}>()

/**
 * Helper: Create pending edge (not ready until ports arrive)
 */
function createPendingEdgeRenderData(edge: EdgeData): EdgeRenderData {
  return {
    edgeId: edge.edgeId,
    source: edge.sourceNodeId,
    target: edge.targetNodeId,
    sourceHandle: edge.sourcePortId,
    targetHandle: edge.targetPortId,
    isReady: false,
    color: 'currentColor',
    type: 'default',
    strokeWidth: EDGE_STYLES.DEFAULT.strokeWidth,
    strokeOpacity: EDGE_STYLES.DEFAULT.strokeOpacity,
    animated: false,
    zIndex: 0,
    version: 0,
    edgeData: edge,
  }
}

/**
 * Main edge render map store
 *
 * Stores EdgeRenderData per edge, updated via delta samples.
 * This replaces the monolithic $xyflowEdges combine.
 */
export const $edgeRenderMap = edgesDomain
  .createStore<Map<string, EdgeRenderData>>(new Map())

  // Structure: Add single edge (initially as "pending")
  .on(setEdge, (state, edge) => {
    const newState = new Map(state)
    newState.set(edge.edgeId, createPendingEdgeRenderData(edge))
    return newState
  })

  // Structure: Add multiple edges
  .on(setEdges, (state, edges) => {
    const newState = new Map(state)
    for (const edge of edges) {
      newState.set(edge.edgeId, createPendingEdgeRenderData(edge))
    }
    return newState
  })

  // Structure: Remove edge
  .on(removeEdge, (state, event) => {
    const newState = new Map(state)
    newState.delete(event.edgeId)
    return newState
  })

  // Delta: Surgical updates with structural sharing
  .on(edgeDataChanged, (state, { changes }) => {
    if (changes.length === 0)
      return state

    const newState = new Map(state)
    let hasChanges = false

    for (const { edgeId, changes: edgeChanges } of changes) {
      const current = newState.get(edgeId)
      if (!current)
        continue

      // Check if there are actual differences
      const needsUpdate = Object.entries(edgeChanges).some(
        ([key, value]) => current[key as keyof EdgeRenderData] !== value,
      )

      if (needsUpdate) {
        newState.set(edgeId, {
          ...current,
          ...edgeChanges,
          version: current.version + 1,
        })
        hasChanges = true
      }
    }

    return hasChanges ? newState : state
  })

  .reset(resetEdges)
  .reset(globalReset)

// ============================================================================
// WIRE 1: Port Configs + UI → isReady + Color
// ============================================================================
// CRITICAL: Edge color comes from $portUI (bgColor), NOT $portConfigs!
// CRITICAL: Also triggers when edges are added (in case ports already exist)

sample({
  clock: [$portConfigs, $portUI, $edgeRenderMap, $xyflowNodesList],
  source: {
    edgeMap: $edgeRenderMap,
    portConfigs: $portConfigs,
    portUI: $portUI,
    xyflowNodes: $xyflowNodesList,
  },
  fn: ({ edgeMap, portConfigs, portUI, xyflowNodes }) => {
    const changes: Array<{ edgeId: string, changes: Partial<EdgeRenderData> }> = []

    // Build node ID set for O(1) lookups
    const nodeIds = new Set(xyflowNodes.map(n => n.id))

    for (const [edgeId, edge] of edgeMap) {
      const sourceKey = toPortKey(edge.source, edge.sourceHandle)
      const targetKey = toPortKey(edge.target, edge.targetHandle)

      const sourceConfig = portConfigs.get(sourceKey)
      const targetConfig = portConfigs.get(targetKey)
      const sourceUI = portUI.get(sourceKey)
      const targetUI = portUI.get(targetKey)

      // Edge is ready when:
      // 1. Both port configs exist (handles can be rendered)
      // 2. Both XYFlow nodes exist (handles are in DOM)
      const hasPortConfigs = !!(sourceConfig && targetConfig)
      const hasNodes = nodeIds.has(edge.source) && nodeIds.has(edge.target)
      const isReady = hasPortConfigs && hasNodes

      // Compute new color
      const newColor = isReady && sourceConfig
        ? extractEdgeColor(sourceConfig, sourceUI, targetConfig, targetUI)
        : edge.color

      // Check if readiness or color changed
      if (edge.isReady !== isReady || (isReady && edge.color !== newColor)) {
        changes.push({
          edgeId,
          changes: {
            isReady,
            ...(isReady ? { color: newColor } : {}),
          },
        })
      }
    }

    return { changes }
  },
  target: edgeDataChanged,
})

// ============================================================================
// WIRE 2: Execution Nodes → Animation + Style
// ============================================================================

sample({
  clock: [$executionNodes, $executionState],
  source: {
    edgeMap: $edgeRenderMap,
    execNodes: $executionNodes,
    execState: $executionState,
    portConfigs: $portConfigs,
  },
  fn: ({ edgeMap, execNodes, execState, portConfigs }) => {
    const changes: Array<{ edgeId: string, changes: Partial<EdgeRenderData> }> = []

    for (const [edgeId, edge] of edgeMap) {
      if (!edge.isReady)
        continue

      const targetExec = execNodes[edge.target]
      const targetConfig = portConfigs.get(toPortKey(edge.target, edge.targetHandle))

      const { type, animated, strokeWidth, strokeOpacity } = computeExecutionStyle(
        targetExec,
        execState,
        targetConfig,
      )

      if (
        edge.type !== type
        || edge.animated !== animated
        || edge.strokeWidth !== strokeWidth
        || edge.strokeOpacity !== strokeOpacity
      ) {
        changes.push({
          edgeId,
          changes: { type, animated, strokeWidth, strokeOpacity },
        })
      }
    }

    return { changes }
  },
  target: edgeDataChanged,
})

// ============================================================================
// WIRE 3-4: Highlighting → Style
// ============================================================================

sample({
  clock: [$highlightedNodeId, $highlightedEdgeId],
  source: {
    edgeMap: $edgeRenderMap,
    highlightedNodes: $highlightedNodeId,
    highlightedEdges: $highlightedEdgeId,
  },
  fn: ({ edgeMap, highlightedNodes, highlightedEdges }) => {
    const changes: Array<{ edgeId: string, changes: Partial<EdgeRenderData> }> = []
    const hasHighlights = !!(highlightedNodes?.length || highlightedEdges?.length)

    for (const [edgeId, edge] of edgeMap) {
      if (!edge.isReady)
        continue

      const isConnected = highlightedNodes?.includes(edge.source) || highlightedNodes?.includes(edge.target)
      const isEdgeHighlighted = highlightedEdges?.includes(edgeId)

      const { strokeWidth, strokeOpacity } = computeHighlightStyle(
        hasHighlights,
        !!isConnected,
        !!isEdgeHighlighted,
      )

      if (edge.strokeWidth !== strokeWidth || edge.strokeOpacity !== strokeOpacity) {
        changes.push({
          edgeId,
          changes: { strokeWidth, strokeOpacity },
        })
      }
    }

    return { changes }
  },
  target: edgeDataChanged,
})

// ============================================================================
// WIRE 5: Node Layer Depth → zIndex
// ============================================================================

sample({
  clock: $nodeLayerDepth,
  source: { edgeMap: $edgeRenderMap, layerDepths: $nodeLayerDepth },
  fn: ({ edgeMap, layerDepths }) => {
    const changes: Array<{ edgeId: string, changes: Partial<EdgeRenderData> }> = []

    for (const [edgeId, edge] of edgeMap) {
      if (!edge.isReady)
        continue

      const sourceZ = layerDepths[edge.source] ?? 0
      const targetZ = layerDepths[edge.target] ?? 0
      const zIndex = Math.max(sourceZ, targetZ) + 1

      if (edge.zIndex !== zIndex) {
        changes.push({ edgeId, changes: { zIndex } })
      }
    }

    return { changes }
  },
  target: edgeDataChanged,
})

// ============================================================================
// $xyflowEdgesList - Final array for XYFlow
// ============================================================================

/**
 * Converts render map to array, filtering only ready edges.
 * This is the final store consumed by React components.
 */
export const $xyflowEdgesList = $edgeRenderMap.map((edgeMap): Edge[] => {
  const edges: Edge[] = []

  for (const renderData of edgeMap.values()) {
    // Skip edges that aren't ready (missing port configs)
    if (!renderData.isReady) {
      continue
    }

    edges.push({
      id: renderData.edgeId,
      source: renderData.source,
      target: renderData.target,
      sourceHandle: renderData.sourceHandle,
      targetHandle: renderData.targetHandle,
      type: renderData.type,
      zIndex: renderData.zIndex,
      style: {
        stroke: renderData.color,
        strokeWidth: renderData.strokeWidth,
        strokeOpacity: renderData.strokeOpacity,
      },
      data: {
        animated: renderData.animated,
        edgeData: renderData.edgeData,
        sourcePortId: renderData.sourceHandle,
        targetPortId: renderData.targetHandle,
        version: renderData.version,
      },
    })
  }

  return edges
})

/**
 * Backward compatibility alias
 * @deprecated Use $xyflowEdgesList directly
 */
export const $xyflowEdges = $xyflowEdgesList

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
