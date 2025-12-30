/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { PortKey } from '../types'
import { isDeepEqual } from '@badaitech/chaingraph-types'
import { useStoreMap } from 'effector-react'
import { $portHierarchy } from '../stores'
import { fromPortKey, toPortKey } from '../utils'

/**
 * Hook to get child port IDs for a given parent port
 *
 * Queries the $portHierarchy store to find all child ports
 * of the specified parent port.
 *
 * @param nodeId - The node ID
 * @param parentPortId - The parent port ID
 * @returns Array of child port IDs (just the ID strings, not full PortKeys)
 *
 * @example
 * ```typescript
 * // For a parent port 'myArrayPort' with children 'myArrayPort.0', 'myArrayPort.1'
 * const childPortIds = useChildPorts('node123', 'myArrayPort')
 * // Returns: ['myArrayPort[0]', 'myArrayPort[1]']
 *
 * // Then use with PortComponent:
 * {childPortIds.map(portId => (
 *   <PortComponent key={portId} nodeId={nodeId} portId={portId} context={context} />
 * ))}
 * ```
 */
export function useChildPorts(nodeId: string, parentPortId: string): string[] {
  const portKey = toPortKey(nodeId, parentPortId)

  const result = useStoreMap({
    store: $portHierarchy,
    keys: [portKey],
    fn: (hierarchy, [key]) => {
      const children = hierarchy.children.get(key as PortKey)
      if (!children)
        return []

      // Convert PortKeys back to port IDs (with error handling)
      const portIds: string[] = []
      for (const childKey of children) {
        try {
          const { portId } = fromPortKey(childKey)
          portIds.push(portId)
        } catch (error) {
          console.error(`[useChildPorts] Invalid childKey in hierarchy: ${childKey}`, error)
          // Skip malformed keys instead of crashing
        }
      }
      return portIds
    },
    updateFilter: (prev, next) => !isDeepEqual(prev, next),
  })

  // if (result.length > 0) {
  // console.log(`[PortsV2/Hook] useChildPorts(${nodeId}:${parentPortId}) → ${result.length} children`, result)
  // }

  return result
}
