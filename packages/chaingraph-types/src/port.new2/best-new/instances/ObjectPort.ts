import type { JSONValue } from '../base/json'
import type {
  IPortConfig,
  ObjectPortConfig,
  ObjectPortValue,
  ObjectSchema,
} from '../base/types'
import { BasePort } from '../base/BasePort'
import { ObjectPortPlugin } from '../plugins/ObjectPortPlugin'

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
 *     age: { type: 'number', min: 21 }
 *   })
 *
 *   const userConfig = createObjectPortConfig({
 *     type: 'object',
 *     schema: userSchema,
 *     defaultValue: {
 *       type: 'object',
 *       value: {
 *         name: { type: 'string', value: 'Alice' },
 *         age: { type: 'number', value: 30 }
 *       }
 *     }
 *   })
 *
 *   const userPort = new ObjectPort(userConfig)
 *   // The IDE now knows that userPort.getValue() returns an object
 *   // whose "value" property has both "name" and "age" with proper types.
 *   console.log(userPort.getValue()?.value.name.value)  // 'Alice'
 *
 * @template S - The object schema type (extending ObjectSchema) used in the configuration.
 */
export class ObjectPort<S extends ObjectSchema = ObjectSchema> extends BasePort<ObjectPortConfig<S>> {
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
    return super.getValue()
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
    return ObjectPortPlugin.serializeValue(value)
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
    return ObjectPortPlugin.deserializeValue(data) as ObjectPortValue<S>
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
): ObjectSchema<T> {
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
export function createObjectPortConfig<S extends ObjectSchema>(
  config: ObjectPortConfig<S>,
): ObjectPortConfig<S> {
  return config
}
