/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { PortKey } from './types'
import { $portConfigs } from './stores'
import { trace } from '@/lib/perf-trace'
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
 * Derived store: Builds port ID arrays from $portConfigs
 *
 * CRITICAL: This replaces node.getInputs()/getOutputs() iteration.
 * Components use this instead of INode methods to avoid circular dependency
 * between port configs and node instances.
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
export const $nodePortLists = $portConfigs.map((configs): Record<string, NodePortLists> => {
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
})
