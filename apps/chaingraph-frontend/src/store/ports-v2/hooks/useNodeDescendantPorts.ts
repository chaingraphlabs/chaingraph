/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import { useStoreMap } from 'effector-react'
import { $portDescendants } from '../descendants'
import { fromPortKey, isDeepEqual, toPortKey } from '../utils'

/**
 * Gets ALL descendant ports for a node or specific port
 *
 * Reads from pre-computed $portDescendants derived store (no traversal cost).
 *
 * Use cases:
 * - **Port collapsing**: `useNodeDescendantPorts(nodeId, portId)` → that port's descendants
 * - **Node collapsing (future)**: `useNodeDescendantPorts(nodeId)` → all port descendants in the node
 *
 * Performance:
 * - Reads from pre-computed $portDescendants store (zero traversal cost)
 * - Uses granular useStoreMap (only re-renders when descendants change)
 * - O(1) lookup for port-level, O(n) aggregation for node-level
 *
 * @param nodeId - Node ID
 * @param portId - Optional port ID. If provided, returns that port's descendants. If omitted, returns all node descendants.
 * @returns Array of descendant port IDs (flattened, recursive)
 *
 * @example
 * ```typescript
 * // Port-level (for collapsed object/array port)
 * const descendants = useNodeDescendantPorts('node1', 'myObject')
 * // Returns: ['myObject.field1', 'myObject.field2', 'myObject.field2.nested', ...]
 *
 * // Node-level (future: for collapsed node body)
 * const allDescendants = useNodeDescendantPorts('node1')
 * // Returns: ALL descendant ports from all root ports
 * ```
 */
export function useNodeDescendantPorts(
  nodeId: string,
  portId?: string,
): string[] {
  return useStoreMap({
    store: $portDescendants,
    keys: [nodeId, portId || ''],
    fn: (descendants, [nId, pId]) => {
      if (pId) {
        // Port-specific descendants (O(1) lookup)
        const portKey = toPortKey(nId, pId)
        return descendants.get(portKey) || []
      }

      // Node-level: aggregate ALL descendants from all root ports (O(n) aggregation)
      const allDescendants: string[] = []
      for (const [parentKey, portIds] of descendants) {
        const { nodeId: keyNodeId } = fromPortKey(parentKey)
        if (keyNodeId === nId) {
          allDescendants.push(...portIds)
        }
      }
      return allDescendants
    },
    updateFilter: (prev, next) => !isDeepEqual(prev, next),
  })
}
