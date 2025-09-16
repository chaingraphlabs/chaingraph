/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { EdgeData } from '@/store/edges/types'
import {
  addFieldObjectPort,
  appendElementArrayPort,
  removeElementArrayPort,
  removeFieldObjectPort,
  requestUpdatePortUI,
  requestUpdatePortValue,
  updateItemConfigArrayPort,
} from '@/store/ports'
import { combine, createEvent, createStore } from 'effector'
import { $nodePortEdgesMap } from './port-edges'

export interface PortOperations {
  updatePortValue: (params: {
    nodeId: string
    portId: string
    value: any
  }) => void
  updatePortUI: (params: {
    nodeId: string
    portId: string
    ui: any
  }) => void
  addFieldObjectPort: (params: {
    nodeId: string
    portId: string
    config: any
    key: string
  }) => void
  removeFieldObjectPort: (params: {
    nodeId: string
    portId: string
    key: string
  }) => void
  updateItemConfigArrayPort: (params: {
    nodeId: string
    portId: string
    itemConfig: any
  }) => void
  appendElementArrayPort: (params: {
    nodeId: string
    portId: string
    value: any
  }) => void
  removeElementArrayPort: (params: {
    nodeId: string
    portId: string
    index: number
  }) => void
  getEdgesForPort: (portId: string) => EdgeData[]
}

export interface NodePortContext {
  nodeId: string
  operations: PortOperations
  edgesForPorts: Record<string, EdgeData[]>
}

// Events for port operations (these will be connected to actual operations via sample)
export const portValueUpdateRequested = createEvent<{
  nodeId: string
  portId: string
  value: any
}>()

export const portUIUpdateRequested = createEvent<{
  nodeId: string
  portId: string
  ui: any
}>()

export const fieldObjectPortAddRequested = createEvent<{
  nodeId: string
  portId: string
  config: any
  key: string
}>()

export const fieldObjectPortRemoveRequested = createEvent<{
  nodeId: string
  portId: string
  key: string
}>()

export const itemConfigArrayPortUpdateRequested = createEvent<{
  nodeId: string
  portId: string
  itemConfig: any
}>()

export const elementArrayPortAppendRequested = createEvent<{
  nodeId: string
  portId: string
  value: any
}>()

export const elementArrayPortRemoveRequested = createEvent<{
  nodeId: string
  portId: string
  index: number
}>()

// Connect events to actual operations
portValueUpdateRequested.watch(params => requestUpdatePortValue(params))
portUIUpdateRequested.watch(params => requestUpdatePortUI(params))
fieldObjectPortAddRequested.watch(params => addFieldObjectPort({
  nodeId: params.nodeId,
  portId: params.portId,
  config: params.config,
  key: params.key,
}))
fieldObjectPortRemoveRequested.watch(params => removeFieldObjectPort({
  nodeId: params.nodeId,
  portId: params.portId,
  key: params.key,
}))
itemConfigArrayPortUpdateRequested.watch(params => updateItemConfigArrayPort({
  nodeId: params.nodeId,
  portId: params.portId,
  itemConfig: params.itemConfig,
}))
elementArrayPortAppendRequested.watch(params => appendElementArrayPort({
  nodeId: params.nodeId,
  portId: params.portId,
  value: params.value,
}))
elementArrayPortRemoveRequested.watch(params => removeElementArrayPort({
  nodeId: params.nodeId,
  portId: params.portId,
  index: params.index,
}))

// Store for stable operations references
// This store contains factory functions that create operations for specific nodes
export const $nodeOperationsFactory = createStore<() => PortOperations>(() => ({
  updatePortValue: (params: { nodeId: string, portId: string, value: any }) => {
    portValueUpdateRequested(params)
  },
  updatePortUI: (params: { nodeId: string, portId: string, ui: any }) => {
    portUIUpdateRequested(params)
  },
  addFieldObjectPort: (params: { nodeId: string, portId: string, config: any, key: string }) => {
    fieldObjectPortAddRequested(params)
  },
  removeFieldObjectPort: (params: { nodeId: string, portId: string, key: string }) => {
    fieldObjectPortRemoveRequested(params)
  },
  updateItemConfigArrayPort: (params: { nodeId: string, portId: string, itemConfig: any }) => {
    itemConfigArrayPortUpdateRequested(params)
  },
  appendElementArrayPort: (params: { nodeId: string, portId: string, value: any }) => {
    elementArrayPortAppendRequested(params)
  },
  removeElementArrayPort: (params: { nodeId: string, portId: string, index: number }) => {
    elementArrayPortRemoveRequested(params)
  },
  getEdgesForPort: (_portId: string): EdgeData[] => [], // This will be overridden per node
}))

/**
 * Computed port contexts for all nodes
 * Creates context objects with operations and edges data
 */
export const $nodePortContexts = combine(
  $nodePortEdgesMap,
  $nodeOperationsFactory,
  (portEdgesMap, operationsFactory) => {
    const contexts: Record<string, NodePortContext> = {}

    // Cache for operations per node to maintain stable references
    const operationsCache = new Map<string, PortOperations>()

    Object.keys(portEdgesMap).forEach((nodeId) => {
      const nodePortEdges = portEdgesMap[nodeId]

      // Get or create operations for this node
      let operations = operationsCache.get(nodeId)
      if (!operations) {
        const baseOperations = operationsFactory()

        // Override getEdgesForPort with node-specific implementation
        operations = {
          ...baseOperations,
          getEdgesForPort: (portId: string) => {
            return nodePortEdges[portId] || []
          },
        }

        operationsCache.set(nodeId, operations)
      }

      contexts[nodeId] = {
        nodeId,
        operations,
        edgesForPorts: nodePortEdges || {},
      }
    })

    return contexts
  },
)

/**
 * Store that provides a stable reference map for port contexts
 * This helps prevent unnecessary re-renders by maintaining reference equality
 */
export const $stableNodePortContexts = combine(
  $nodePortContexts,
  (contexts) => {
    // Create a version key based on the structure to detect actual changes
    const contextKeys = Object.keys(contexts).sort().join(',')

    return {
      contexts,
      version: contextKeys, // This changes only when nodes are added/removed
    }
  },
)
