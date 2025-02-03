import type { JSONValue } from '../base/json'
import type { NumberPortConfig, NumberPortValue } from '../base/types'
import { BasePort } from '../base/BasePort'
import { NumberPortPlugin } from '../plugins/NumberPortPlugin'

/**
 * Concrete implementation of a Number Port.
 *
 * This class extends the BasePort with NumberPortConfig and NumberPortValue.
 * It leverages the NumberPortPlugin to handle validation, serialization,
 * deserialization, and default value retrieval.
 *
 * Example usage:
 *   const config: NumberPortConfig = {
 *     type: 'number',
 *     min: 0,
 *     max: 100,
 *     step: 2,
 *     integer: true,
 *     defaultValue: { type: 'number', value: 42 },
 *   }
 *
 *   const numberPort = new NumberPort(config)
 *   numberPort.setValue({ type: 'number', value: 50 })
 *   console.log(numberPort.getValue()) // => { type: 'number', value: 50 }
 */
export class NumberPort extends BasePort<NumberPortConfig> {
  constructor(config: NumberPortConfig) {
    const defaultUi = {
      bgColor: '#1f5eec',
      borderColor: '#0c2454',
    }
    const mergedConfig = { ...config, ui: { ...defaultUi, ...config.ui } }
    super(mergedConfig)
  }

  /**
   * Retrieves the default value from the configuration.
   *
   * @returns The default number value if provided; otherwise, undefined.
   */
  protected getDefaultValue(): NumberPortValue | undefined {
    return this.config.defaultValue
  }

  /**
   * Validates the provided number port value against the current configuration.
   * Delegates the validation logic to the NumberPortPlugin.
   *
   * @param value - The number port value to validate.
   * @returns True if the value is valid; otherwise, false.
   */
  protected validateValue(value: NumberPortValue): boolean {
    const errors = NumberPortPlugin.validateValue(value, this.config)
    return errors.length === 0
  }

  /**
   * Validates the number port configuration.
   * Delegates configuration validation to the NumberPortPlugin.
   *
   * @param config - The number port configuration.
   * @returns True if the configuration is valid; otherwise, false.
   */
  protected validateConfig(config: NumberPortConfig): boolean {
    const errors = NumberPortPlugin.validateConfig(config)
    return errors.length === 0
  }

  /**
   * Serializes the current number port configuration into a JSON-compatible object.
   * Delegates to the NumberPortPlugin.
   *
   * @param config - The number port configuration to serialize.
   * @returns The serialized configuration as a JSONValue.
   */
  protected serializeConfig(config: NumberPortConfig): JSONValue {
    return NumberPortPlugin.serializeConfig(config)
  }

  /**
   * Serializes the provided number port value into a JSON-compatible object.
   * Delegates the serialization logic to the NumberPortPlugin.
   *
   * @param value - The number port value to serialize.
   * @returns The serialized value as a JSONValue.
   */
  protected serializeValue(value: NumberPortValue): JSONValue {
    return NumberPortPlugin.serializeValue(value)
  }

  /**
   * Deserializes the provided JSON data into a number port configuration.
   * Delegates the deserialization logic to the NumberPortPlugin.
   *
   * @param data - The JSON data representing the configuration.
   * @returns The deserialized NumberPortConfig.
   */
  protected deserializeConfig(data: JSONValue): NumberPortConfig {
    return NumberPortPlugin.deserializeConfig(data)
  }

  /**
   * Deserializes the given JSON data into a number port value.
   * Delegates this task to the NumberPortPlugin.
   *
   * @param data - The JSON data representing the value.
   * @returns The deserialized NumberPortValue.
   */
  protected deserializeValue(data: JSONValue): NumberPortValue {
    return NumberPortPlugin.deserializeValue(data)
  }
}
