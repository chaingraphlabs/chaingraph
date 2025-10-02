/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

/**
 * Interface for node cloning operations
 * Extends the basic cloning functionality to support cloning with new IDs
 */
export interface INodeClonable<T = any> {
  /**
   * Create a deep clone of the node with a new unique identifier
   * This method ensures all ports are properly cloned with new IDs while preserving
   * the port hierarchy and values
   *
   * @returns A result object containing the cloned node and ID mappings
   */
  cloneWithNewId: () => T
}
