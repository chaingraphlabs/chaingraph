import type { PortConfig } from '../base/new-port-config'
import { BasePort } from '../base/port-instance'

/**
 * Concrete implementation of BasePort for string values.
 * Handles validation, serialization, and value management for string ports.
 */
export class StringPortInstance extends BasePort<string> {
  /** The current value of the port */
  private value?: string

  constructor(config: PortConfig<string>) {
    super(config)
    // Initialize with default value if provided
    if (config.defaultValue !== undefined) {
      this.value = config.defaultValue
    }
  }

  /**
   * Returns the current string value of the port.
   * If no value is set, returns the default value from config.
   *
   * @returns The current string value, or undefined if no value or default is set
   */
  getValue(): string | undefined {
    return this.value ?? this.config.defaultValue
  }

  /**
   * Sets a new string value for the port after validation.
   *
   * @param newValue - The new string value to set
   * @throws {Error} If the value is invalid or validation fails
   */
  setValue(newValue: string): void {
    if (!this.validate(newValue)) {
      throw new Error(`Invalid string value: ${newValue}`)
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
   * Serializes the current string value.
   * For string ports, this is straightforward as strings are already JSON-serializable.
   *
   * @returns The serialized string value, or null if no value is set
   */
  serialize(): unknown {
    return this.getValue() ?? null
  }

  /**
   * Deserializes and sets a previously serialized string value.
   *
   * @param serialized - The serialized value to deserialize
   * @throws {Error} If the serialized value is not a valid string
   */
  deserialize(serialized: unknown): void {
    if (serialized === null || serialized === undefined) {
      this.value = undefined
      return
    }

    if (!this.validate(serialized)) {
      throw new Error(`Invalid serialized string value: ${String(serialized)}`)
    }

    this.value = serialized
  }

  /**
   * Validates whether a given value is a valid string for this port.
   *
   * @param value - The value to validate
   * @returns true if the value is a valid string, false otherwise
   */
  validate(value: unknown): value is string {
    // Basic string validation
    if (typeof value !== 'string') {
      return false
    }

    // If the port is not optional, empty strings are invalid
    if (!this.config.optional && value.trim() === '') {
      return false
    }

    // Additional validation could be added here:
    // - Pattern matching
    // - Length restrictions
    // - Character set validation
    // etc.

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
