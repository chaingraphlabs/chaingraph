/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { JSONValue } from '../../utils/json'
import type { BooleanPortConfig, BooleanPortValue, IPort } from '../base'
import { BasePort } from '../base'
import { generatePortID } from '../id-generate'
import { BooleanPortPlugin } from '../plugins'

/**
 * Concrete implementation of a Boolean Port.
 *
 * This class extends BasePort using BooleanPortConfig and BooleanPortValue.
 * It leverages BooleanPortPlugin for validation, serialization, deserialization,
 * and for determining the default value if one is provided in the configuration.
 *
 * Example usage:
 *   const config: BooleanPortConfig = {
 *     type: 'boolean',
 *     defaultValue: true,
 *   }
 *
 *   const booleanPort = new BooleanPort(config)
 *   booleanPort.setValue({ type: 'boolean', value: false })
 *   console.log(booleanPort.getValue()) // => { type: 'boolean', value: false }
 */
export class BooleanPort extends BasePort<BooleanPortConfig> {
  constructor(config: BooleanPortConfig) {
    const defaultUi = {
      bgColor: '#4cd53b',
      borderColor: '#176510',
    }

    const mergedConfig = { ...config, ui: { ...defaultUi, ...config.ui } }
    super(mergedConfig)
  }

  /**
   * Retrieves the default value from the configuration.
   * If a defaultValue is provided in the config, it returns that;
   * otherwise, it returns undefined.
   *
   * @returns The default BooleanPortValue if provided; otherwise undefined.
   */
  protected getDefaultValue(): BooleanPortValue | undefined {
    return this.config.defaultValue
  }

  /**
   * Validates the provided boolean port value against the current configuration.
   * Delegates the validation to the BooleanPortPlugin.
   *
   * @param value - The boolean port value to validate.
   * @returns True if the value is valid; false otherwise.
   */
  protected validateValue(value: BooleanPortValue): boolean {
    const errors = BooleanPortPlugin.validateValue(value, this.config)
    return errors.length === 0
  }

  /**
   * Validates the boolean port configuration.
   * Uses the BooleanPortPlugin to perform the validation.
   *
   * @param config - The boolean port configuration to validate.
   * @returns True if the configuration is valid; otherwise, false.
   */
  protected validateConfig(config: BooleanPortConfig): boolean {
    const errors = BooleanPortPlugin.validateConfig(config)
    return errors.length === 0
  }

  /**
   * Serializes the boolean port configuration into a JSON-compatible object.
   * Delegates serialization logic to the BooleanPortPlugin.
   *
   * @param config - The boolean port configuration to serialize.
   * @returns The serialized configuration as a JSONValue.
   */
  protected serializeConfig(config: BooleanPortConfig): JSONValue {
    return BooleanPortPlugin.serializeConfig(config)
  }

  /**
   * Serializes the provided boolean port value into a JSON-compatible object.
   * Delegates serialization logic to the BooleanPortPlugin.
   *
   * @param value - The boolean port value to serialize.
   * @returns The serialized value as a JSONValue.
   */
  protected serializeValue(value: BooleanPortValue): JSONValue {
    return BooleanPortPlugin.serializeValue(value, this.config)
  }

  /**
   * Deserializes the provided JSON data into a boolean port configuration.
   * Delegates deserialization logic to the BooleanPortPlugin.
   *
   * @param data - The JSON data representing the configuration.
   * @returns The deserialized BooleanPortConfig.
   */
  protected deserializeConfig(data: JSONValue): BooleanPortConfig {
    return BooleanPortPlugin.deserializeConfig(data)
  }

  /**
   * Deserializes the given JSON data into a boolean port value.
   * Delegates this task to the BooleanPortPlugin.
   *
   * @param data - The JSON data representing the value.
   * @returns The deserialized BooleanPortValue.
   */
  protected deserializeValue(data: JSONValue): BooleanPortValue {
    return BooleanPortPlugin.deserializeValue(data, this.config)
  }

  /**
   * Clones the port with a new ID.
   * Useful for creating copies of the port with a unique identifier.
   */
  cloneWithNewId(): IPort<BooleanPortConfig> {
    return new BooleanPort({
      ...this.config,
      id: generatePortID(this.config.key || this.config.id || ''),
    })
  }
}
