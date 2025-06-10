/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { JSONValue } from '../../utils/json'
import type { IPort, StringPortConfig, StringPortValue } from '../base'
import { BasePort } from '../base'
import { generatePortID } from '../id-generate'
import { StringPortPlugin } from '../plugins'

/**
 * Concrete StringPort implementation that extends BasePort.
 *
 * This implementation reuses the validation, serialization,
 * and deserialization logic available in the StringPortPlugin.
 *
 * The plugin functions are used to:
 *  • Create a default value – if a defaultValue is provided in the config.
 *  • Validate the value using the plugin's validate function (if available).
 *  • Serialize and deserialize both the configuration and value.
 *
 * @example
 * const config: StringPortConfig = {
 *   type: 'string',
 *   minLength: 3,
 *   maxLength: 50,
 *   pattern: '^[A-Za-z ]+$',
 *   defaultValue: { type: 'string', value: 'Hello' },
 * }
 *
 * const port = new StringPort(config)
 * port.setValue({ type: 'string', value: 'John Doe' })
 * console.log(port.getValue()) // => { type: 'string', value: 'John Doe' }
 */
export class StringPort extends BasePort<StringPortConfig> {
  constructor(config: StringPortConfig) {
    const defaultUi = {
      bgColor: '#e70d0d',
      borderColor: '#460707',
    }

    const mergedConfig = { ...config, ui: { ...defaultUi, ...config.ui } }
    super(mergedConfig)
  }

  /**
   * Returns the default value using the plugin's helper.
   */
  protected getDefaultValue(): StringPortValue | undefined {
    return this.config.defaultValue
  }

  /**
   * Validates the string port value.
   * Delegates to the StringPortPlugin.validateValue method
   */
  protected validateValue(value: StringPortValue): boolean {
    const errors = StringPortPlugin.validateValue(value, this.config)
    return errors.length === 0
  }

  /**
   * Validates the string port configuration.
   */
  protected validateConfig(config: StringPortConfig): boolean {
    const errors = StringPortPlugin.validateConfig(config)
    return errors.length === 0
  }

  /**
   * Serializes the configuration by delegating to the StringPortPlugin's serializeConfig.
   */
  protected serializeConfig(config: StringPortConfig): JSONValue {
    return StringPortPlugin.serializeConfig(config)
  }

  /**
   * Serializes the string port value by delegating to the StringPortPlugin.serializeValue.
   */
  protected serializeValue(value: StringPortValue): JSONValue {
    return StringPortPlugin.serializeValue(value, this.config)
  }

  /**
   * Deserializes the configuration using the StringPortPlugin.deserializeConfig.
   */
  protected deserializeConfig(data: JSONValue): StringPortConfig {
    return StringPortPlugin.deserializeConfig(data)
  }

  /**
   * Deserializes the string port value using the StringPortPlugin.deserializeValue.
   */
  protected deserializeValue(data: JSONValue): StringPortValue {
    return StringPortPlugin.deserializeValue(data, this.config)
  }

  /**
   * Clones the port with a new ID.
   * Useful for creating copies of the port with a unique identifier.
   */
  cloneWithNewId(): IPort<StringPortConfig> {
    return new StringPort({
      ...this.config,
      id: generatePortID(this.config.key || this.config.id || ''),
    })
  }
}
