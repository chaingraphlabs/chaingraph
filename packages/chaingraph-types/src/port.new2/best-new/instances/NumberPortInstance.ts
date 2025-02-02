import type { NumberPortConfig } from '../base/number-port-config'
import { BasePort } from '../base/port-instance'

/**
 * Concrete implementation of BasePort for number values.
 * Handles validation, serialization, and value management for number ports,
 * including constraints like min/max values, step increments, and integer requirements.
 */
export class NumberPortInstance extends BasePort<number> {
  /** The current value of the port */
  private value?: number

  /** The port configuration with number-specific options */
  protected readonly config: NumberPortConfig

  constructor(config: NumberPortConfig) {
    super(config)
    this.config = config
    // Initialize with default value if provided
    if (config.defaultValue !== undefined) {
      this.value = config.defaultValue
    }
  }

  /**
   * Returns the current number value of the port.
   * If no value is set, returns the default value from config.
   *
   * @returns The current number value, or undefined if no value or default is set
   */
  getValue(): number | undefined {
    return this.value ?? this.config.defaultValue
  }

  /**
   * Sets a new number value for the port after validation.
   * Validates against min/max bounds, step increments, and integer constraints.
   *
   * @param newValue - The new number value to set
   * @throws {Error} If the value is invalid or fails validation
   */
  setValue(newValue: number): void {
    if (!this.validate(newValue)) {
      throw new Error(`Invalid number value: ${newValue}`)
    }
    this.value = newValue
  }

  /**
   * Resets the port value to its default state.
   * If a default value is configured, the port will be reset to that value.
   * Otherwise, the value will be set to undefined.
   */
  reset(): void {
    this.value = this.config.defaultValue
  }

  /**
   * Serializes the current number value.
   * For number ports, this returns the number directly as it's already JSON-serializable.
   *
   * @returns The serialized number value, or null if no value is set
   */
  serialize(): unknown {
    return this.getValue() ?? null
  }

  /**
   * Deserializes and sets a previously serialized number value.
   *
   * @param serialized - The serialized value to deserialize
   * @throws {Error} If the serialized value is not a valid number or fails validation
   */
  deserialize(serialized: unknown): void {
    if (serialized === null || serialized === undefined) {
      this.value = undefined
      return
    }

    const num = typeof serialized === 'string' ? Number.parseFloat(serialized) : serialized

    if (!this.validate(num)) {
      throw new Error(`Invalid serialized number value: ${String(serialized)}`)
    }

    this.value = num
  }

  /**
   * Validates whether a given value is a valid number for this port.
   * Checks type, min/max bounds, step increments, and integer constraints.
   *
   * @param value - The value to validate
   * @returns true if the value is a valid number meeting all constraints
   */
  validate(value: unknown): value is number {
    // Basic number type check
    if (typeof value !== 'number' || !Number.isFinite(value)) {
      return false
    }

    const { min, max, step, integer } = this.config

    // Check integer constraint
    if (integer && !Number.isInteger(value)) {
      return false
    }

    // Check min/max bounds
    if (min !== undefined && value < min) {
      return false
    }
    if (max !== undefined && value > max) {
      return false
    }

    // Check step increment
    if (step !== undefined && step > 0) {
      // For integer steps, the value must be divisible by the step
      if (integer) {
        return Number.isInteger(value / step)
      }
      // For floating point steps, check if the value is within a small epsilon of a step
      const steps = value / step
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
