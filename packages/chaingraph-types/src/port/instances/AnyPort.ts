/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { JSONValue } from '../../utils/json'
import type { AnyPortConfig, AnyPortValue, IPort, IPortConfig } from '../base'
import { BasePort } from '../base'
import { generatePortID } from '../id-generate'
import { AnyPortPlugin } from '../plugins'

const MAX_UNDERLYING_TYPES = 10 // Prevent infinite loops in case of circular references

/**
 * Concrete implementation of an Any Port.
 *
 * This class extends BasePort using AnyPortConfig and AnyPortValue.
 * It leverages the AnyPortPlugin to handle validation, serialization,
 * and deserialization by delegating to the underlying port type's plugin.
 *
 * The Any port acts as a wrapper around any other port type. Its configuration
 * includes an underlyingType field that specifies which port type to use,
 * and all operations are delegated to that type's plugin.
 *
 * Example usage:
 *   const config: AnyPortConfig = {
 *     type: 'any',
 *     underlyingType: {
 *       type: 'string',
 *       minLength: 2,
 *     },
 *     defaultValue: {
 *       type: 'any',
 *       value: { type: 'string', value: 'hello' },
 *     },
 *   }
 *
 *   const anyPort = new AnyPort(config)
 *   anyPort.setValue({
 *     type: 'any',
 *     value: { type: 'string', value: 'world' },
 *   })
 *   console.log(anyPort.getValue()) // => { type: 'any', value: { type: 'string', value: 'world' } }
 */
export class AnyPort extends BasePort<AnyPortConfig> {
  constructor(config: AnyPortConfig) {
    const defaultUi = {
      bgColor: '#cccccc',
      borderColor: '#333333',
    }

    const mergedConfig = { ...config, ui: { ...defaultUi, ...config.ui } }
    super(mergedConfig)
  }

  getConfig() {
    let underlyingType = this.config.underlyingType
    if (underlyingType) {
      // find actual underlying type by iterate over any port underlying types
      let depth = 0
      while (underlyingType && underlyingType.type === 'any' && underlyingType.underlyingType) {
        underlyingType = underlyingType.underlyingType
        depth++
        if (depth > MAX_UNDERLYING_TYPES) {
          throw new Error('Maximum depth reached while resolving underlying type')
        }
      }

      return {
        ...this.config.underlyingType,
        type: 'any',
        id: this.config.id,
        parentId: this.config.parentId,
        key: this.config.key,
        title: this.config.title,
        description: this.config.description,
        connections: this.config.connections,
        order: this.config.order,
        nodeId: this.config.nodeId,
        direction: this.config.direction,
        underlyingType,
      } as AnyPortConfig
    }
    return this.config
  }

  getRawConfig(): AnyPortConfig {
    return this.config
  }

  /**
   * Returns the default value from the configuration.
   * @returns The default AnyPortValue if specified; otherwise undefined.
   */
  protected getDefaultValue(): AnyPortValue | undefined {
    return this.config.defaultValue
  }

  setValue(newValue: any | undefined): void {
    if (this.config.underlyingType?.type !== 'object') {
      super.setValue(newValue)
      return
    }

    // Clear the current value if newValue is undefined
    if (newValue === undefined) {
      this.value = undefined
      return
    }
    if (newValue === null) {
      this.value = null
      return
    }

    // Initialize value if it doesn't exist
    if (this.value === undefined || this.value === null) {
      this.value = {}
    }

    // TODO: Add support for arrays and other types

    // Initialize value if it doesn't exist or isn't an object
    if (typeof newValue !== 'object' || Array.isArray(newValue)) {
      this.value = {}
      return
    }

    if (typeof this.value === 'object' && !Array.isArray(this.value)) {
      // Delete keys that don't exist in new value
      for (const key in this.value) {
        if (Object.hasOwn(this.value, key) && !Object.hasOwn(newValue, key)) {
          delete this.value[key]
        }
      }

      // Set new values and recursively update
      for (const key in newValue) {
        if (Object.hasOwn(newValue, key)) {
          const value = newValue[key]
          if (value !== undefined) {
            this.setValueForKey(this.value!, key, value)
          }
        }
      }
    }
  }

  /**
   * Set a value for a specific key with proper type handling
   * @param target - The target object to update
   * @param key - The key to set
   * @param value - The value to set
   */
  private setValueForKey(target: Record<string, any>, key: string, value: any): void {
    // Handle null values
    if (value === null) {
      target[key] = null
      return
    }

    // Handle object types (excluding arrays) - update recursively
    if (typeof value === 'object' && !Array.isArray(value)) {
      // Initialize target property if it doesn't exist or isn't an object
      if (!target[key] || typeof target[key] !== 'object' || Array.isArray(target[key])) {
        target[key] = {}
      }

      // Recursively update the object properties
      this.setObjectPropertiesRecursively(target[key], value)
    } else {
      // For arrays or primitive values, assign directly
      target[key] = value
    }
  }

