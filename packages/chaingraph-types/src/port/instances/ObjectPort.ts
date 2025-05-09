/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type {
  IObjectSchema,
  IPortConfig,
  ObjectPortConfig,
  ObjectPortValue,
} from '../../port'
import type { JSONValue } from '../../utils/json'
import { BasePort, ObjectPortPlugin } from '../../port'

/**
 * Concrete implementation of an Object Port.
 *
 * This class extends BasePort using ObjectPortConfig<S> and ObjectPortValue<S>.
 * It leverages the ObjectPortPlugin to handle default value resolution,
 * validation, serialization, and deserialization.
 *
 * The port is generic over S (which extends ObjectSchema) so that the types
 * of nested properties can be inferred. When using the helper functions below,
 * your IDE will provide full autocompletion for the nested values.
 *
 * Example usage:
 *
 *   // Using the helper functions to build a schema and config:
 *   const userSchema = createObjectSchema({
 *     name: { type: 'string', minLength: 2 },
 *     age: { type: 'number', min: 21 },
 *     address: {
 *       type: 'object',
 *       schema: createObjectSchema({
 *         street: { type: 'string' },
 *         city: { type: 'string' },
 *         state: { type: 'string' },
 *       }),
 *     },
 *   })
 *
 *   const userConfig = createObjectPortConfig({
 *     type: 'object',
 *     schema: userSchema,
 *     defaultValue: {
 *       type: 'object',
 *       value: {
 *         name: { type: 'string', value: 'Alice' },
 *         age: { type: 'number', value: 30 },
 *         address: {
 *           type: 'object',
 *           value: {
 *             street: { type: 'string', value: '123 Main St' },
 *             city: { type: 'string', value: 'Springfield' },
 *             state: { type: 'string', value: 'IL' },
 *           },
 *         },
 *       },
 *     },
 *   })
 *
 *   const userPort = new ObjectPort(userConfig)
 *   // The IDE now knows that userPort.getValue() returns an object
 *   // whose "value" property has both "name" and "age" with proper types.
 *   console.log(userPort.getValue()?.value.name.value) // 'Alice'
 *   console.log(userPort.getValue()?.value.address.value.state.value) // 'IL'
 *
 * @template S - The object schema type (extending ObjectSchema) used in the configuration.
 */
export class ObjectPort<S extends IObjectSchema = IObjectSchema> extends BasePort<ObjectPortConfig<S>> {
  constructor(config: ObjectPortConfig<S>) {
    const defaultUi = {
      bgColor: '#e44df5',
      borderColor: '#541e5d',
    }

    const mergedConfig = { ...config, ui: { ...defaultUi, ...config.ui } }
    super(mergedConfig)
  }

  /**
   * Retrieves the default value from the configuration.
   * @returns The default ObjectPortValue if specified; otherwise undefined.
   */
  protected getDefaultValue(): ObjectPortValue<S> | undefined {
    return this.config.defaultValue
  }

  /**
   * Optionally, override getValue() to indicate that it returns a fully typed ObjectPortValue.
   * @returns The current port value.
   */
  getValue(): ObjectPortValue<S> | undefined {
    return super.getValue() as ObjectPortValue<S> | undefined
  }

