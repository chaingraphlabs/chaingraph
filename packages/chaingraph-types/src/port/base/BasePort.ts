/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { ExtractValue, IPort, IPortConfig } from '../../port'
import type { JSONValue } from '../../utils/json'
import { PortError, PortErrorType } from '../../port'
import { deepCopy } from '../../utils/deep-copy'

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
    this.setConfig(config)

    if (obj.value === undefined) {
      if (config.required) {
        throw new PortError(
          PortErrorType.SerializationError,
          'Invalid serialized data: missing required value.',
        )
      }
    } else {
      const value = this.deserializeValue(obj.value)
      this.setValue(value)
    }

    return this
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