  /**
   * Recursively update object properties
   * @param target - The target object to update
   * @param source - The source object with new values
   */
  private setObjectPropertiesRecursively(target: Record<string, any>, source: Record<string, any>): void {
    // Delete properties from target that don't exist in source
    for (const key in target) {
      if (Object.hasOwn(target, key) && !Object.hasOwn(source, key)) {
        delete target[key]
      }
    }

    // Update or add properties from source to target
    for (const key in source) {
      if (Object.hasOwn(source, key)) {
        this.setValueForKey(target, key, source[key])
      }
    }
  }

  /**
   * Validates the any port value.
   * Delegates to AnyPortPlugin.validateValue which in turn delegates
   * to the underlying type's plugin for value validation.
   * @param value - The any port value to validate.
   * @returns True if valid; otherwise false.
   */
  protected validateValue(value: AnyPortValue): boolean {
    const errors = AnyPortPlugin.validateValue(value, this.config)
    return errors.length === 0
  }

  /**
   * Validates the any port configuration.
   * Delegates to AnyPortPlugin.validateConfig which validates both
   * the any port structure and the underlying type's configuration.
   * @param config - The any port configuration.
   * @returns True if valid; otherwise false.
   */
  protected validateConfig(config: AnyPortConfig): boolean {
    const errors = AnyPortPlugin.validateConfig(config)
    return errors.length === 0
  }

  /**
   * Serializes the any port configuration.
   * Delegates to AnyPortPlugin.serializeConfig which handles
   * serializing both the any port config and the underlying type's config.
   * @param config - The any port configuration.
   * @returns The serialized configuration.
   */
  protected serializeConfig(config: AnyPortConfig): JSONValue {
    return AnyPortPlugin.serializeConfig(config)
  }

  /**
   * Serializes the any port value.
   * Delegates to AnyPortPlugin.serializeValue which handles
   * serializing both the any port value and the underlying value.
   * @param value - The any port value.
   * @returns The serialized value.
   */
  protected serializeValue(value: AnyPortValue): JSONValue {
    return AnyPortPlugin.serializeValue(value, this.config)
  }

  /**
   * Deserializes JSON data into an AnyPortConfig.
   * Delegates to AnyPortPlugin.deserializeConfig which handles
   * deserializing both the any port config and the underlying type's config.
   * @param data - The JSON data.
   * @returns The deserialized configuration.
   */
  protected deserializeConfig(data: JSONValue): AnyPortConfig {
    return AnyPortPlugin.deserializeConfig(data)
  }

  /**
   * Deserializes JSON data into an AnyPortValue.
   * Delegates to AnyPortPlugin.deserializeValue which handles
   * deserializing both the any port value and the underlying value.
   * @param data - The JSON data.
   * @returns The deserialized port value.
   */
  protected deserializeValue(data: JSONValue): AnyPortValue {
    return AnyPortPlugin.deserializeValue(data, this.config)
  }

  /**
   * Sets the underlying type of the any port.
   * This method allows changing the underlying type dynamically.
   * @param underlyingType - The new underlying type configuration.
   */
  public setUnderlyingType(underlyingType: IPortConfig | undefined) {
    this.config.underlyingType = underlyingType
  }

  /**
   * Unwraps the underlying type of the any port. It is iterates over the underlying types and while
   * the underlying type is 'any' and has an underlyingType, it will return the actual underlying type.
   */
  public unwrapUnderlyingType(): IPortConfig | undefined {
    const maxDepth = 10 // Prevent infinite loops in case of circular references
    let underlyingType = this.config.underlyingType
    let depth = 0
    while (underlyingType && underlyingType.type === 'any' && underlyingType.underlyingType && depth < maxDepth) {
      underlyingType = underlyingType.underlyingType
      depth++
    }

    if (depth >= maxDepth) {
      throw new Error('Maximum depth reached while unwrapping underlying type')
    }

    return underlyingType
  }

  /**
   * Clones the port with a new ID.
   * Useful for creating copies of the port with a unique identifier.
   */
  cloneWithNewId(): IPort<AnyPortConfig> {
    return new AnyPort({
      ...this.config,
      id: generatePortID(this.config.key || this.config.id || ''),
    })
  }
}

/**
 * Helper function to create an AnyPortConfig.
 * This function helps ensure that the configuration object is constructed
 * with proper type inference.
 *
 * Example:
 *   const config = createAnyPortConfig({
 *     type: 'any',
 *     underlyingType: {
 *       type: 'string',
 *       minLength: 2,
 *     },
 *   })
 *
 * @param config - The any port configuration.
 * @returns The same configuration object.
 */
export function createAnyPortConfig(config: AnyPortConfig): AnyPortConfig {
  return config
}
