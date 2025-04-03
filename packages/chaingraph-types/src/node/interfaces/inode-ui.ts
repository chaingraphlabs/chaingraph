/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { Dimensions, NodeUIMetadata, Position } from '../../node/node-ui'

/**
 * Interface for managing the UI aspects of a node
 */
export interface INodeUI {
  /**
   * Get the node's UI metadata
   * @returns Node UI metadata or undefined if not set
   */
  getUI: () => NodeUIMetadata | undefined

  /**
   * Update the node's UI metadata
   * @param ui New UI metadata
   * @param emitEvent Whether to emit a UI change event
   */
  setUI: (ui: NodeUIMetadata, emitEvent?: boolean) => void

  /**
   * Update the node's position
   * @param position New position coordinates
   * @param emitEvent Whether to emit a position change event
   */
  setPosition: (position: Position, emitEvent?: boolean) => void

  /**
   * Update the node's dimensions
   * @param dimensions New dimensions
   * @param emitEvent Whether to emit a dimensions change event
   */
  setDimensions: (dimensions: Dimensions, emitEvent?: boolean) => void

  /**
   * Update the node's parent and position
   * @param position New position coordinates
   * @param parentNodeId ID of the parent node or undefined to remove parent
   * @param emitEvent Whether to emit a parent change event
   */
  setNodeParent: (position: Position, parentNodeId?: string, emitEvent?: boolean) => void
}
