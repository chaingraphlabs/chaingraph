/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { IPort } from '../../port'
import type { INodeComposite } from '../interfaces'
import { NodeStatus } from '../../node/node-enums'
import { generateNodeID } from '../id-generate'

/**
 * Handles deep cloning of nodes with proper port hierarchy preservation
 * This class ensures that all ports are cloned with new IDs while maintaining
 * parent-child relationships and preserving all values and metadata
 */
export class DeepCloneHandler {
  /**
   * Creates a deep clone of a node with all new IDs
   *
   * @param sourceNode The node to clone
   * @returns CloneWithNewIdResult containing the cloned node and ID mappings
   */
  static cloneNodeWithNewIds<T extends INodeComposite>(sourceNode: T): T {
    const nodeType = sourceNode.metadata.type
    const newNodeId = `${nodeType}:${generateNodeID()}`

    // Create new instance of the same node type
    const clonedNode = new (sourceNode.constructor as any)(newNodeId, {
      ...sourceNode.metadata,
    }) as T

    sourceNode.ports.forEach((port) => {
      clonedNode.setPort(this.clonePort(port, newNodeId))
    })

    // Rebuild port bindings and apply any post-clone logic
    clonedNode.bindPortBindings()
    clonedNode.setVersion(sourceNode.getVersion())
    clonedNode.setStatus(NodeStatus.Initialized)

    return clonedNode
  }

  /**
   * Clones a single port with a new ID and proper nodeId reference
   */
  private static clonePort(sourcePort: IPort, newNodeId: string): IPort {
    const clonedPort = sourcePort.clone()

    // Update the port configuration with new nodeId
    const config = clonedPort.getConfig()
    clonedPort.setConfig({
      ...config,
      nodeId: newNodeId,
      connections: [], // Clear connections for cloned port
    })

    return clonedPort
  }
}
