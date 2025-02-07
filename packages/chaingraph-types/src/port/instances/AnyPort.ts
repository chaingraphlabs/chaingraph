/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { JSONValue } from '../base/json'
import type { AnyPortConfig, AnyPortValue } from '../base/types'
import { BasePort } from '../base/BasePort'
import { AnyPortPlugin } from '../plugins/AnyPortPlugin'

/**
 * Concrete implementation of an Any Port.
 *
 * This class extends BasePort using AnyPortConfig and AnyPortValue.
 * It leverages the AnyPortPlugin to handle validation, serialization,
 * and deserialization by delegating to the underlying port type's plugin.
 *
 * The Any port acts as a wrapper around any other port type. Its configuration
 * includes an underlyingType field that specifies which port type to use,
 * and all operations are delegated to that type's plugin.
 *
 * Example usage:
 *   const config: AnyPortConfig = {
 *     type: 'any',
 *     underlyingType: {
 *       type: 'string',
 *       minLength: 2,
 *     },
 *     defaultValue: {
 *       type: 'any',
 *       value: { type: 'string', value: 'hello' },
 *     },
 *   }
 *
 *   const anyPort = new AnyPort(config)
 *   anyPort.setValue({
 *     type: 'any',
 *     value: { type: 'string', value: 'world' },
 *   })
 *   console.log(anyPort.getValue()) // => { type: 'any', value: { type: 'string', value: 'world' } }
 */
export class AnyPort extends BasePort<AnyPortConfig> {
  constructor(config: AnyPortConfig) {
    const defaultUi = {
      bgColor: '#cccccc',
      borderColor: '#333333',
    }

    const mergedConfig = { ...config, ui: { ...defaultUi, ...config.ui } }
    super(mergedConfig)
  }

  /**
   * Returns the default value from the configuration.
   * @returns The default AnyPortValue if specified; otherwise undefined.
   */
  protected getDefaultValue(): AnyPortValue | undefined {
    return this.config.defaultValue
  }

  /**
   * Validates the any port value.
   * Delegates to AnyPortPlugin.validateValue which in turn delegates
   * to the underlying type's plugin for value validation.
   * @param value - The any port value to validate.
   * @returns True if valid; otherwise false.
   */
  protected validateValue(value: AnyPortValue): boolean {
    const errors = AnyPortPlugin.validateValue(value, this.config)
    return errors.length === 0
  }

  /**
   * Validates the any port configuration.
   * Delegates to AnyPortPlugin.validateConfig which validates both
   * the any port structure and the underlying type's configuration.
   * @param config - The any port configuration.
   * @returns True if valid; otherwise false.
   */
  protected validateConfig(config: AnyPortConfig): boolean {
    const errors = AnyPortPlugin.validateConfig(config)
    return errors.length === 0
  }

  /**
   * Serializes the any port configuration.
   * Delegates to AnyPortPlugin.serializeConfig which handles
   * serializing both the any port config and the underlying type's config.
   * @param config - The any port configuration.
   * @returns The serialized configuration.
   */
  protected serializeConfig(config: AnyPortConfig): JSONValue {
    return AnyPortPlugin.serializeConfig(config)
  }

  /**
   * Serializes the any port value.
   * Delegates to AnyPortPlugin.serializeValue which handles
   * serializing both the any port value and the underlying value.
   * @param value - The any port value.
   * @returns The serialized value.
   */
  protected serializeValue(value: AnyPortValue): JSONValue {
    return AnyPortPlugin.serializeValue(value, this.config)
  }

  /**
   * Deserializes JSON data into an AnyPortConfig.
   * Delegates to AnyPortPlugin.deserializeConfig which handles
   * deserializing both the any port config and the underlying type's config.
   * @param data - The JSON data.
   * @returns The deserialized configuration.
   */
  protected deserializeConfig(data: JSONValue): AnyPortConfig {
    return AnyPortPlugin.deserializeConfig(data)
  }

  /**
   * Deserializes JSON data into an AnyPortValue.
   * Delegates to AnyPortPlugin.deserializeValue which handles
   * deserializing both the any port value and the underlying value.
   * @param data - The JSON data.
   * @returns The deserialized port value.
   */
  protected deserializeValue(data: JSONValue): AnyPortValue {
    return AnyPortPlugin.deserializeValue(data, this.config)
  }
}

/**
 * Helper function to create an AnyPortConfig.
 * This function helps ensure that the configuration object is constructed
 * with proper type inference.
 *
 * Example:
 *   const config = createAnyPortConfig({
 *     type: 'any',
 *     underlyingType: {
 *       type: 'string',
 *       minLength: 2,
 *     },
 *   })
 *
 * @param config - The any port configuration.
 * @returns The same configuration object.
 */
export function createAnyPortConfig(config: AnyPortConfig): AnyPortConfig {
  return config
}
