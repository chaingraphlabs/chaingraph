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

/**
 * Render data for a single edge in the XYFlow graph
 *
 * This is stored in $edgeRenderMap and updated via delta samples.
 * Each edge has an `isReady` flag that indicates whether both
 * source and target ports exist in $portConfigs.
 *
 * Style properties are updated surgically by separate wires:
 * - WIRE 1: $portConfigs + $portUI → isReady + color
 * - WIRE 2: $executionNodes → animation + style
 * - WIRE 3-4: highlighting → style
 * - WIRE 5: $nodeLayerDepth → zIndex
 */
export interface EdgeRenderData {
  // Identity (immutable after creation)
  edgeId: string
  source: string
  target: string
  sourceHandle: string
  targetHandle: string

  // Readiness flag - edge only renders when BOTH ports exist in $portConfigs
  isReady: boolean

  // Style properties (updated by delta samples)
  color: string
  type: 'flow' | 'default'
  strokeWidth: number
  strokeOpacity: number
  animated: boolean
  zIndex: number

  // For XYFlow edge memoization (increments on any change)
  version: number

  // Original edge data (for compatibility with useEdgesForNode)
  edgeData: EdgeData
}
