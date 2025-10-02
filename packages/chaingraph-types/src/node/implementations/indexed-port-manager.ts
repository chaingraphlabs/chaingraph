/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { IPort } from '../../port'
import { PortManager } from './port-manager'

/**
 * Indexed implementation of PortManager for maximum performance
 * Uses parent-to-children index for O(1) child lookups
 * Uses bidirectional path indexing for O(1) path lookups
 * Best for scenarios with frequent reads and infrequent writes
 */
export class IndexedPortManager extends PortManager {
  private _childrenIndex: Map<string, Set<string>> = new Map()
  private _pathToIdIndex: Map<string, string> = new Map() // path → portId
  private _idToPathIndex: Map<string, string> = new Map() // portId → path
  private _rootPortsIndex: Map<string, string> = new Map() // rootKey → portId
  private _indexDirty = true
  private _pathIndexDirty = true

  /**
   * Rebuild the parent-to-children index and root ports index
   * Called lazily when needed
   */
  private rebuildIndex(): void {
    if (!this._indexDirty)
      return

    this._childrenIndex.clear()
    this._rootPortsIndex.clear()

    for (const port of this._ports.values()) {
      const config = port.getConfig()
      const parentId = config.parentId

      if (parentId) {
        // Build parent-to-children index
        if (!this._childrenIndex.has(parentId)) {
          this._childrenIndex.set(parentId, new Set())
        }
        this._childrenIndex.get(parentId)!.add(port.id)
      } else {
        // Index root ports by their key for O(1) lookup
        if (config.key) {
          this._rootPortsIndex.set(config.key, port.id)
        }
      }
    }

    this._indexDirty = false
  }

  /**
   * Rebuild the path index
   * Called lazily when needed for path operations
   */
  private rebuildPathIndex(): void {
    if (!this._pathIndexDirty)
      return

    this._pathToIdIndex.clear()
    this._idToPathIndex.clear()

    // Build paths for all ports
    for (const port of this._ports.values()) {
      const segments = this.buildPortPath(port)
      const pathString = this.segmentsToPathString(segments)

      if (pathString) {
        this._pathToIdIndex.set(pathString, port.id)
        this._idToPathIndex.set(port.id, pathString)
      }
    }

    this._pathIndexDirty = false
  }

  /**
   * Override setPort to mark indexes as dirty
   */
  setPort(port: IPort): IPort {
    this._indexDirty = true
    this._pathIndexDirty = true
    return super.setPort(port)
  }

  /**
   * Override setPorts to mark indexes as dirty
   */
  setPorts(ports: Map<string, IPort>): void {
    this._indexDirty = true
    this._pathIndexDirty = true
    super.setPorts(ports)
  }

  /**
   * Override removePort to mark indexes as dirty
   */
  removePort(portId: string): void {
    this._indexDirty = true
    this._pathIndexDirty = true
    super.removePort(portId)
  }

  /**
   * Optimized getChildPorts using index
   * O(1) lookup instead of O(n) scan
   */
  getChildPorts(parentPort: IPort): IPort[] {
    this.rebuildIndex()

    const childIds = this._childrenIndex.get(parentPort.id)
    if (!childIds)
      return []

    const result: IPort[] = []
    for (const childId of childIds) {
      const port = this._ports.get(childId)
      if (port) {
        result.push(port)
      }
    }

    return result
  }

  /**
   * Optimized getNestedPorts using index
   * O(k) where k is the actual number of nested ports
   * Instead of O(n) where n is total ports
   */
  getNestedPorts(parentPort: IPort): IPort[] {
    this.rebuildIndex()

    const result: IPort[] = []
    const toProcess: string[] = [parentPort.id]
    const processed = new Set<string>()

    while (toProcess.length > 0) {
      const currentId = toProcess.shift()!

      // Skip if already processed (handles potential cycles)
      if (processed.has(currentId)) {
        continue
      }
      processed.add(currentId)

      // Direct lookup of children using index - O(1)
      const childIds = this._childrenIndex.get(currentId)
      if (childIds) {
        for (const childId of childIds) {
          const port = this._ports.get(childId)
          if (port) {
            result.push(port)
            toProcess.push(childId)
          }
        }
      }
    }

    return result
  }

