/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

/**
 * Interface for managing node version
 */
export interface INodeVersioning {
  /**
   * Increment the node's version number
   * @returns The new version number
   */
  incrementVersion: () => number

  /**
   * Get the current version number
   * @returns The current version
   */
  getVersion: () => number

  /**
   * Set the version number
   * @param version The new version number
   */
  setVersion: (version: number) => void
}
