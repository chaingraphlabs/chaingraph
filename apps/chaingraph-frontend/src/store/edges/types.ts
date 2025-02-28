/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { EdgeMetadata } from '@badaitech/chaingraph-types'

export interface EdgeData {
  flowId: string
  edgeId: string
  sourceNodeId: string
  sourcePortId: string
  targetNodeId: string
  targetPortId: string
  metadata: EdgeMetadata
}

export interface EdgeState {
  edges: EdgeData[]
  isLoading: boolean
  error: Error | null
}

export interface AddEdgeEventData {
  flowId: string
  sourceNodeId: string
  sourcePortId: string
  targetNodeId: string
  targetPortId: string
  metadata: EdgeMetadata
}

export interface RemoveEdgeEventData {
  flowId: string
  edgeId: string
}

export interface EdgeError {
  message: string
  code?: string
  timestamp: Date
}
