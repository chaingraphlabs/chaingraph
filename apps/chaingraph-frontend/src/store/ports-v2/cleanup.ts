/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { PortKey } from './types'
import { sample } from 'effector'
import { removeNode } from '@/store/nodes/stores'
import { $isGranularWriteEnabled } from './feature-flags'
import { $nodePortKeys, removePortsBatch } from './stores'

/**
 * Wire: When node is removed, clean up all its port data from granular stores
 *
 * This prevents memory leaks by ensuring port data is cleaned up when nodes
 * are deleted. Uses the $nodePortKeys index to find all ports belonging to the node.
 */
sample({
  clock: removeNode,
  source: { enabled: $isGranularWriteEnabled, portKeys: $nodePortKeys },
  filter: ({ enabled }) => enabled,
  fn: ({ portKeys }, nodeId): Set<PortKey> => portKeys.get(nodeId) || new Set<PortKey>(),
  target: removePortsBatch,
})

/**
 * Wire: Update $nodePortKeys index when node is removed
 */
$nodePortKeys.on(removeNode, (state, nodeId) => {
  const newState = new Map(state)
  newState.delete(nodeId)
  return newState
})

/** Marker to prevent tree-shaking */
export const CLEANUP_WIRING = true
