/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { PortUIState } from '../types'
import { useStoreMap } from 'effector-react'
import { $portUI } from '../stores'
import { isDeepEqual, toPortKey } from '../utils'

/**
 * Hook to get port UI state - subscribes only to this specific port's UI
 * Only re-renders when THIS port's UI state changes (collapsed, hidden, etc.)
 *
 * Uses deep equality for nested UI objects (markdownStyles, htmlStyles, etc.)
 *
 * @param nodeId - The node ID
 * @param portId - The port ID
 * @returns The port's UI state, or empty object if not found
 */
export function usePortUI(nodeId: string, portId: string): PortUIState {
  const portKey = toPortKey(nodeId, portId)

  // ALWAYS use granular stores
  return useStoreMap({
    store: $portUI,
    keys: [portKey],
    fn: (uiMap, [key]) => uiMap.get(key) || {},
    updateFilter: (prev, next) => !isDeepEqual(prev, next),
  })
}
