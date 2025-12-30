/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { PortKey } from './types'
import { combine } from 'effector'
import { $portDescendants } from './descendants'
import { $portConfigs, $portUI } from './stores'
import { fromPortKey, toPortKey } from './utils'

/**
 * Minimal data needed to render a collapsed handle
 *
 * Optimized for rendering performance - only 4 fields per handle
 */
export interface CollapsedHandleInfo {
  /** Port ID for key prop */
  portId: string
  /** config.id for XYFlow Handle component */
  configId: string
  /** Render input handle? (direction === 'input' || 'passthrough') */
  hasInput: boolean
  /** Render output handle? (direction === 'output' || 'passthrough') */
  hasOutput: boolean
}

/**
 * Derived store: Pre-computed handle data for ALL collapsed ports
 *
 * Combines 3 source stores:
 * - $portDescendants: Which ports have descendants (pre-computed recursively)
 * - $portUI: Which ports are collapsed
 * - $portConfigs: Direction info for handle rendering
 *
 * Structure: Map<PortKey, CollapsedHandleInfo[]>
 * - Key: Parent port key (the COLLAPSED port)
 * - Value: Array of handle info for ALL descendants
 *
 * Filters:
 * - Only includes ports that ARE collapsed (ui.collapsed === true)
 * - Only includes ports that HAVE descendants
 * - Extracts minimal data (4 fields per handle)
 *
 * Performance benefits:
 * - Computed ONCE when any source store changes
 * - Components read pre-computed arrays (zero traversal cost)
 * - Memory efficient (only stores collapsed ports, not all ports)
 * - Granular reactivity via useStoreMap in components
 *
 * Backward compatibility:
 * - `collapsed === true` means children are HIDDEN (historical inversion)
 *
 * Usage:
 * ```typescript
 * // In CollapsedPortHandles component:
 * const handleInfos = useStoreMap({
 *   store: $collapsedHandleData,
 *   keys: [portKey],
 *   fn: (data, [key]) => data.get(key) || []
 * })
 * ```
 */
export const $collapsedHandleData = combine({
  descendants: $portDescendants,
  configs: $portConfigs,
  ui: $portUI,
}, ({ descendants, configs, ui }): Map<PortKey, CollapsedHandleInfo[]> => {
  const result = new Map<PortKey, CollapsedHandleInfo[]>()

  // Iterate over all ports that have descendants
  for (const [parentKey, descendantPortIds] of descendants) {
    // Check if this port is collapsed
    const portUI = ui.get(parentKey)

    // BACKWARD COMPATIBLE: collapsed === true means children are VISIBLE (expanded)
    // So we only render hidden handles when collapsed is falsy (false or undefined)
    if (portUI?.collapsed === true) {
      continue // Skip expanded ports - their children have visible handles
    }

    // Build handle info for each descendant
    const handleInfos: CollapsedHandleInfo[] = []
    const { nodeId } = fromPortKey(parentKey)

    for (const portId of descendantPortIds) {
      const portKey = toPortKey(nodeId, portId)
      const config = configs.get(portKey)

      if (!config || !config.id)
        continue // Skip if config or config.id not found

      handleInfos.push({
        portId,
        configId: config.id,
        hasInput: config.direction === 'input' || config.direction === 'passthrough',
        hasOutput: config.direction === 'output' || config.direction === 'passthrough',
      })
    }

    if (handleInfos.length > 0) {
      result.set(parentKey, handleInfos)
    }
  }

  return result
})
