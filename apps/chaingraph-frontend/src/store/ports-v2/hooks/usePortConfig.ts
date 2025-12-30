/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { PortConfigFull } from '../types'
import { useStoreMap } from 'effector-react'
import { $portConfigs } from '../stores'
import { isDeepEqual, toPortKey } from '../utils'

/**
 * Hook to get port configuration - subscribes only to this specific port's config
 * Only re-renders when THIS port's configuration changes (type, constraints, etc.)
 *
 * Uses deep equality for configuration objects
 *
 * @param nodeId - The node ID
 * @param portId - The port ID
 * @returns The port's configuration, or undefined if not found
 */
export function usePortConfig(nodeId: string, portId: string): PortConfigFull | undefined {
  const portKey = toPortKey(nodeId, portId)

  // ALWAYS use granular stores
  return useStoreMap({
    store: $portConfigs,
    keys: [portKey],
    fn: (configs, [key]) => configs.get(key),
    updateFilter: (prev, next) => !isDeepEqual(prev, next),
  })
}
