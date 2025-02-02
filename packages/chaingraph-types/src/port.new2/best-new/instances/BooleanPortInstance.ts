import type { IPort } from '../base/IPort'
import type { BooleanPortConfig, BooleanPortValue } from '../base/types'
import {
  isBooleanPortConfig,
  PortError,
  PortErrorType,
} from '../base/types'

/**
 * Concrete implementation of IPort for boolean values.
 * Handles validation, serialization, and value management for boolean ports.
 *
 * Example usage:
 * ```typescript
 * const port = new BooleanPortInstance({
 *   type: 'boolean',
 *   id: 'isEnabled',
 *   defaultValue: false
 * });
 *
 * port.setValue({ type: 'boolean', value: true });
 * const value = port.getValue(); // { type: 'boolean', value: true }
 * ```
 */
export class BooleanPortInstance implements IPort<BooleanPortConfig, BooleanPortValue> {
  /** The current value of the port */
  private value?: BooleanPortValue

  /** The port configuration with boolean-specific options */
  private config: BooleanPortConfig

  constructor(config: BooleanPortConfig) {
    this.config = config
    if (config.defaultValue !== undefined) {
      this.value = {
        type: 'boolean',
        value: config.defaultValue,
      }
    }
  }

  /**
   * Returns the port's configuration object.
   *
   * @returns The strongly typed boolean port configuration
   */
  getConfig(): BooleanPortConfig {
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
  setConfig(newConfig: BooleanPortConfig): void {
    if (!isBooleanPortConfig(newConfig)) {
      throw new PortError(
        PortErrorType.ValidationError,
        'Invalid boolean port configuration',
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

    // Set default value if provided in new config
    if (this.value === undefined && newConfig.defaultValue !== undefined) {
      this.value = {
        type: 'boolean',
        value: newConfig.defaultValue,
      }
    }
  }

  /**
   * Returns the current boolean value of the port.
   *
   * @returns The current BooleanPortValue, or undefined if no value is set
   */
  getValue(): BooleanPortValue | undefined {
    return this.value
  }

  /**
   * Sets a new boolean value for the port after validation.
   *
   * @param newValue - The new BooleanPortValue to set
   * @throws {PortError} If the value is invalid according to the configuration
   */
  setValue(newValue: BooleanPortValue): void {
    if (newValue.type !== 'boolean') {
      throw new PortError(
        PortErrorType.TypeError,
        `Expected boolean value, got ${newValue.type}`,
      )
    }

    if (!this.validateValue(newValue)) {
      throw new PortError(
        PortErrorType.ValidationError,
        `Invalid boolean value: ${newValue.value}`,
      )
    }

    this.value = newValue
  }

  /**
   * Resets the port value to the default value from config if available,
   * otherwise to undefined.
   */
  reset(): void {
    if (this.config.defaultValue !== undefined) {
      this.value = {
        type: 'boolean',
        value: this.config.defaultValue,
      }
    } else {
      this.value = undefined
    }
  }

  /**
   * Serializes both the port's configuration and current value into a single object.
   *
   * Example serialized output:
   * {
   *   config: {
   *     type: "boolean",
   *     id: "isEnabled",
   *     defaultValue: false
   *   },
   *   value: {
   *     type: "boolean",
   *     value: true
   *   }
   * }
   *
   * @returns A JSON-serializable object containing both config and value
   */
  serialize(): {
    config: BooleanPortConfig
    value: BooleanPortValue | undefined
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
   *     type: "boolean",
   *     id: "isEnabled",
   *     defaultValue: false
   *   },
   *   value: {
   *     type: "boolean",
   *     value: true
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
    this.setConfig(config as BooleanPortConfig)

    // Then set the value if provided
    if (value !== undefined) {
      if (typeof value !== 'object' || value === null) {
        throw new PortError(
          PortErrorType.SerializationError,
          'Invalid serialized data: invalid value format',
        )
      }
      this.setValue(value as BooleanPortValue)
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
    if (!isBooleanPortConfig(this.config)) {
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
   * Validates a boolean port value.
   *
   * @param value - The value to validate
   * @returns true if the value is valid according to the configuration
   */
  private validateValue(value: BooleanPortValue): boolean {
    if (value.type !== 'boolean') {
      return false
    }

    return typeof value.value === 'boolean'
  }

  /**
   * Type guard to check if an object is a BooleanPortInstance.
   *
   * @param obj - The object to check
   * @returns true if the object is a BooleanPortInstance
   */
  static isBooleanPortInstance(obj: unknown): obj is BooleanPortInstance {
    return obj instanceof BooleanPortInstance
  }
}
