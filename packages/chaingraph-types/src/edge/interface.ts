/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { INode } from '../node'
import type { IPort } from '../port'
import type { EdgeMetadata, EdgeStatus } from './types'

/**
 * Interface representing an edge in the graph, connecting output ports of one node to input ports of another node.
 */
export interface IEdge {
  /** Unique identifier of the edge */
  readonly id: string

  /** Current status of the edge */
  readonly status: EdgeStatus

  /** Edge metadata */
  readonly metadata: EdgeMetadata

  /** Source node and port */
  readonly sourceNode: INode
  readonly sourcePort: IPort

  /** Target node and port */
  readonly targetNode: INode
  readonly targetPort: IPort

  /**
   * Initialize the edge connection
   */
  initialize: () => Promise<void>

  /**
   * Validate the edge connection
   */
  validate: () => Promise<boolean>

  /**
   * Transfer data from source to target
   * @param data Data to transfer
   */
  transfer: () => Promise<void>

  /**
   * Update edge metadata
   * @param metadata New metadata
   */
  updateMetadata: (metadata: Partial<EdgeMetadata>) => void

  /**
   * Dispose of edge resources
   */
  dispose: () => Promise<void>

  /**
   * Clone the edge
   */
  clone: () => IEdge
}