  setValue(newValue: ObjectPortValue<S> | undefined): void {
    // Clear the current value if newValue is undefined
    if (newValue === undefined) {
      this.value = undefined
      return
    }

    // Initialize value if it doesn't exist
    if (this.value === undefined) {
      this.value = {} as ObjectPortValue<S>
    }

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
          this.setValueForKey(this.value, key, value)
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
   * Validates the object port value.
   * Delegates to ObjectPortPlugin.validateValue.
   * @param value - The object port value.
   * @returns True if valid; otherwise false.
   */
  protected validateValue(value: ObjectPortValue<S>): boolean {
    const errors = ObjectPortPlugin.validateValue(value, this.config)
    return errors.length === 0
  }

  /**
   * Validates the object port configuration.
   * Delegates to ObjectPortPlugin.validateConfig.
   * @param config - The object port configuration.
   * @returns True if valid; otherwise false.
   */
  protected validateConfig(config: ObjectPortConfig<S>): boolean {
    const errors = ObjectPortPlugin.validateConfig(config)
    return errors.length === 0
  }

  /**
   * Serializes the object port configuration.
   * Delegates to ObjectPortPlugin.serializeConfig.
   * @param config - The object port configuration.
   * @returns The serialized configuration.
   */
  protected serializeConfig(config: ObjectPortConfig<S>): JSONValue {
    return ObjectPortPlugin.serializeConfig(config)
  }

  /**
   * Serializes the object port value.
   * Delegates to ObjectPortPlugin.serializeValue.
   * @param value - The object port value.
   * @returns The serialized value.
   */
  protected serializeValue(value: ObjectPortValue<S>): JSONValue {
    return ObjectPortPlugin.serializeValue(value, this.config)
  }

  /**
   * Deserializes JSON data into an ObjectPortConfig.
   * Delegates to ObjectPortPlugin.deserializeConfig.
   * @param data - The JSON data.
   * @returns The deserialized configuration.
   */
  protected deserializeConfig(data: JSONValue): ObjectPortConfig<S> {
    return ObjectPortPlugin.deserializeConfig(data) as ObjectPortConfig<S>
  }

  /**
   * Deserializes JSON data into an ObjectPortValue.
   * Delegates to ObjectPortPlugin.deserializeValue.
   * @param data - The JSON data.
   * @returns The deserialized port value.
   */
  protected deserializeValue(data: JSONValue): ObjectPortValue<S> {
    return ObjectPortPlugin.deserializeValue(data, this.config)
  }

  /**
   * Adds a new field to the object schema and updates the default and current values.
   * @param field
   * @param config
   */
  public addField(field: string, config: IPortConfig) {
    if (!config.key) {
      config.key = field
    }

    // Add the field to the schema
    this.config.schema.properties[field] = config

    // Add fields to the default value
    if (config.defaultValue !== undefined) {
      if (this.config.defaultValue) {
        this.config.defaultValue = {
          ...this.config.defaultValue,
          [field]: config.defaultValue,
        }
      } else {
        this.config.defaultValue = {
          [field]: config.defaultValue,
        } as ObjectPortValue<S>
      }
    }

    // Add fields to the current value
    if (this.value) {
      this.value = {
        ...this.value,
        [field]: config.defaultValue,
      }
    } else {
      this.value = {
        [field]: config.defaultValue,
      } as ObjectPortValue<S>
    }
  }

  /**
   * Remove a field from the object schema and updates the default and current values.
   * @param field
   */
  public removeField(field: string) {
    // Remove the field from the schema
    if (Object.hasOwn(this.config.schema.properties, field)) {
      delete this.config.schema.properties[field]
    }

    // Remove the field from the default value
    if (this.config.defaultValue && Object.hasOwn(this.config.defaultValue, field)) {
      delete this.config.defaultValue[field]
    }

    // Remove the field from the current value
    if (this.value && Object.hasOwn(this.value, field)) {
      delete this.value[field]
    }
  }
}

/**
 * Helper to create an ObjectSchema.
 *
 * This function infers the schema type from the provided properties, so that
 * nested port configuration types are known.
 *
 * Example:
 *   const userSchema = createObjectSchema({
 *     name: { type: 'string', minLength: 2 },
 *     age: { type: 'number', min: 21 }
 *   })
 *
 * @param properties - A mapping of property keys to their port configurations.
 * @returns An ObjectSchema with the inferred property types.
 */
export function createObjectSchema<T extends Record<string, IPortConfig>>(
  properties: T,
): IObjectSchema<T> {
  return { properties }
}

/**
 * Helper to create an ObjectPortConfig with proper type inference.
 *
 * Use this function when constructing a configuration object so that the generic
 * parameter for the ObjectSchema is inferred from the "schema" property.
 *
 * Example:
 *   const config = createObjectPortConfig({
 *     type: 'object',
 *     schema: createObjectSchema({
 *       name: { type: 'string', minLength: 2 },
 *       age: { type: 'number', min: 21 }
 *     }),
 *     defaultValue: {
 *       type: 'object',
 *       value: {
 *         name: { type: 'string', value: 'Alice' },
 *         age: { type: 'number', value: 30 }
 *       }
 *     }
 *   })
 *
 * @param config - The object port configuration.
 * @returns The same configuration with its generic parameter inferred.
 */
export function createObjectPortConfig<S extends IObjectSchema>(
  config: ObjectPortConfig<S>,
): ObjectPortConfig<S> {
  return config
}
