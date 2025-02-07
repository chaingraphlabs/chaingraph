import type { IPort } from './IPort'
import type { JSONValue } from './json'
import type { ExtractValue, IPortConfig } from './types'

import { deepCopy } from '@badaitech/chaingraph-types/utils/deep-copy'
import { PortError, PortErrorType } from './types'

export abstract class BasePort<C extends IPortConfig = IPortConfig> implements IPort<C> {
  protected config: C
  protected value?: ExtractValue<C>

  constructor(config: C) {
    this.config = config
    // Optionally initialize with a default value if provided in config
    this.value = deepCopy(this.getDefaultValue())
  }

  get id(): string {
    return this.config.id ?? ''
  }

  getConfig(): C {
    return this.config
  }

  setConfig(newConfig: C): void {
    // You might optionally run validation here before setting new configuration
    this.config = newConfig
  }

  getValue(): ExtractValue<C> | undefined {
    return this.value
  }

  // plainValue(): UnwrapPortValue<ExtractValue<C>> | undefined {
  //   const value = this.getValue()
  //   return value !== undefined ? unwrapPortValue(value) : undefined
  // }
  //
  // mutableValue(): UnwrapPortValue<ExtractValue<C>> | undefined {
  //   return mutableUnwrapPortValueWithConfig(this.getValue(), this.config)
  // }

  setValue(newValue: ExtractValue<C>): void {
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
  deserialize(data: JSONValue): IPort<C> {
    if (typeof data !== 'object' || data === null) {
      throw new PortError(
        PortErrorType.SerializationError,
        'Invalid serialized data: expected a JSON object.',
      )
    }
    const obj = data as { config: JSONValue, value?: JSONValue }
    const config = this.deserializeConfig(obj.config)
    const value = this.deserializeValue(obj.value)

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
      const value = this.getValue()
      const valueValid = value === undefined ? true : this.validateValue(value)
      return configValid && valueValid
    } catch (error) {
      return false
    }
  }

  /**
   * Returns the default value.
   * Concrete implementations can use a default provided by the configuration.
   */
  protected abstract getDefaultValue(): ExtractValue<C> | undefined

  /**
   * Validates the port value.
   * Must return true if the value is valid, false otherwise.
   */
  protected abstract validateValue(value: ExtractValue<C>): boolean

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
  protected abstract serializeValue(value: ExtractValue<C>): JSONValue

  /**
   * Deserializes a JSONValue into a configuration object of type C.
   */
  protected abstract deserializeConfig(data: JSONValue): C

  /**
   * Deserializes a JSONValue into a port value of type T.
   */
  protected abstract deserializeValue(data: JSONValue): ExtractValue<C>
}
