import type { IPort } from './IPort'
import type { JSONValue } from './json'
import type { IPortConfig, IPortValue } from './types'
import { PortError, PortErrorType } from './types'

/**
 * BasePort is an abstract class that implements IPort.
 * It provides generic implementations for common methods:
 *
 * - getConfig, getValue, setConfig, reset, serialize, deserialize, and validate.
 *
 * The abstract class leaves the following methods to concrete subclasses:
 *
 * • getDefaultValue – returns a default value for the port (if applicable).
 * • validateValue – validates a port value T according to specific plugin or port constraints.
 * • validateConfig – validates the port configuration.
 * • serializeConfig, serializeValue – methods to convert config and value to JSONValue.
 * • deserializeConfig, deserializeValue – methods to convert JSONValue back to types C and T.
 *
 * @template C - A type extending IPortConfig.
 * @template T - A type extending IPortValue.
 */
export abstract class BasePort<C extends IPortConfig, T extends IPortValue> implements IPort<C, T> {
  protected config: C
  protected value?: T

  constructor(config: C) {
    this.config = config
    // Optionally initialize with a default value if provided in config
    this.value = this.getDefaultValue()
  }

  getConfig(): C {
    return this.config
  }

  setConfig(newConfig: C): void {
    // You might optionally run validation here before setting new configuration
    this.config = newConfig
  }

  getValue(): T | undefined {
    return this.value
  }

  setValue(newValue: T): void {
    if (!this.validateValue(newValue)) {
      throw new PortError(
        PortErrorType.ValidationError,
        'Value validation failed in setValue.',
      )
    }
    this.value = newValue
  }

  reset(): void {
    // Reset the current value. If a default is available in the config, return that.
    this.value = this.getDefaultValue()
  }

  /**
   * Serializes both config and value into a JSONValue–compatible object.
   * It calls the abstract serializeConfig and serializeValue methods.
   */
  serialize(): JSONValue {
    return {
      config: this.serializeConfig(this.config),
      value: this.value !== undefined ? this.serializeValue(this.value) : undefined,
    }
  }

  /**
   * Deserializes the given JSONValue (expected to hold { config, value })
   * and updates both the config and current value.
   */
  deserialize(data: JSONValue): IPort<C, T> {
    if (typeof data !== 'object' || data === null) {
      throw new PortError(
        PortErrorType.SerializationError,
        'Invalid serialized data: expected a JSON object.',
      )
    }
    const obj = data as { config: JSONValue, value?: JSONValue }
    const config = this.deserializeConfig(obj.config)
    const value = obj.value !== undefined ? this.deserializeValue(obj.value) : undefined

    return {
      ...this,
      config,
      value,
    }
  }

  /**
   * Validates both the current configuration and value.
   * It defers to the abstract validateConfig and validateValue methods.
   */
  validate(): boolean {
    try {
      const configValid = this.validateConfig(this.config)
      const valueValid = this.value === undefined ? true : this.validateValue(this.value)
      return configValid && valueValid
    } catch (error) {
      return false
    }
  }

  /**
   * Returns the default value.
   * Concrete implementations can use a default provided by the configuration.
   */
  protected abstract getDefaultValue(): T | undefined

  /**
   * Validates the port value.
   * Must return true if the value is valid, false otherwise.
   */
  protected abstract validateValue(value: T): boolean

  /**
   * Validates the port configuration.
   * Must return true if the configuration is valid, false otherwise.
   */
  protected abstract validateConfig(config: C): boolean

  /**
   * Serializes the configuration (of type C) to a JSONValue.
   */
  protected abstract serializeConfig(config: C): JSONValue

  /**
   * Serializes the port value (of type T) to a JSONValue.
   */
  protected abstract serializeValue(value: T): JSONValue

  /**
   * Deserializes a JSONValue into a configuration object of type C.
   */
  protected abstract deserializeConfig(data: JSONValue): C

  /**
   * Deserializes a JSONValue into a port value of type T.
   */
  protected abstract deserializeValue(data: JSONValue): T
}
