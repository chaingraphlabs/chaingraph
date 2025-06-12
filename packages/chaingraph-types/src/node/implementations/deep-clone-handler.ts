/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { IPort } from '../../port'
import type { CloneWithNewIdResult, INodeComposite } from '../interfaces'
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
  static cloneNodeWithNewIds<T extends INodeComposite>(sourceNode: T): CloneWithNewIdResult<T> {
    const nodeType = sourceNode.metadata.type
    const newNodeId = `${nodeType}:${generateNodeID()}`
    const originalNodeId = sourceNode.id

    const portIdMapping = new Map<string, string>()

    // Create new instance of the same node type
    const clonedNode = new (sourceNode.constructor as any)(newNodeId, {
      ...sourceNode.metadata,
    }) as T

    // Get all ports from source node
    const allSourcePorts = Array.from(sourceNode.ports.values())

    // Separate top-level ports (no parentId) from child ports
    const topLevelPorts = allSourcePorts.filter(port => !port.getConfig().parentId)
    const childPorts = allSourcePorts.filter(port => port.getConfig().parentId)

    // First pass: Clone all top-level ports
    const clonedTopLevelPorts = new Map<string, IPort>()
    for (const sourcePort of topLevelPorts) {
      try {
        const clonedPort = this.clonePort(sourcePort, newNodeId, portIdMapping)
        clonedTopLevelPorts.set(sourcePort.id, clonedPort)
        clonedNode.setPort(clonedPort)
      } catch (error) {
        console.warn(`[DeepCloneHandler] Failed to clone top-level port ${sourcePort.id}: ${error}. Skipping.`)
        continue
      }
    }

    // Second pass: Clone child ports recursively in depth-first order
    for (const [originalTopLevelId, clonedTopLevelPort] of clonedTopLevelPorts) {
      this.cloneChildPortsRecursive(
        sourceNode,
        originalTopLevelId,
        clonedTopLevelPort,
        clonedNode,
        newNodeId,
        portIdMapping,
        new Set(), // Track visited ports to prevent infinite loops
      )
    }

    // Rebuild port bindings and apply any post-clone logic
    clonedNode.rebuildPortBindings()
    clonedNode.setVersion(sourceNode.getVersion())

    return {
      clonedNode,
      portIdMapping,
      nodeIdMapping: {
        originalId: originalNodeId,
        newId: newNodeId,
      },
    }
  }

  /**
   * Clones a single port with a new ID and proper nodeId reference
   */
  private static clonePort(sourcePort: IPort, newNodeId: string, portIdMapping: Map<string, string>): IPort {
    const clonedPort = sourcePort.cloneWithNewId()

    // Update the port configuration with new nodeId
    const config = clonedPort.getConfig()
    clonedPort.setConfig({
      ...config,
      nodeId: newNodeId,
      connections: [], // Clear connections for cloned port
    })

    // Record the ID mapping
    portIdMapping.set(sourcePort.id, clonedPort.id)

    return clonedPort
  }

  /**
   * Recursively clones child ports in depth-first order
   * Ensures all parent-child relationships are maintained with new IDs
   */
  private static cloneChildPortsRecursive(
    sourceNode: INodeComposite,
    originalParentId: string,
    clonedParentPort: IPort,
    clonedNode: INodeComposite,
    newNodeId: string,
    portIdMapping: Map<string, string>,
    visitedPorts: Set<string>,
  ): void {
    // Prevent infinite loops
    if (visitedPorts.has(originalParentId)) {
      console.warn(`[DeepCloneHandler] Circular reference detected for port ${originalParentId}. Skipping.`)
      return
    }
    visitedPorts.add(originalParentId)

    // Find all direct children of this parent port
    const childPorts = sourceNode.getChildPorts(sourceNode.getPort(originalParentId)!)

    for (const childPort of childPorts) {
      try {
        // Clone the child port
        const clonedChildPort = this.clonePort(childPort, newNodeId, portIdMapping)

        // Update parentId to point to the cloned parent
        const childConfig = clonedChildPort.getConfig()
        clonedChildPort.setConfig({
          ...childConfig,
          parentId: clonedParentPort.id,
          nodeId: newNodeId,
          connections: [], // Clear connections
        })

        // Add the cloned child port to the cloned node
        clonedNode.setPort(clonedChildPort)

        // Recursively clone grandchildren
        this.cloneChildPortsRecursive(
          sourceNode,
          childPort.id,
          clonedChildPort,
          clonedNode,
          newNodeId,
          portIdMapping,
          visitedPorts,
        )
      } catch (error) {
        console.warn(`[DeepCloneHandler] Failed to clone child port ${childPort.id}: ${error}. Skipping.`)
        continue
      }
    }

    // Remove from visited set when done (allows for different branches)
    visitedPorts.delete(originalParentId)
  }
}
