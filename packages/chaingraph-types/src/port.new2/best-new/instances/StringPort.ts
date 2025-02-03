import type { JSONValue } from '../base/json'
import type { StringPortConfig, StringPortValue } from '../base/types'
import { BasePort } from '../base/BasePort'

import { StringPortPlugin } from '../plugins/StringPortPlugin'

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
    return StringPortPlugin.serializeValue(value)
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
    return StringPortPlugin.deserializeValue(data)
  }
}
