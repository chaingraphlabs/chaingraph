/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { PortType } from '@badaitech/chaingraph-types'
import { useStoreMap } from 'effector-react'
import { $portConfigs } from '../stores'
import { toPortKey } from '../utils'

/**
 * Granular hook for port type. Subscribes only to the `type` field so
 * components that merely need dispatch logic avoid re-rendering on
 * unrelated config updates.
 */
export function usePortType(nodeId: string, portId: string): PortType | undefined {
  const portKey = toPortKey(nodeId, portId)

  return useStoreMap({
    store: $portConfigs,
    keys: [portKey],
    fn: (configs, [key]) => configs.get(key)?.type,
    updateFilter: (prev, next) => prev !== next,
  })
}
