import type { IPort } from '../base/IPort'
import type { StringPortConfig, StringPortValue } from '../base/types'
import {
  isStringPortConfig,
  PortError,
  PortErrorType,
} from '../base/types'
import { portRegistry } from '../registry/PortRegistry'

/**
 * Concrete implementation of IPort for string values.
 * Handles validation, serialization, and value management for string ports.
 *
 * Example usage:
 * ```typescript
 * const port = new StringPortInstance({
 *   type: 'string',
 *   id: 'name',
 *   minLength: 3,
 *   maxLength: 50
 * });
 *
 * port.setValue({ type: 'string', value: 'John Doe' });
 * const value = port.getValue(); // { type: 'string', value: 'John Doe' }
 * ```
 */
export class StringPortInstance implements IPort<StringPortConfig, StringPortValue> {
  /** The current value of the port */
  private value?: StringPortValue

  /** The port configuration with string-specific options */
  private config: StringPortConfig

  constructor(config: StringPortConfig) {
    this.config = config
  }

  /**
   * Returns the port's configuration object.
   *
   * @returns The strongly typed string port configuration
   */
  getConfig(): StringPortConfig {
    return this.config
  }

  /**
   * Updates the port's configuration.
   * This will validate the new configuration and ensure the current value
   * remains valid under the new configuration.
   *
   * @param newConfig - The new configuration to apply
   * @throws {PortError} If the configuration is invalid or incompatible
   */
  setConfig(newConfig: StringPortConfig): void {
    if (!isStringPortConfig(newConfig)) {
      throw new PortError(
        PortErrorType.ValidationError,
        'Invalid string port configuration',
      )
    }

    // Validate config using plugin
    const plugin = portRegistry.getPlugin('string')
    if (!plugin) {
      throw new PortError(
        PortErrorType.RegistryError,
        'String port plugin not found',
      )
    }

    try {
      plugin.configSchema.parse(newConfig)
    } catch (error) {
      throw new PortError(
        PortErrorType.ValidationError,
        'Invalid string port configuration',
        error,
      )
    }

    // Store the current value
    const currentValue = this.value

    // Update the configuration
    this.config = newConfig

    // If there was a value, validate it against the new configuration
    if (currentValue !== undefined) {
      const plugin = portRegistry.getPlugin('string')
      if (!plugin || (plugin.validate && plugin.validate(currentValue, newConfig).length > 0)) {
        // If the current value is invalid under the new config, reset it
        this.value = undefined
      }
    }
  }

  /**
   * Returns the current string value of the port.
   *
   * @returns The current StringPortValue, or undefined if no value is set
   */
  getValue(): StringPortValue | undefined {
    return this.value
  }

  /**
   * Sets a new string value for the port after validation.
   *
   * @param newValue - The new StringPortValue to set
   * @throws {PortError} If the value is invalid according to the configuration
   */
  setValue(newValue: StringPortValue): void {
    if (newValue.type !== 'string') {
      throw new PortError(
        PortErrorType.TypeError,
        `Expected string value, got ${newValue.type}`,
      )
    }

    const plugin = portRegistry.getPlugin('string')
    if (!plugin) {
      throw new PortError(
        PortErrorType.RegistryError,
        'String port plugin not found',
      )
    }

    // Validate value using plugin
    try {
      plugin.valueSchema.parse(newValue)
    } catch (error) {
      throw new PortError(
        PortErrorType.ValidationError,
        'Invalid string value format',
        error,
      )
    }

    // Validate against config constraints
    if (plugin.validate) {
      const errors = plugin.validate(newValue, this.config)
      if (errors.length > 0) {
        throw new PortError(
          PortErrorType.ValidationError,
          errors.join('; '),
        )
      }
    }

    this.value = newValue
  }

  /**
   * Resets the port value to undefined.
   */
  reset(): void {
    this.value = undefined
  }

  /**
   * Serializes both the port's configuration and current value into a single object.
   * Uses the string port plugin to serialize the value.
   *
   * Example serialized output:
   * {
   *   config: {
   *     type: "string",
   *     id: "name",
   *     minLength: 3,
   *     maxLength: 50
   *   },
   *   value: {
   *     type: "string",
   *     value: "John Doe"
   *   }
   * }
   *
   * @returns A JSON-serializable object containing both config and value
   * @throws {PortError} If serialization fails or plugin is not found
   */
  serialize(): {
    config: StringPortConfig
    value: StringPortValue | undefined
  } {
    const plugin = portRegistry.getPlugin('string')
    if (!plugin) {
      throw new PortError(
        PortErrorType.RegistryError,
        'String port plugin not found',
      )
    }

    return {
      config: this.config,
      value: this.value ? plugin.serializeValue(this.value) as StringPortValue : undefined,
    }
  }

  /**
   * Deserializes both configuration and value from a previously serialized object.
   * Uses the string port plugin to deserialize the value.
   *
   * Example input format:
   * {
   *   config: {
   *     type: "string",
   *     id: "name",
   *     minLength: 3,
   *     maxLength: 50
   *   },
   *   value: {
   *     type: "string",
   *     value: "John Doe"
   *   }
   * }
   *
   * @param data - The serialized port data containing both config and value
   * @throws {PortError} If the data is invalid or cannot be deserialized
   */
  deserialize(data: unknown): void {
    if (!data || typeof data !== 'object') {
      throw new PortError(
        PortErrorType.SerializationError,
        'Invalid serialized data: expected an object',
      )
    }

    const { config, value } = data as {
      config?: unknown
      value?: unknown
    }

    // Config is required
    if (!config || typeof config !== 'object') {
      throw new PortError(
        PortErrorType.SerializationError,
        'Invalid serialized data: missing or invalid config',
      )
    }

    // Update configuration first
    this.setConfig(config as StringPortConfig)

    // Then set the value if provided
    if (value !== undefined) {
      const plugin = portRegistry.getPlugin('string')
      if (!plugin) {
        throw new PortError(
          PortErrorType.RegistryError,
          'String port plugin not found',
        )
      }

      try {
        const deserializedValue = plugin.deserializeValue(value) as StringPortValue
        this.setValue(deserializedValue)
      } catch (error) {
        throw new PortError(
          PortErrorType.SerializationError,
          'Failed to deserialize string value',
          error,
        )
      }
    } else {
      this.reset()
    }
  }

  /**
   * Validates both the current configuration and value using the string port plugin.
   *
   * @returns true if both config and value are valid, false otherwise
   */
  validate(): boolean {
    const plugin = portRegistry.getPlugin('string')
    if (!plugin) {
      return false
    }

    try {
      // Validate config
      plugin.configSchema.parse(this.config)

      // If no value is set, validation passes
      if (this.value === undefined) {
        return true
      }

      // Validate value format
      plugin.valueSchema.parse(this.value)

      // Validate value against config constraints
      if (plugin.validate) {
        const errors = plugin.validate(this.value, this.config)
        return errors.length === 0
      }

      return true
    } catch {
      return false
    }
  }

  /**
   * Type guard to check if an object is a StringPortInstance.
   *
   * @param obj - The object to check
   * @returns true if the object is a StringPortInstance
   */
  static isStringPortInstance(obj: unknown): obj is StringPortInstance {
    return obj instanceof StringPortInstance
  }
}