  /**
   * Optimized getParentshipChain - no index needed since we traverse upward
   * O(d) where d is the depth of the hierarchy
   * @param port The port to get the chain for
   * @returns Array of ports in the chain, starting from the given port up to the root
   */
  getParentshipChain(port: IPort): IPort[] {
    // No optimization needed - already O(d) with direct Map lookups
    return super.getParentshipChain(port)
  }

  /**
   * Optimized getRootPort - no index needed since we traverse upward
   * O(d) where d is the depth of the hierarchy
   * @param port The port to find the root for
   * @returns The root port
   */
  getRootPort(port: IPort): IPort {
    // No optimization needed - already O(d) with direct Map lookups
    return super.getRootPort(port)
  }

  /**
   * Optimized getPortByPath using cached path index
   * O(1) lookup instead of O(n) traversal
   */
  getPortByPath(pathString: string): IPort | undefined {
    if (!pathString) {
      return undefined
    }

    // Rebuild index if needed
    this.rebuildPathIndex()

    // Direct O(1) lookup from cached index
    const portId = this._pathToIdIndex.get(pathString)
    if (portId) {
      return this._ports.get(portId)
    }

    // Fallback to parent implementation if not found in index
    // This handles cases where the path might use different notation
    return super.getPortByPath(pathString)
  }

  /**
   * Optimized getPortPath using cached path index
   * O(1) lookup instead of O(d) traversal
   */
  getPortPath(portId: string): string | undefined {
    // Rebuild index if needed
    this.rebuildPathIndex()

    // Direct O(1) lookup from cached index
    return this._idToPathIndex.get(portId)
  }

  /**
   * Optimized getPortPathForPort using cached path index
   * O(1) lookup instead of O(d) traversal
   */
  getPortPathForPort(port: IPort): string {
    // Rebuild index if needed
    this.rebuildPathIndex()

    // Direct O(1) lookup from cached index
    const path = this._idToPathIndex.get(port.id)
    if (path) {
      return path
    }

    // Fallback to building path if not found (shouldn't happen normally)
    return super.getPortPathForPort(port)
  }

  /**
   * Optimized findPortByPath using root ports index
   * O(d) where d is depth, with O(1) root lookup
   */
  findPortByPath(path: string[]): IPort | undefined {
    // Use parent validation
    const validated = super.findPortByPath(path)
    if (!validated || !path || path.length === 0) {
      return validated
    }

    // Rebuild index if needed
    this.rebuildIndex()

    // O(1) lookup for root port using index
    const rootKey = path[0].trim()
    const rootPortId = this._rootPortsIndex.get(rootKey)
    if (!rootPortId) {
      return undefined
    }

    let currentPort = this._ports.get(rootPortId)
    if (!currentPort) {
      return undefined
    }

    // Follow the path from root (already validated by parent)
    for (let i = 1; i < path.length; i++) {
      const segment = path[i].trim()
      const isArrayIndex = /^\d+$/.test(segment)

      if (isArrayIndex) {
        const index = Number.parseInt(segment, 10)
        const nextPortId = `${currentPort.id}[${index}]`
        currentPort = this._ports.get(nextPortId)
      } else {
        const nextPortId = `${currentPort.id}.${segment}`
        currentPort = this._ports.get(nextPortId)
      }

      if (!currentPort) {
        return undefined
      }
    }

    return currentPort
  }

  /**
   * Get statistics about the index
   * Useful for debugging and performance monitoring
   */
  getIndexStats(): {
    isDirty: boolean
    parentCount: number
    totalChildren: number
    maxChildrenPerParent: number
    pathIndexDirty: boolean
    totalPaths: number
    rootPortsCount: number
  } {
    this.rebuildIndex()
    this.rebuildPathIndex()

    let totalChildren = 0
    let maxChildren = 0

    for (const children of this._childrenIndex.values()) {
      totalChildren += children.size
      maxChildren = Math.max(maxChildren, children.size)
    }

    return {
      isDirty: this._indexDirty,
      parentCount: this._childrenIndex.size,
      totalChildren,
      maxChildrenPerParent: maxChildren,
      pathIndexDirty: this._pathIndexDirty,
      totalPaths: this._pathToIdIndex.size,
      rootPortsCount: this._rootPortsIndex.size,
    }
  }
}
