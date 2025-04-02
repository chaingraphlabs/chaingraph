/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { INodeComposite, INodeVersioning } from '../interfaces'

/**
 * Implementation of INodeVersioning interface
 * Handles version tracking for nodes
 */
export class NodeVersionManager implements INodeVersioning {
  constructor(private nodeRef: INodeComposite) {
    // Ensure version is initialized
    if (!this.nodeRef.metadata.version) {
      this.nodeRef.metadata.version = 1
    }
  }

  /**
   * Increment the node's version number
   * @returns The new version number
   */
  incrementVersion(): number {
    this.nodeRef.metadata.version = this.getVersion() + 1
    return this.nodeRef.metadata.version
  }

  /**
   * Get the current version number
   * @returns The current version
   */
  getVersion(): number {
    return this.nodeRef.metadata.version || 0
  }

  /**
   * Set the version number
   * @param version The new version number
   */
  setVersion(version: number): void {
    this.nodeRef.metadata.version = version
  }
}
