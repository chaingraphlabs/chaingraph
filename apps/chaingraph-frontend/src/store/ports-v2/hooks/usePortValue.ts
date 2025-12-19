/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import { useStoreMap } from 'effector-react'
import { $portValues } from '../stores'
import { isDeepEqual, toPortKey } from '../utils'

/**
 * Hook to get port value - subscribes only to this specific port's value
 * Ultra-granular: only re-renders when THIS port's value changes
 *
 * Uses deep equality to handle object/array values correctly
 *
 * @param nodeId - The node ID
 * @param portId - The port ID
 * @returns The port's current value, or undefined if not found
 */
export function usePortValue(nodeId: string, portId: string): unknown | undefined {
  const portKey = toPortKey(nodeId, portId)

  // ALWAYS use granular stores
  return useStoreMap({
    store: $portValues,
    keys: [portKey],
    fn: (values, [key]) => values.get(key),
    updateFilter: (prev, next) => !isDeepEqual(prev, next),
  })
}
