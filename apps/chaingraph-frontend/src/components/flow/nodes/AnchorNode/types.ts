/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { Node } from '@xyflow/react'

export interface AnchorNodeData extends Record<string, unknown> {
  /** The edge ID this anchor belongs to */
  edgeId: string
  /** Order index along the edge path */
  index: number
  /** Edge color for styling (defaults to blue) */
  color?: string
  /** Version for forcing re-renders when color changes */
  version?: number
}

export type AnchorNode = Node<AnchorNodeData, 'anchorNode'>

/** Anchor node visual size (width/height) - larger than PortHandle for easier grabbing */
export const ANCHOR_NODE_SIZE = 16

/** Half of anchor size - used to offset position to center */
export const ANCHOR_NODE_OFFSET = ANCHOR_NODE_SIZE / 2
