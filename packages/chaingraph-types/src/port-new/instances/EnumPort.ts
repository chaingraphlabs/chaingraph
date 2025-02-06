import type { JSONValue } from '../base/json'
import type { EnumPortConfig, EnumPortValue } from '../base/types'
import { BasePort } from '../base/BasePort'
import { EnumPortPlugin } from '../plugins/EnumPortPlugin'

/**
 * Concrete implementation of an Enum Port.
 *
 * This class extends BasePort using EnumPortConfig and EnumPortValue.
 * It leverages the EnumPortPlugin to handle validation, serialization,
 * and deserialization.
 *
 * The Enum port allows selecting one option from a list of possible options,
 * where each option is a valid port configuration. The selected value is
 * stored as the id of the chosen option.
 *
 * Example usage:
 *   const config: EnumPortConfig = {
 *     type: 'enum',
 *     options: [
 *       { type: 'string', id: 'opt1', name: 'Option 1' },
 *       { type: 'number', id: 'opt2', name: 'Option 2' },
 *     ],
 *     defaultValue: { type: 'enum', value: 'opt1' },
 *   }
 *
 *   const enumPort = new EnumPort(config)
 *   enumPort.setValue({ type: 'enum', value: 'opt2' })
 *   console.log(enumPort.getValue()) // => { type: 'enum', value: 'opt2' }
 */
export class EnumPort extends BasePort<EnumPortConfig> {
  constructor(config: EnumPortConfig) {
    const defaultUi = {
      bgColor: '#eedf3c',
      borderColor: '#443f17',
    }

    const mergedConfig = { ...config, ui: { ...defaultUi, ...config.ui } }
    super(mergedConfig)
  }

  /**
   * Returns the default value from the configuration.
   * @returns The default EnumPortValue if specified; otherwise undefined.
   */
  protected getDefaultValue(): EnumPortValue | undefined {
    return this.config.defaultValue
  }

  /**
   * Validates the enum port value.
   * Delegates to EnumPortPlugin.validateValue.
   * @param value - The enum port value to validate.
   * @returns True if valid; otherwise false.
   */
  protected validateValue(value: EnumPortValue): boolean {
    const errors = EnumPortPlugin.validateValue(value, this.config)
    return errors.length === 0
  }

  /**
   * Validates the enum port configuration.
   * Delegates to EnumPortPlugin.validateConfig.
   * @param config - The enum port configuration.
   * @returns True if valid; otherwise false.
   */
  protected validateConfig(config: EnumPortConfig): boolean {
    const errors = EnumPortPlugin.validateConfig(config)
    return errors.length === 0
  }

  /**
   * Serializes the enum port configuration.
   * Delegates to EnumPortPlugin.serializeConfig.
   * @param config - The enum port configuration.
   * @returns The serialized configuration.
   */
  protected serializeConfig(config: EnumPortConfig): JSONValue {
    return EnumPortPlugin.serializeConfig(config)
  }

  /**
   * Serializes the enum port value.
   * Delegates to EnumPortPlugin.serializeValue.
   * @param value - The enum port value.
   * @returns The serialized value.
   */
  protected serializeValue(value: EnumPortValue): JSONValue {
    return EnumPortPlugin.serializeValue(value, this.config)
  }

  /**
   * Deserializes JSON data into an EnumPortConfig.
   * Delegates to EnumPortPlugin.deserializeConfig.
   * @param data - The JSON data.
   * @returns The deserialized configuration.
   */
  protected deserializeConfig(data: JSONValue): EnumPortConfig {
    return EnumPortPlugin.deserializeConfig(data)
  }

  /**
   * Deserializes JSON data into an EnumPortValue.
   * Delegates to EnumPortPlugin.deserializeValue.
   * @param data - The JSON data.
   * @returns The deserialized port value.
   */
  protected deserializeValue(data: JSONValue): EnumPortValue {
    return EnumPortPlugin.deserializeValue(data, this.config)
  }
}

/**
 * Helper function to create an EnumPortConfig.
 * This function helps ensure that the configuration object is constructed
 * with proper type inference.
 *
 * Example:
 *   const config = createEnumPortConfig({
 *     type: 'enum',
 *     options: [
 *       { type: 'string', id: 'opt1', name: 'Option 1' },
 *       { type: 'number', id: 'opt2', name: 'Option 2' },
 *     ],
 *   })
 *
 * @param config - The enum port configuration.
 * @returns The same configuration object.
 */
export function createEnumPortConfig(config: EnumPortConfig): EnumPortConfig {
  return config
}
