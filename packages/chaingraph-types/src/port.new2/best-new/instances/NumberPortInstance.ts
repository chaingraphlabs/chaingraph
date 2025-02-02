import type { IPort } from '../base/IPort'
import type { NumberPortConfig, NumberPortValue } from '../base/types'
import {
  isNumberPortConfig,
  PortError,
  PortErrorType,
} from '../base/types'

/**
 * Concrete implementation of IPort for number values.
 * Handles validation, serialization, and value management for number ports,
 * including constraints like min/max values, step increments, and integer requirements.
 *
 * Example usage:
 * ```typescript
 * const port = new NumberPortInstance({
 *   type: 'number',
 *   id: 'age',
 *   min: 0,
 *   max: 120,
 *   integer: true
 * });
 *
 * port.setValue({ type: 'number', value: 25 });
 * const value = port.getValue(); // { type: 'number', value: 25 }
 * ```
 */
export class NumberPortInstance implements IPort<NumberPortConfig, NumberPortValue> {
  /** The current value of the port */
  private value?: NumberPortValue

  /** The port configuration with number-specific options */
  private config: NumberPortConfig

  constructor(config: NumberPortConfig) {
    this.config = config
  }

  /**
   * Returns the port's configuration object.
   *
   * @returns The strongly typed number port configuration
   */
  getConfig(): NumberPortConfig {
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
  setConfig(newConfig: NumberPortConfig): void {
    if (!isNumberPortConfig(newConfig)) {
      throw new PortError(
        PortErrorType.ValidationError,
        'Invalid number port configuration',
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
   * Returns the current number value of the port.
   *
   * @returns The current NumberPortValue, or undefined if no value is set
   */
  getValue(): NumberPortValue | undefined {
    return this.value
  }

  /**
   * Sets a new number value for the port after validation.
   *
   * @param newValue - The new NumberPortValue to set
   * @throws {PortError} If the value is invalid according to the configuration
   */
  setValue(newValue: NumberPortValue): void {
    if (newValue.type !== 'number') {
      throw new PortError(
        PortErrorType.TypeError,
        `Expected number value, got ${newValue.type}`,
      )
    }

    if (!this.validateValue(newValue)) {
      throw new PortError(
        PortErrorType.ValidationError,
        `Invalid number value: ${newValue.value}`,
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
   *     type: "number",
   *     id: "age",
   *     min: 0,
   *     max: 120,
   *     integer: true
   *   },
   *   value: {
   *     type: "number",
   *     value: 25
   *   }
   * }
   *
   * @returns A JSON-serializable object containing both config and value
   */
  serialize(): {
    config: NumberPortConfig
    value: NumberPortValue | undefined
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
   *     type: "number",
   *     id: "age",
   *     min: 0,
   *     max: 120,
   *     integer: true
   *   },
   *   value: {
   *     type: "number",
   *     value: 25
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
    this.setConfig(config as NumberPortConfig)

    // Then set the value if provided
    if (value !== undefined) {
      if (typeof value !== 'object' || value === null) {
        throw new PortError(
          PortErrorType.SerializationError,
          'Invalid serialized data: invalid value format',
        )
      }
      this.setValue(value as NumberPortValue)
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
    if (!isNumberPortConfig(this.config)) {
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
   * Validates a number port value against the current configuration.
   *
   * @param value - The value to validate
   * @returns true if the value is valid according to the configuration
   */
  private validateValue(value: NumberPortValue): boolean {
    if (value.type !== 'number') {
      return false
    }

    const num = value.value

    // Basic number validation
    if (typeof num !== 'number' || !Number.isFinite(num)) {
      return false
    }

    const { min, max, step, integer } = this.config

    // Check integer constraint
    if (integer && !Number.isInteger(num)) {
      return false
    }

    // Check min/max bounds
    if (min !== undefined && num < min) {
      return false
    }
    if (max !== undefined && num > max) {
      return false
    }

    // Check step increment
    if (step !== undefined && step > 0) {
      // For integer steps, the value must be divisible by the step
      if (integer) {
        return Number.isInteger(num / step)
      }
      // For floating point steps, check if the value is within a small epsilon of a step
      const steps = num / step
      const roundedSteps = Math.round(steps)
      const epsilon = 1e-10 // Small number to account for floating point imprecision
      return Math.abs(steps - roundedSteps) < epsilon
    }

    return true
  }

  /**
   * Type guard to check if an object is a NumberPortInstance.
   *
   * @param obj - The object to check
   * @returns true if the object is a NumberPortInstance
   */
  static isNumberPortInstance(obj: unknown): obj is NumberPortInstance {
    return obj instanceof NumberPortInstance
  }
}
