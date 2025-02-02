import type { PortConfig } from './new-port-config'

/**
 * Unified port instance interface that serves as an adapter between
 * the new port system and legacy code. This abstract class defines
 * the common API that all port types must implement.
 *
 * @template T The type of value this port handles
 */
export abstract class BasePort<T> {
  /**
   * The configuration object for this port instance.
   * Contains all the port's metadata and settings.
   */
  protected readonly config: PortConfig<T>

  constructor(config: PortConfig<T>) {
    this.config = config
  }

  /**
   * Retrieves the current value of the port.
   * If no value has been set and a default value exists in the config,
   * returns the default value.
   *
   * @returns The current value of the port, or undefined if no value is set
   */
  abstract getValue(): T | undefined

  /**
   * Updates the port's value.
   * Implementations should validate the new value before setting it.
   *
   * @param newValue - The new value to set
   * @throws {Error} If the value is invalid for this port type
   */
  abstract setValue(newValue: T): void

  /**
   * Resets the port to its initial state.
   * If a default value is specified in the config, the port will be reset to that value.
   * Otherwise, the value will be set to undefined.
   */
  abstract reset(): void

  /**
   * Serializes the port's current value to a JSON-compatible format.
   * This is useful for persistence and network transmission.
   *
   * @returns A JSON-serializable representation of the port's value
   */
  abstract serialize(): unknown

  /**
   * Deserializes a previously serialized value and sets it as the port's current value.
   *
   * @param serialized - The serialized value to deserialize
   * @throws {Error} If the serialized value is invalid or cannot be deserialized
   */
  abstract deserialize(serialized: unknown): void

  /**
   * Returns the port's configuration object.
   * This is useful for introspection and metadata access.
   *
   * @returns The port's configuration
   */
  getConfig(): PortConfig<T> {
    return this.config
  }

  /**
   * Validates whether a given value is valid for this port type.
   * This is called internally by setValue but can also be used
   * for pre-validation.
   *
   * @param value - The value to validate
   * @returns true if the value is valid, false otherwise
   */
  abstract validate(value: unknown): value is T
}

/**
 * Type guard to check if an object implements the BasePort interface.
 * Useful for runtime type checking of port instances.
 *
 * @param obj - The object to check
 * @returns true if the object implements BasePort
 */
export function isBasePort(obj: unknown): obj is BasePort<unknown> {
  return (
    obj !== null
    && typeof obj === 'object'
    && 'getValue' in obj
    && 'setValue' in obj
    && 'reset' in obj
    && 'serialize' in obj
    && 'deserialize' in obj
    && 'validate' in obj
  )
}
