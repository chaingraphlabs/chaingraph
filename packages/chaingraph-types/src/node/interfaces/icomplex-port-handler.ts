/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { AnyPort, IPort, IPortConfig, ObjectPort } from '../../port'
import type { IPortManager } from './iport-manager'

export interface INodeObjectPortOperations {
  /**
   * Add a new property to an object port
   * @param objectPort The parent object port
   * @param key The property key
   * @param portConfig The port configuration for the new property
   * @param useParentUI indicates whether we want to use the parents UI
   */
  addObjectProperty: (
    objectPort: IPort,
    key: string,
    portConfig: IPortConfig,
    useParentUI?: boolean
  ) => IPort

  /**
   * Add multiple properties to an object port
   * @param objectPort The parent object port
   * @param properties The properties to add
   * @returns The updated object port with the new properties
   */
  addObjectProperties: (
    objectPort: IPort,
    properties: IPortConfig[],
    useParentUI?: boolean
  ) => IPort[]

  /**
   * Remove a property from an object port
   * @param objectPort The parent object port
   * @param key The property key to remove
   */
  removeObjectProperty: (objectPort: IPort, key: string) => void

  /**
   * Remove multiple properties from an object port
   * @param objectPort The parent object port
   * @param keys The property keys to remove
   */
  removeObjectProperties: (objectPort: IPort, keys: string[]) => void

  /**
   * Copy the schema of one object port to another
   * This will copy the properties and their configurations and handle all internal ports accordingly
   * @param sourceObjectPort
   * @param targetObjectPort
   * @param useParentUI
   */
  copyObjectSchemaTo: (
    sourceNode: IPortManager,
    sourceObjectPort: ObjectPort | AnyPort,
    targetObjectPort: ObjectPort | AnyPort,
    useParentUI?: boolean
  ) => void
}

export interface INodeArrayPortOperations {

  /**
   * Updates the items with the new array ports item configuration
   * @param arrayPort The array port
   */
  updateArrayItemConfig: (arrayPort: IPort) => void

  /**
   * Add an item to an array port
   * @param arrayPort The array port
   * @param value The value to append
   * @param itemConfig The configuration to change
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
   * Remove multiple items from an array port
   * @param arrayPort The array port
   * @param indices The indices to remove
   */
  removeArrayItems: (arrayPort: IPort, indices: number[]) => void

  /**
   * Helper to recreate array item ports when an array is modified
   * @param arrayPort The array port
   * @param newArray The new array value
   */
  recreateArrayItemPorts: (arrayPort: IPort, newArray: any[]) => void
}

/**
 * Interface for handling complex port types (objects and arrays)
 * Provides methods for mutating object properties and array items
 */
export interface IComplexPortHandler extends INodeObjectPortOperations, INodeArrayPortOperations {
  /**
   * Creates or deletes child ports depending on whether the child type is an object.
   * This allows child ports to be rendered for objects connected to Any ports
   * @param anyPort The Any port
   * @param useParentUI indicates whether we want to use the parents UI
   */
  refreshAnyPortUnderlyingPorts: (anyPort: IPort, useParentUI?: boolean) => void

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
}
