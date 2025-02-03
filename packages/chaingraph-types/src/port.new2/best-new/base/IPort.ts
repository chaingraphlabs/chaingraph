import type { JSONValue } from './json'
import type { IPortConfig, IPortValue } from './types'

/**
 * IPort interface represents a complete port instance that includes both
 * configuration and value handling. Both the configuration (C) and port value (T)
 * must be serializable to JSON. To facilitate that, our serialization methods work
 * with the type JSONValue.
 *
 * @template C - A type extending IPortConfig.
 * @template T - A type extending IPortValue.
 */
export interface IPort<C extends IPortConfig, T extends IPortValue> {
  /**
   * Retrieves the port's configuration object.
   *
   * @returns The port's strongly typed configuration object
   */
  getConfig: () => C

  /**
   * Updates the port's configuration.
   * This should trigger validation of the current value against the new configuration.
   *
   * @param newConfig - The new configuration to apply (must conform to type C)
   * @throws {PortError} If the configuration is invalid or incompatible with the port type
   */
  setConfig: (newConfig: C) => void

  /**
   * Retrieves the current value of the port.
   * If no value has been set and a default value exists in the config,
   * returns the default value.
   *
   * @returns The current value of the port (of type T) or undefined if no value is set
   */
  getValue: () => T | undefined

  /**
   * Updates the port's value.
   * The new value will be validated against the port's configuration.
   *
   * @param newValue - The new value to set (must conform to type T)
   * @throws {PortError} If the value is invalid according to the configuration
   */
  setValue: (newValue: T) => void

  /**
   * Resets the port to its initial state.
   * If a default value is specified in the configuration, the port is reset to that value.
   * Otherwise, the value is set to undefined.
   */
  reset: () => void

  /**
   * Serializes both the port's configuration and its current value into a single object.
   * The resulting data is expected to be completely JSON–serializable, i.e. using JSONValue.
   *
   * Example serialized output:
   * {
   *   config: { type: "string", id: "name", minLength: 3, maxLength: 50 },
   *   value: { type: "string", value: "John Doe" }
   * }
   *
   * @returns An object with the port's configuration and value as JSONValue.
   */
  serialize: () => JSONValue

  /**
   * Deserializes the port using previously serialized JSON–compatible data.
   * The object provided should contain both a configuration (config) and a value (value).
   * After successful deserialization, both the port's configuration and its current value
   * are updated accordingly.
   *
   * @param data - The JSONValue containing the serialized port data.
   * @throws {PortError} If the data is invalid or cannot be deserialized.
   */
  deserialize: (data: JSONValue) => IPort<C, T>

  /**
   * Validates both the current configuration and value of the port.
   *
   * @returns true if both configuration and value are valid; otherwise, false.
   */
  validate: () => boolean
}

/**
 * Type guard to check if an object implements the IPort interface.
 * Useful for runtime type checking of port instances.
 *
 * @param obj - The object to check
 * @returns true if the object implements IPort with any valid config and value types
 */
export function isIPort(obj: unknown): obj is IPort<IPortConfig, IPortValue> {
  return (
    obj !== null
    && typeof obj === 'object'
    && 'getConfig' in obj
    && 'setConfig' in obj
    && 'getValue' in obj
    && 'setValue' in obj
    && 'reset' in obj
    && 'serialize' in obj
    && 'deserialize' in obj
    && 'validate' in obj
  )
}
