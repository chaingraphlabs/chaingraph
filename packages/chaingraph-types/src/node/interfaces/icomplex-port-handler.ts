/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { IPort, IPortConfig } from '../../port'

/**
 * Interface for handling complex port types (objects and arrays)
 * Provides methods for mutating object properties and array items
 */
export interface IComplexPortHandler {
  /**
   * Add a new property to an object port
   * @param objectPort The parent object port
   * @param key The property key
   * @param portConfig The port configuration for the new property
   */
  addObjectProperty: (objectPort: IPort, key: string, portConfig: IPortConfig) => IPort

  /**
   * Remove a property from an object port
   * @param objectPort The parent object port
   * @param key The property key to remove
   */
  removeObjectProperty: (objectPort: IPort, key: string) => void

  /**
   * Add an item to an array port
   * @param arrayPort The array port
   * @param value The value to append
   * @returns The index of the new item
   */
  appendArrayItem: (arrayPort: IPort, value: any) => number

  /**
   * Remove an item from an array port
   * @param arrayPort The array port
   * @param index The index to remove
   */
  removeArrayItem: (arrayPort: IPort, index: number) => void

  /**
   * Process port configurations through PortConfigProcessor
   * @param config Port configuration to process
   * @param context Processing context
   */
  processPortConfig: (config: IPortConfig, context: {
    nodeId: string
    parentPortConfig: IPortConfig | null
    propertyKey: string
    propertyValue: any
  }) => IPortConfig

  /**
   * Helper to recreate array item ports when an array is modified
   * @param arrayPort The array port
   * @param newArray The new array value
   */
  recreateArrayItemPorts: (arrayPort: IPort, newArray: any[]) => void
}
