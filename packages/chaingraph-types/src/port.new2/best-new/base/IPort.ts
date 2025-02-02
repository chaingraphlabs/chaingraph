import type { IPortConfig, IPortValue } from './types'

/**
 * Interface representing a complete port instance that includes both
 * configuration and value handling. This interface serves as the main
 * external API for the port system.
 *
 * @template C - The type of port configuration, which must extend IPortConfig.
 *               This ensures that each port has a strongly typed configuration
 *               (e.g., StringPortConfig, NumberPortConfig, etc.).
 * @template T - The type of port value, which must extend IPortValue.
 *               This ensures that all port values conform to our type system
 *               (e.g., StringPortValue, NumberPortValue, etc.).
 *
 * Example usage:
 * ```typescript
 * // String port with specific config and value types
 * const stringPort: IPort<StringPortConfig, StringPortValue> = ...
 *
 * // Number port with specific config and value types
 * const numberPort: IPort<NumberPortConfig, NumberPortValue> = ...
 * ```
 */
export interface IPort<C extends IPortConfig, T extends IPortValue> {
  /**
   * Retrieves the port's configuration object.
   * This includes all metadata and validation rules.
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
   * @returns The current value of the port (of type T extending IPortValue),
   *          or undefined if no value is set
   */
  getValue: () => T | undefined

  /**
   * Updates the port's value.
   * The new value will be validated against the port's configuration.
   *
   * @param newValue - The new value to set (must conform to type T extending IPortValue)
   * @throws {PortError} If the value is invalid according to the configuration
   */
  setValue: (newValue: T) => void

  /**
   * Resets the port to its initial state.
   * If a default value is specified in the config, the port will be reset to that value.
   * Otherwise, the value will be set to undefined.
   */
  reset: () => void

  /**
   * Serializes both the port's configuration and current value into a single object.
   * This is useful for persistence and network transmission.
   *
   * Example serialized output for a string port:
   * {
   *   config: {
   *     type: "string",
   *     id: "name",
   *     minLength: 3,
   *     maxLength: 50,
   *     defaultValue: "John"
   *   },
   *   value: {
   *     type: "string",
   *     value: "John Doe"
   *   }
   * }
   *
   * Example serialized output for a number port:
   * {
   *   config: {
   *     type: "number",
   *     id: "age",
   *     min: 0,
   *     max: 120,
   *     defaultValue: 18
   *   },
   *   value: {
   *     type: "number",
   *     value: 25
   *   }
   * }
   *
   * @returns A JSON-serializable object containing both config and value
   */
  serialize: () => {
    config: C
    value: T | undefined
  }

  /**
   * Deserializes both configuration and value from a previously serialized object.
   * This will update both the port's configuration and its value.
   *
   * Example input format for a string port:
   * {
   *   config: {
   *     type: "string",
   *     id: "name",
   *     minLength: 3,
   *     maxLength: 50,
   *     defaultValue: "John"
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
  deserialize: (data: unknown) => void

  /**
   * Validates both the current configuration and value.
   * This ensures that both the configuration is valid and the current value
   * satisfies all constraints defined in the configuration.
   *
   * @returns true if both config and value are valid, false otherwise
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
