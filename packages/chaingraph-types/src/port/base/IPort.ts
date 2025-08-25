/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { JSONValue } from '../../utils/json'
import type { ExtractValue, IPortConfig } from './types'

/**
 * IPort interface
 *
 * Represents a generic port that holds a configuration and a value.
 * The type parameter C must extend IPortConfig and defines the shape of the configuration.
 *
 * Each port instance implements several methods:
 * - getConfig: Returns the current configuration.
 * - setConfig: Updates the configuration.
 * - getValue: Retrieves the current port value.
 * - setValue: Sets or updates the port value.
 * - reset: Resets the port’s value, typically to a default state.
 * - serialize: Serializes the port (both config and value) to a JSON-compatible value.
 * - deserialize: Deserializes a JSON value into the port’s configuration and value.
 * - validate: Validates both the configuration and the current value.
 *
 * @template C - The configuration type which extends IPortConfig.
 */
export interface IPort<C extends IPortConfig = IPortConfig> {
  /**
   * The unique identifier of the port.
   */
  get id(): string

  /**
   * The key of the port.
   */
  get key(): string

  /**
   * Retrieves the current port configuration.
   *
   * @returns The port configuration of type C.
   */
  getConfig: () => C

  /**
   * Updates the port configuration with a new configuration object.
   *
   * @param newConfig - New configuration of type C.
   */
  setConfig: (newConfig: C) => void

  /**
   * Gets the current port value.
   *
   * @returns The port value, or undefined if none is set.
   */
  getValue: () => ExtractValue<C> | undefined

  /**
   * Sets or updates the port value.
   * The value must be validated before being accepted.
   *
   * @param newValue - The new value to set for the port.
   */
  setValue: (newValue: ExtractValue<C>) => void

  /**
   * Resets the port’s current value.
   *
   * In typical implementations, this resets the value to a default (if available).
   */
  reset: () => void

  /**
   * Serializes the port’s configuration and value.
   *
   * The returned JSONValue should be a JSON-serializable representation of the port.
   *
   * @returns A JSON value representing the port’s state.
   */
  serialize: () => JSONValue

  /**
   * Deserializes the given JSON data and updates the port’s configuration and value.
   *
   * The input data is expected to contain a serialized representation of the port.
   *
   * @param data - A JSONValue that holds serialized port data.
   * @returns A port instance (of type IPort<C>) with updated configuration and value.
   */
  deserialize: (data: JSONValue) => IPort<C>

  /**
   * Validates the current port configuration and value.
   *
   * @returns True if the port is valid, otherwise false.
   */
  validate: () => boolean

  /**
   * Clones the port instance.
   *
   * @returns A new port instance with the same configuration and value.
   */
  clone: () => IPort<C>

  /**
   * Clones the port instance with a new unique identifier.
   *
   * This is useful for creating a copy of the port that can be used independently.
   *
   * @returns A new port instance with the same configuration and value, but a new ID.
   */
  cloneWithNewId: () => IPort<C>

  /**
   * Check if the port is a system port.
   *
   * @returns True if the port is a system port, otherwise false.
   */
  isSystem: () => boolean

  /**
   * Check if the port is a system error port.
   *
   * @returns True if the port is a system error port, otherwise false.
   */
  isSystemError: () => boolean

  /**
   * Adds a connection to the port metadata.
   *
   * @param nodeId - The ID of the node to connect to.
   * @param portId - The ID of the port to connect to.
   *
   */
  addConnection: (nodeId: string, portId: string) => void

  /**
   * Removes a connection from the port metadata.
   *
   * @param nodeId - The ID of the node to disconnect from.
   * @param portId - The ID of the port to disconnect from.
   */
  removeConnection: (nodeId: string, portId: string) => void

  /**
   * Returns the default value.
   * Concrete implementations can use a default provided by the configuration.
   */
  getDefaultValue: () => ExtractValue<C> | undefined

  /**
   * Validates the port value.
   * Must return true if the value is valid, false otherwise.
   */
  validateValue: (value: ExtractValue<C>) => boolean

  /**
   * Validates the port configuration.
   * Must return true if the configuration is valid, false otherwise.
   */
  validateConfig: (config: C) => boolean

  /**
   * Serializes the configuration (of type C) to a JSONValue.
   */
  serializeConfig: (config: C) => JSONValue

  /**
   * Serializes the port value (of type T) to a JSONValue.
   */
  serializeValue: (value: ExtractValue<C>) => JSONValue

  /**
   * Deserializes a JSONValue into a configuration object of type C.
   */
  deserializeConfig: (data: JSONValue) => C

  /**
   * Deserializes a JSONValue into a port value of type T.
   */
  deserializeValue: (data: JSONValue) => ExtractValue<C>
}

/**
 * Type guard function to check whether a provided object implements the IPort interface.
 *
 * This function performs runtime checks to ensure that the object contains the
 * required properties and methods of an IPort instance.
 *
 * @param obj - The object to check.
 * @returns True if the object implements IPort<IPortConfig>, false otherwise.
 */
export function isIPort(obj: unknown): obj is IPort<IPortConfig> {
  return (
    obj !== null
    && typeof obj === 'object'
    && 'getConfig' in obj
    && 'setConfig' in obj
    && 'getValue' in obj
    && 'setValue' in obj
    && 'reset' in obj
    && 'serialize' in obj
    && 'deserialize' in obj
    && 'validate' in obj
  )
}
