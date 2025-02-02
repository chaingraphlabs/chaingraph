import type { IPort } from '../base/IPort'
import type { StringPortConfig, StringPortValue } from '../base/types'
import {
  isStringPortConfig,
  PortError,
  PortErrorType,
} from '../base/types'

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

    // Store the current value
    const currentValue = this.value

    // Update the configuration
    this.config = newConfig

    // If there was a value, validate it against the new configuration
    if (currentValue !== undefined) {
      if (!this.validateValue(currentValue)) {
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

    if (!this.validateValue(newValue)) {
      throw new PortError(
        PortErrorType.ValidationError,
        `Invalid string value: ${newValue.value}`,
      )
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
   */
  serialize(): {
    config: StringPortConfig
    value: StringPortValue | undefined
  } {
    return {
      config: this.config,
      value: this.value,
    }
  }

  /**
   * Deserializes both configuration and value from a previously serialized object.
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
      if (typeof value !== 'object' || value === null) {
        throw new PortError(
          PortErrorType.SerializationError,
          'Invalid serialized data: invalid value format',
        )
      }
      this.setValue(value as StringPortValue)
    } else {
      this.reset()
    }
  }

  /**
   * Validates both the current configuration and value.
   *
   * @returns true if both config and value are valid, false otherwise
   */
  validate(): boolean {
    // First validate the configuration
    if (!isStringPortConfig(this.config)) {
      return false
    }

    // If no value is set, validation always passes
    if (this.value === undefined) {
      return true
    }

    // Validate the current value
    return this.validateValue(this.value)
  }

  /**
   * Validates a string port value against the current configuration.
   *
   * @param value - The value to validate
   * @returns true if the value is valid according to the configuration
   */
  private validateValue(value: StringPortValue): boolean {
    if (value.type !== 'string') {
      return false
    }

    const str = value.value

    // Basic string validation
    if (typeof str !== 'string') {
      return false
    }

    // Check length constraints
    const { minLength, maxLength, pattern } = this.config
    if (minLength !== undefined && str.length < minLength) {
      return false
    }
    if (maxLength !== undefined && str.length > maxLength) {
      return false
    }

    // Check pattern if specified
    if (pattern !== undefined) {
      try {
        const regex = new RegExp(pattern)
        if (!regex.test(str)) {
          return false
        }
      } catch {
        // Invalid regex pattern in config
        return false
      }
    }

    return true
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
