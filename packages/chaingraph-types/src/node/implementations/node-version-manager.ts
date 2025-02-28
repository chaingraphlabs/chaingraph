/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { NodeMetadata } from '../../node/types'
import type { INodeVersioning } from '../interfaces'

/**
 * Implementation of INodeVersioning interface
 * Handles version tracking for nodes
 */
export class NodeVersionManager implements INodeVersioning {
  constructor(private metadata: NodeMetadata) {
    // Ensure version is initialized
    if (!this.metadata.version) {
      this.metadata.version = 1
    }
  }

  /**
   * Increment the node's version number
   * @returns The new version number
   */
  incrementVersion(): number {
    this.metadata.version = this.getVersion() + 1
    return this.metadata.version
  }

  /**
   * Get the current version number
   * @returns The current version
   */
  getVersion(): number {
    return this.metadata.version || 0
  }

  /**
   * Set the version number
   * @param version The new version number
   */
  setVersion(version: number): void {
    this.metadata.version = version
  }
}
