/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { Connection } from '@badaitech/chaingraph-types'
import { useStoreMap, useUnit } from 'effector-react'
import { $nodes } from '@/store/nodes/stores'
import { $migrationMode } from '../feature-flags'
import { $portConnections } from '../stores'
import { isDeepEqual, toPortKey } from '../utils'

/**
 * Hook to get port connections - subscribes only to this specific port's connections
 * Only re-renders when THIS port's connections change
 *
 * Uses deep equality for connection arrays
 *
 * Migration-aware: Routes to granular stores or legacy $nodes based on $migrationMode
 *
 * @param nodeId - The node ID
 * @param portId - The port ID
 * @returns Array of connections, or empty array if none
 */
export function usePortConnections(nodeId: string, portId: string): Connection[] {
  const portKey = toPortKey(nodeId, portId)

  // Read from granular stores
  return useStoreMap({
    store: $portConnections,
    keys: [portKey],
    fn: (connections, [key]) => connections.get(key) || [],
    updateFilter: (prev, next) => !isDeepEqual(prev, next),
  })
}
