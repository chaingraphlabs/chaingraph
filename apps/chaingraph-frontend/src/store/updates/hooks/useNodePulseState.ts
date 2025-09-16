/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import { useStoreMap } from 'effector-react'
import { $nodesPulseState } from '../stores'

type PulseState = 'pulse' | 'fade' | null

/**
 * Ultra-optimized hook to get the pulse state for a specific node.
 * Only re-renders when the pulse state for the specific node changes.
 *
 * @param nodeId - The ID of the node to track pulse state for
 * @returns The pulse state: 'pulse', 'fade', or null
 */
export function useNodePulseState(nodeId: string): PulseState {
  return useStoreMap({
    store: $nodesPulseState,
    keys: [nodeId],
    fn: (pulseStates, [nodeId]) => {
      return pulseStates.get(nodeId) ?? null
    },
    updateFilter: (prev, next) => {
      // Only update if the pulse state for this specific node changes
      // This prevents unnecessary re-renders when other nodes pulse
      return prev !== next
    },
  })
}

/**
 * Hook to check if a node is currently flashing (has any pulse state).
 * Optimized to only re-render when the flashing state changes (true/false).
 *
 * @param nodeId - The ID of the node to check
 * @returns true if the node is flashing, false otherwise
 */
export function useIsNodeFlashing(nodeId: string): boolean {
  return useStoreMap({
    store: $nodesPulseState,
    keys: [nodeId],
    fn: (pulseStates, [nodeId]) => {
      return pulseStates.has(nodeId)
    },
    updateFilter: (prev, next) => {
      // Only update when flashing state changes (boolean comparison)
      return prev !== next
    },
  })
}
