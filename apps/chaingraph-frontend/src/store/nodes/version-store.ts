/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import { useStoreMap } from 'effector-react'
import { globalReset } from '../common'
import { nodesDomain } from '../domains'

/**
 * Event for version-only updates that should NOT trigger $nodes cascade
 * Used when backend sends node updates with only version changes (no metadata changes)
 */
export const setNodeVersionOnly = nodesDomain.createEvent<{
  nodeId: string
  version: number
}>()

/**
 * Granular version store - tracks node versions WITHOUT triggering $nodes updates
 * This prevents cascading re-renders when only version changes (e.g., port-only updates)
 */
export const $nodeVersions = nodesDomain.createStore<Record<string, number>>({})
  .on(setNodeVersionOnly, (state, { nodeId, version }) => {
    // Skip if version unchanged
    if (state[nodeId] === version) return state
    return { ...state, [nodeId]: version }
  })
  .reset(globalReset)

/**
 * Hook to get version for a specific node
 * Only re-renders when THIS node's version changes
 */
export function useNodeVersion(nodeId: string): number {
  return useStoreMap({
    store: $nodeVersions,
    keys: [nodeId],
    fn: (versions, [id]) => versions[id] ?? 0,
  })
}
