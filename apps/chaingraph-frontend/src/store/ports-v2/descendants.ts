/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { PortKey } from './types'
import { $portHierarchy } from './stores'
import { fromPortKey } from './utils'

const MAX_DEPTH = 20

/**
 * BFS traversal to get ALL descendants (recursive)
 *
 * @param rootKey - The parent port key to start traversal from
 * @param hierarchy - The port hierarchy structure
 * @returns Flat array of all descendant port IDs
 */
function getAllDescendants(
  rootKey: PortKey,
  hierarchy: { children: Map<PortKey, Set<PortKey>> },
): string[] {
  const descendants: string[] = []
  const visited = new Set<PortKey>()
  const queue: PortKey[] = [rootKey]
  let depth = 0

  while (queue.length > 0 && depth < MAX_DEPTH) {
    const current = queue.shift()!

    // Cycle detection
    if (visited.has(current)) {
      console.warn(`[PortDescendants] Cycle detected at ${current}`)
      continue
    }
    visited.add(current)

    const children = hierarchy.children.get(current)
    if (children) {
      for (const childKey of children) {
        try {
          const { portId } = fromPortKey(childKey)
          descendants.push(portId)
          queue.push(childKey) // Continue recursive traversal
        } catch (error) {
          console.error(`[PortDescendants] Invalid childKey: ${childKey}`, error)
        }
      }
    }

    depth++
  }

  return descendants
}

/**
 * Derived store: Pre-computed descendants for ALL ports
 *
 * Automatically updates when $portHierarchy changes.
 * Uses Effector's .map() for single-source derivation.
 *
 * Structure: Map<PortKey, string[]>
 * - Key: Parent port key
 * - Value: Array of ALL descendant port IDs (recursive, flattened)
 *
 * Performance:
 * - Computed ONCE when hierarchy changes (not per component render)
 * - Components just read via useStoreMap (O(1) lookup)
 * - Memory efficient: Only stores ports that have descendants
 *
 * Usage:
 * ```typescript
 * // In hooks:
 * const descendants = useStoreMap({
 *   store: $portDescendants,
 *   keys: [portKey],
 *   fn: (map, [key]) => map.get(key) || []
 * })
 * ```
 */
export const $portDescendants = $portHierarchy.map((hierarchy): Map<PortKey, string[]> => {
  const result = new Map<PortKey, string[]>()

  // For each port that has children, compute all descendants
  for (const [parentKey] of hierarchy.children) {
    const descendants = getAllDescendants(parentKey, hierarchy)
    if (descendants.length > 0) {
      result.set(parentKey, descendants)
    }
  }

  return result
})
