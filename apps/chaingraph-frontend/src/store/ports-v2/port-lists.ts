/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { PortConfigFull, PortKey } from './types'
import { sample } from 'effector'
import { trace } from '@/lib/perf-trace'
import { $flowInitMode, flowInitEnded } from '@/store/domains'
import { portsV2Domain } from './domain'
import { $portConfigs } from './stores'
import { fromPortKey, isSystemErrorPort, isSystemPort } from './utils'

/**
 * Port ID lists for a single node, categorized by direction and type
 */
export interface NodePortLists {
  /** Regular input ports (excludes system ports and child ports) */
  inputPortIds: string[]
  /** Regular output ports (excludes system ports and child ports) */
  outputPortIds: string[]
  /** Passthrough ports (bidirectional data flow) */
  passthroughPortIds: string[]

  // Specific system ports (pre-computed to avoid iteration in components)
  /** System flow input port ID (direction === 'input') */
  flowInputPortId: string | null
  /** System flow output port ID (direction === 'output') */
  flowOutputPortId: string | null

  // Specific error ports (pre-computed by key)
  /** Error port ID (key === '__error') */
  errorPortId: string | null
  /** Error message port ID (key === '__errorMessage') */
  errorMessagePortId: string | null
}

/**
 * Compute port lists from port configs
 * Extracted to a pure function for reuse in both normal and init-end paths
 */
function computeNodePortLists(configs: Map<PortKey, PortConfigFull>): Record<string, NodePortLists> {
  const spanId = trace.start('derived.nodePortLists', {
    category: 'store',
    tags: { configCount: configs.size },
  })
  const lists: Record<string, NodePortLists> = {}

  for (const [portKey, config] of configs.entries()) {
    const { nodeId, portId } = fromPortKey(portKey as PortKey)

    // Initialize node entry if doesn't exist
    if (!lists[nodeId]) {
      lists[nodeId] = {
        inputPortIds: [],
        outputPortIds: [],
        passthroughPortIds: [],
        flowInputPortId: null,
        flowOutputPortId: null,
        errorPortId: null,
        errorMessagePortId: null,
      }
    }

    // Skip child ports (only root-level ports for iteration)
    // Child ports have parentId set (e.g., 'inputMessage.role' has parentId 'inputMessage')
    if (config.parentId) {
      continue
    }

    // Categorize by system type first
    // Use type guards instead of unsafe casts
    const isSys = isSystemPort(config)
    const isSysErr = isSystemErrorPort(config)

    if (isSys && !isSysErr) {
      // System flow ports - identify by direction
      if (config.direction === 'input') {
        lists[nodeId].flowInputPortId = portId
      } else if (config.direction === 'output') {
        lists[nodeId].flowOutputPortId = portId
      }
    } else if (isSysErr) {
      // Error handling ports - identify by key
      if (config.key === '__error') {
        lists[nodeId].errorPortId = portId
      } else if (config.key === '__errorMessage') {
        lists[nodeId].errorMessagePortId = portId
      }
    } else {
      // Regular data ports - categorize by direction
      if (config.direction === 'input' && config.metadata?.isSystemPort !== true) {
        lists[nodeId].inputPortIds.push(portId)
      } else if (config.direction === 'output' && config.metadata?.isSystemPort !== true) {
        lists[nodeId].outputPortIds.push(portId)
      } else if (config.direction === 'passthrough' && config.metadata?.isSystemPort !== true) {
        lists[nodeId].passthroughPortIds.push(portId)
      }
    }
  }

  trace.end(spanId)
  return lists
}

// Event to set port lists
const setNodePortLists = portsV2Domain.createEvent<Record<string, NodePortLists>>()

/**
 * Derived store: Builds port ID arrays from $portConfigs
 *
 * CRITICAL: This replaces node.getInputs()/getOutputs() iteration.
 * Components use this instead of INode methods to avoid circular dependency
 * between port configs and node instances.
 *
 * PERFORMANCE OPTIMIZATION:
 * During flow initialization ($flowInitMode === true), this expensive O(N)
 * computation is SKIPPED. Instead, it runs ONCE at FlowInitEnd.
 * This prevents cascading rebuilds when 10,000+ ports are loaded.
 *
 * Benefits:
 * - No INode instance needed for rendering
 * - Automatic reactivity when ports are added/removed
 * - Synchronized with $portConfigs (edges wait for same signal)
 * - Guarantees handles render before edges connect
 *
 * Usage in components:
 * ```typescript
 * const renderData = useXYFlowNodeRenderData(nodeId)
 * const inputPortIds = renderData.inputPortIds  // From this store!
 *
 * return inputPortIds.map(portId => (
 *   <PortComponent key={portId} nodeId={nodeId} portId={portId} />
 * ))
 * ```
 *
 * @returns Map of nodeId → NodePortLists
 */
export const $nodePortLists = portsV2Domain
  .createStore<Record<string, NodePortLists>>({})
  .on(setNodePortLists, (_, lists) => lists)

// ============================================================================
// WIRING: Skip during init, rebuild at end
// ============================================================================

/**
 * Normal path: Compute port lists when $portConfigs changes
 * SKIP if $flowInitMode is true (will rebuild at flowInitEnded)
 */
sample({
  clock: $portConfigs,
  source: $flowInitMode,
  filter: isInit => !isInit, // Only compute when NOT initializing
  fn: (_, configs) => computeNodePortLists(configs),
  target: setNodePortLists,
})

/**
 * Init end path: Force rebuild when flow initialization completes
 * This is the ONE rebuild that happens instead of many during init
 */
sample({
  clock: flowInitEnded,
  source: $portConfigs,
  fn: configs => computeNodePortLists(configs),
  target: setNodePortLists,
})
