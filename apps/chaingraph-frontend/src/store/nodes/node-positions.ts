/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { Position } from '@badaitech/chaingraph-types'
import { $nodes } from '@/store'
import { updateNodePositionInterpolated, updateNodePositionLocal } from '@/store/nodes/events'
import { createStore } from 'effector'

// Store that keeps track of the last position for each node ID
// This allows us to stabilize the node references
export const $nodePositions = createStore<Record<string, Position>>({})
  .on(updateNodePositionInterpolated, (state, { nodeId, position }) => {
    // Only update the specific node position that changed
    return {
      ...state,
      [nodeId]: position,
    }
  })
  .on(updateNodePositionLocal, (state, { nodeId, position }) => {
    return {
      ...state,
      [nodeId]: position,
    }
  })

// This derived store will update any time $nodes changes
// to make sure our positions store stays in sync with actual nodes
$nodePositions.on($nodes, (positions, nodes) => {
  const newPositions: Record<string, Position> = { ...positions }

  // Update positions for all nodes
  Object.values(nodes).forEach((node) => {
    const nodeId = node.id
    const position = node.metadata.ui?.position
    if (position) {
      newPositions[nodeId] = { ...position }
    }
  })

  return newPositions
})
