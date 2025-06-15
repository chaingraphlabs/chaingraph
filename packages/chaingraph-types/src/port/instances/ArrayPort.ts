/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { JSONValue } from '../../utils/json'
import type { ArrayPortConfig, ArrayPortValue, IPort, IPortConfig } from '../base'
import { deepCopy } from '../../utils'
import { BasePort } from '../base'
import { cleanupPortConfigFromIds } from '../base/'
import { generatePortID } from '../id-generate'
import { ArrayPortPlugin } from '../plugins'

/**
 * Concrete implementation of an Array Port.
 *
 * This class extends BasePort using ArrayPortConfig and ArrayPortValue.
 * It leverages the ArrayPortPlugin to handle default value resolution,
 * validation, serialization, and deserialization.
 *
 * Example usage:
 *   const config: ArrayPortConfig<StringPortConfig> = {
 *     type: 'array',
 *     itemConfig: { type: 'string', minLength: 2 },
 *     minLength: 1,
 *     maxLength: 5,
 *     defaultValue: {
 *       type: 'array',
 *       value: [{ type: 'string', value: 'hello' }],
 *     },
 *   }
 *
 *   const arrayPort = new ArrayPort(config)
 *   const valueDefault = arrayPort.getValue()?.value[0].value // => 'hello'
 *
 *   arrayPort.setValue({
 *     type: 'array',
 *     value: [
 *       { type: 'string', value: 'one' },
 *       { type: 'string', value: 'two' },
 *     ],
 *   })
 *
 *   const value = arrayPort.getValue()
 *   console.log(arrayPort.getValue()?.value[0].value) // => 'one'
 */
export class ArrayPort<Item extends IPortConfig = IPortConfig> extends BasePort<ArrayPortConfig<Item>> {
  constructor(config: ArrayPortConfig<Item>) {
    const defaultUi = {
      bgColor: '#1acbe8',
      borderColor: '#0f4852',
    }

    const mergedConfig = { ...config, ui: { ...defaultUi, ...config.ui } }
    super(mergedConfig)
  }

  /**
   * Retrieves the default value from the configuration.
   * If a defaultValue is provided in the config, it is returned;
   * otherwise, undefined is returned.
   *
   * @returns The default ArrayPortValue if specified; otherwise undefined.
   */
  protected getDefaultValue(): ArrayPortValue<Item> | undefined {
    return this.config.defaultValue
  }

  /**
   * Validates the given array port value against the current configuration.
   * Delegates validation to the ArrayPortPlugin.
   *
   * @param value - The array port value to validate.
   * @returns True if the value is valid; otherwise false.
   */
  protected validateValue(value: ArrayPortValue<Item>): boolean {
    const errors = ArrayPortPlugin.validateValue(value, this.config)
    return errors.length === 0
  }

  /**
   * Validates the array port configuration.
   * Delegates the configuration validation to the ArrayPortPlugin.
   *
   * @param config - The array port configuration to validate.
   * @returns True if the configuration is valid; otherwise false.
   */
  protected validateConfig(config: ArrayPortConfig<Item>): boolean {
    const errors = ArrayPortPlugin.validateConfig(config)
    return errors.length === 0
  }

  /**
   * Serializes the array port configuration into a JSON-compatible object.
   * Delegates serialization to the ArrayPortPlugin.
   *
   * @param config - The array port configuration to serialize.
   * @returns The serialized configuration as a JSONValue.
   */
  protected serializeConfig(config: ArrayPortConfig<Item>): JSONValue {
    return ArrayPortPlugin.serializeConfig(config)
  }

  /**
   * Serializes the given array port value into a JSON-compatible object.
   * Delegates serialization logic to the ArrayPortPlugin.
   *
   * @param value - The array port value to serialize.
   * @returns The serialized value as a JSONValue.
   */
  protected serializeValue(value: ArrayPortValue<Item>): JSONValue {
    return ArrayPortPlugin.serializeValue(value, this.config)
  }

  /**
   * Deserializes the provided JSON data into an array port configuration.
   * Delegates deserialization to the ArrayPortPlugin.
   *
   * @param data - The JSON data representing the configuration.
   * @returns The deserialized ArrayPortConfig.
   */
  protected deserializeConfig(data: JSONValue): ArrayPortConfig<Item> {
    return ArrayPortPlugin.deserializeConfig(data) as ArrayPortConfig<Item>
  }

  /**
   * Deserializes the given JSON data into an array port value.
   * Delegates deserialization to the ArrayPortPlugin.
   *
   * @param data - The JSON data representing the value.
   * @returns The deserialized ArrayPortValue.
   */
  protected deserializeValue(data: JSONValue): ArrayPortValue {
    return ArrayPortPlugin.deserializeValue(data, this.config)
  }

  /**
   * Clones the port with a new ID.
   * Useful for creating copies of the port with a unique identifier.
   */
  cloneWithNewId(): IPort<ArrayPortConfig<Item>> {
    const newPortID = generatePortID(this.config.key || this.config.id || '')
    const newConfig: ArrayPortConfig<Item> = {
      ...this.config,
      id: newPortID,
      itemConfig: cleanupPortConfigFromIds(this.config.itemConfig),
    }

    const port = new ArrayPort<Item>(newConfig)
    port.setValue(deepCopy(this.value)) // Set the current value
    return port
  }
}

/**
 * Factory function to create an ArrayPortConfig.
 * This function is used to ensure type safety when creating an ArrayPortConfig.
 * It takes an ArrayPortConfig object and returns it as is.
 * For example, you could infer the type of the config object through item config:
 *
 * const config = createArrayPortConfig({
 *   type: 'array',
 *   itemConfig: { type: 'string', minLength: 2 } as StringPortConfig,
 *   minLength: 1,
 *   maxLength: 5,
 *   defaultValue: {
 *     type: 'array',
 *     value: [{ type: 'string', value: 'hello' }],
 *   },
 * })
 *
 * type Config = typeof config // ArrayPortConfig<StringPortConfig>
 *
 * @param config
 */
function createArrayPortConfig<Item extends IPortConfig>(config: ArrayPortConfig<Item>) {
  return config
}
