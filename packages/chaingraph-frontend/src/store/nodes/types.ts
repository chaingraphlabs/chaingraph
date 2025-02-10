/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { NodeMetadata, NodeStatus } from '@badaitech/chaingraph-types'
import type { NodeUIMetadata, Position } from '@badaitech/chaingraph-types/node/node-ui'

// State types
export interface NodeState {
  id: string
  metadata: NodeMetadata
  status: NodeStatus
  portIds: string[]
}

// Event types
export interface AddNodeEvent {
  flowId: string
  nodeType: string
  position: {
    x: number
    y: number
  }
  metadata?: {
    title?: string
    description?: string
    category?: string
    tags?: string[]
  }
}

export interface UpdateNodeEvent {
  id: string
  data: Partial<NodeState>
}

export interface UpdateNodeUIEvent {
  flowId: string
  nodeId: string
  ui?: NodeUIMetadata
  version: number
}

export interface UpdateNodePosition {
  flowId: string
  nodeId: string
  position: Position
  version: number
}

export interface UpdateNodeParent {
  flowId: string
  nodeId: string
  parentNodeId?: string
  position: Position
  version: number
}
