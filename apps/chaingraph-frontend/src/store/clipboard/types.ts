/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { INode } from '@badaitech/chaingraph-types'
import type { AnchorNodeState } from '../edges/anchor-nodes'
import type { EdgeData } from '../edges/types'

/**
 * Clipboard data structure containing nodes, edges, and anchors
 */
export interface ClipboardData {
  /** Nodes that were copied */
  nodes: INode[]
  /** Edges between the copied nodes (internal edges only) */
  edges: EdgeData[]
  /** Anchors grouped by edge ID */
  anchorsByEdge: Record<string, AnchorNodeState[]>
  /** Timestamp when the data was copied */
  timestamp: number
  /** Virtual origin point (top-left corner of bounding box) for relative positioning */
  virtualOrigin: { x: number, y: number }
}

/**
 * Options for paste operation
 */
export interface PasteOptions {
  /** Position offset from original (for duplicate operation) */
  offset?: { x: number, y: number }
  /** Target position for paste (overrides offset) */
  targetPosition?: { x: number, y: number }
}

/**
 * Clipboard statistics
 */
export interface ClipboardStats {
  nodeCount: number
  edgeCount: number
  anchorCount: number
}
