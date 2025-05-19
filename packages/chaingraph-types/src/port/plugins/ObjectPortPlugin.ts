/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type {
  ArrayPortConfig,
  ArrayPortValue,
  IObjectSchema,
  IPortConfig,
  IPortPlugin,
  IPortValue,
  ObjectPortConfig,
  ObjectPortValue,
  ObjectPortValueFromSchema,
  PortType,
} from '..'
import type { JSONObject, JSONValue } from '../../utils/json'
import { z } from 'zod'
import {
  isStreamPortValue,
} from '..'
import {
  isBooleanPortValue,
  isEnumPortValue,
} from '..'
import {
  basePortConfigSchema,
  isArrayPortValue,
  isObjectPortValue,
  isStringPortValue,
  objectPortConfigUISchema,
  PortError,
  PortErrorType,
  PortPluginRegistry,
  validateNumberValue,
  validateStringValue,
} from '..'

/**
 * Helper to create an object port value.
 * (Uses the "schema.properties" field for nested values)
 */
export function createObjectValue<S extends IObjectSchema = IObjectSchema>(value: Record<string, IPortValue>): ObjectPortValue {
  return value as ObjectPortValueFromSchema<S>
}

/**
 * Helper to create an object port config.
 * Instead of passing "fields", provide a record of properties that becomes the schema.
 */
export function createObjectConfig(
  properties: Record<string, IPortConfig>,
  options: Partial<Omit<ObjectPortConfig, 'type' | 'schema'>> = {},
): ObjectPortConfig {
  return {
    type: 'object',
    schema: { properties },
    ...options,
  }
}

/**
 * Type guard for field value type
 */
function isValidFieldValue(value: unknown): value is IPortValue {
  try {
    PortPluginRegistry.getInstance().validateValue(value)
    return true
  } catch {
    return false
  }
}

/**
 * Validate field value against its config.
 * When a field is of type "object", we now use the "schema.properties" property
 * for the nested fields.
 */
function validateField(
  fieldValue: unknown,
  fieldConfig: IPortConfig,
  fieldPath: string,
): string[] {
  const errors: string[] = []

  if (fieldValue === undefined) {
    // If the value is undefined or null, we can skip validation
    return errors
  }

  // Basic structure validation
  // if (!isValidFieldValue(fieldValue)) {
  //   errors.push(`Invalid field value structure for field ${fieldPath}`)
  //   return errors
  // }

  const plugin = PortPluginRegistry.getInstance().getPlugin(fieldConfig.type)
  if (!plugin) {
    errors.push(`Unknown field type: ${fieldConfig.type} for field ${fieldPath}`)
    return errors
  }

  try {
    // Plugin-specific validation
    switch (fieldConfig.type) {
      case 'string':
        if (isStringPortValue(fieldValue)) {
          errors.push(...validateStringValue(fieldValue, fieldConfig))
        }
        break
      case 'number':
        if (isStringPortValue(fieldValue)) {
          errors.push(...validateNumberValue(fieldValue, fieldConfig))
        }
        break
      case 'boolean':
        if (isBooleanPortValue(fieldValue)) {
          errors.push(`Invalid boolean value for field ${fieldPath}`)
        }
        break
      case 'enum':
        if (isEnumPortValue(fieldValue)) {
          errors.push(`Invalid enum value for field ${fieldPath}: ${fieldValue}`)
        }
        break
      case 'stream':
        if (isStreamPortValue(fieldValue)) {
          errors.push(`Invalid stream value for field ${fieldPath}: ${fieldValue}`)
        }
        break
      case 'any':
        // No validation needed for "any" type
        break
      case 'object': {
        // For object port type, we now check the "schema" property.
        if (isObjectPortValue(fieldValue) && 'schema' in fieldConfig) {
          const objectConfig = fieldConfig as ObjectPortConfig
          const objectValue = fieldValue as ObjectPortValue

          // Validate each nested field found in schema.properties.
          for (const [key, nestedConfig] of Object.entries(objectConfig.schema.properties)) {
            const nestedValue = objectValue[key]
            if (nestedValue === undefined) {
              if (nestedConfig.required) {
                errors.push(`Missing required field: ${fieldPath}.${key}`)
              }
              continue
            }

            const nestedErrors = validateField(
              nestedValue,
              nestedConfig,
              `${fieldPath}.${key}`,
            )
            errors.push(...nestedErrors)
          }

          // TODO: do we really need this check?
          // Check for extra fields that are not defined in schema.properties.
          // for (const key of Object.keys(objectValue)) {
          //   if (!objectConfig.schema.properties[key]) {
          //     errors.push(`Unexpected field: ${fieldPath}.${key}`)
          //   }
          // }
        }
        break
      }

      // TODO: check if we really need this
      case 'array': {
        // For array port type, we now check the "itemConfig" property.
        if (isArrayPortValue(fieldValue) && 'itemConfig' in fieldConfig) {
          const arrayConfig = fieldConfig as ArrayPortConfig
          const arrayValue = fieldValue as ArrayPortValue

          // Validate each item in the array using the itemConfig.
          for (let i = 0; i < arrayValue.length; i++) {
            const itemValue = arrayValue[i]
            const itemErrors = validateField(
              itemValue,
              arrayConfig.itemConfig,
              `${fieldPath}[${i}]`,
            )
            errors.push(...itemErrors)
          }
        }
        break
      }
      default:
        {
        // For other port types, use the plugin's Zod schema validation.
          const schemaResult = plugin.valueSchema.safeParse(fieldValue)
          if (!schemaResult.success) {
            for (const issue of schemaResult.error.errors) {
              errors.push(`Invalid value for field ${fieldPath}: ${issue.message}`)
            }
          }
        }
        break
    }
  } catch (error) {
    errors.push(`Error validating field ${fieldPath}: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }

  return errors
}

/**
 * Validate object port value against its config.
 * Iterates over the properties defined in config.schema.properties.
 */
export function validateObjectValue(
  maybeValue: unknown,
  config: ObjectPortConfig,
): string[] {
  const errors: string[] = []

  if (maybeValue === undefined || maybeValue === null) {
    // If the value is undefined or null, we can skip validation
    return errors
  }

  // Type validation.
  if (!isObjectPortValue(maybeValue)) {
    errors.push('Invalid object value structure')
    return errors
  }

  const value = maybeValue

  // Validate each field defined in the schema.
  if (!config.schema || !config.schema.properties) {
    return []
  }

  for (const [key, fieldConfig] of Object.entries(config.schema.properties)) {
    const fieldValue = value[key]
    if (fieldValue === undefined) {
      if (fieldConfig.required) {
        errors.push(`Missing required field: ${key}`)
      }
      continue
    }
    const fieldErrors = validateField(fieldValue, fieldConfig, key)
    errors.push(...fieldErrors)
  }

  // TODO: disabled for now because there is the possibility of having objects without or partial schema, so validate only known fields
  // Check for extra fields in the value that are not defined in the schema.
  // for (const key of Object.keys(value)) {
  //   if (!config.schema.properties[key]) {
  //     errors.push(`Unexpected field: ${key}`)
  //   }
  // }

  return errors
}

/**
 * Object port value schema using Zod.
 */
const valueSchema: z.ZodType<ObjectPortValue> = z.record(z.string(), z.any())

/**
 * Object-specific schema
 */
const objectSpecificSchema = z.object({
  type: z.literal('object'),
  schema: z.object({
    properties: z.record(z.custom<IPortConfig>((val) => {
      if (
        typeof val !== 'object'
        || val === null
        || !('type' in val)
        || typeof (val as { type: unknown }).type !== 'string'
      ) {
        return false
      }
      const plugin = PortPluginRegistry.getInstance().getPlugin((val as { type: string }).type as PortType)
      if (!plugin) {
        return false
      }
      const result = plugin.configSchema.safeParse(val)
      return result.success
    })),
  }).passthrough(),
  defaultValue: valueSchema.optional(),
  ui: objectPortConfigUISchema.optional(),
}).passthrough()

/**
 * Merge base schema with object-specific schema to create the final config schema
 */
const configSchema: z.ZodType<ObjectPortConfig> = basePortConfigSchema
  .merge(objectSpecificSchema)
  .passthrough()

/**
 * Object port plugin implementation.
 */
export const ObjectPortPlugin: IPortPlugin<'object'> = {
  typeIdentifier: 'object',
  configSchema,
  valueSchema,

  serializeValue: (value: ObjectPortValue, config: ObjectPortConfig): JSONValue => {
    if (value === undefined || value === null) {
      if (config.required) {
        return {}
      }
      return undefined
    }

    try {
      if (!isObjectPortValue(value)) {
        throw new PortError(
          PortErrorType.SerializationError,
          'Invalid object value structure',
        )
      }

      // Use the config's schema to drive serialization for each nested field.
      const serializedFields: Record<string, JSONValue> = {}

      // Iterate over each expected property from the ObjectPortConfig.
      for (const [key, fieldConfig] of Object.entries(config.schema.properties)) {
        // Retrieve the value corresponding to the current field.
        const fieldValue = value[key]
        if (fieldValue === undefined) {
          // Optionally, you can skip undefined fields or handle them differently.
          continue
        }
        // Retrieve the plugin using the field configuration's type.
        const plugin = PortPluginRegistry.getInstance().getPlugin(fieldConfig.type)
        if (!plugin) {
          throw new PortError(
            PortErrorType.SerializationError,
            `Unknown field type: ${fieldConfig.type}`,
          )
        }
        // Use the nested field configuration for serialization.
        serializedFields[key] = plugin.serializeValue(fieldValue, fieldConfig)
      }

      // Iterate over value and add any extra fields that are not in the schema.
      for (const [key, fieldValue] of Object.entries(value)) {
        if (config.schema.properties[key] === undefined) {
          // If the field is not defined in the schema, add it to the serialized fields.
          // This is the case of the object without or partial schema.
          serializedFields[key] = fieldValue
        }
      }

      return serializedFields
    } catch (error) {
      throw new PortError(
        PortErrorType.SerializationError,
        error instanceof Error ? error.message.toString() : 'Unknown error during object serialization',
      )
    }
  },

  deserializeValue: (data: JSONValue, config: ObjectPortConfig): ObjectPortValue => {
    if (data === undefined || data === null) {
      return {}
    }
    try {
      // Expecting an object with a "value" property that contains the serialized fields.
      if (typeof data !== 'object' || data === null) {
        if (config.required) {
          throw new PortError(
            PortErrorType.SerializationError,
            'Invalid object value structure for deserialization',
          )
        }
      }

      const serializedFields = data as Record<string, JSONValue>
      const deserialized: Record<string, any> = {}

      // Iterate over the expected fields from the configuration.
      for (const [key, fieldConfig] of Object.entries(config.schema.properties)) {
        const fieldSerializedValue = serializedFields[key]
        if (fieldSerializedValue === undefined) {
          // If the field is required, you might want to throw an error.
          // For now, we simply continue to the next field.
          continue
        }
        const plugin = PortPluginRegistry.getInstance().getPlugin(fieldConfig.type)
        if (!plugin) {
          throw new PortError(
            PortErrorType.SerializationError,
            `Unknown field type: ${fieldConfig.type} for field ${key}`,
          )
        }
        // Use the nested field configuration when deserializing.
        deserialized[key] = plugin.deserializeValue(fieldSerializedValue, fieldConfig)
      }

      // Iterate over the value and add any extra fields that are not in the schema.
      for (const [key, fieldValue] of Object.entries(serializedFields)) {
        if (config.schema.properties[key] === undefined) {
          // If the field is not defined in the schema, add it to the deserialized fields.
          // This is the case of the object without or partial schema.
          deserialized[key] = fieldValue
        }
      }

      return deserialized as ObjectPortValue
    } catch (error) {
      throw new PortError(
        PortErrorType.SerializationError,
        error instanceof Error ? error.message : 'Unknown error during object deserialization',
      )
    }
  },

  serializeConfig: (config: ObjectPortConfig): JSONValue => {
    try {
      // Serialize each field's config using its corresponding plugin.
      const serializedFields: Record<string, JSONValue> = {}
      for (const [key, fieldConfig] of Object.entries(config.schema.properties)) {
        const plugin = PortPluginRegistry.getInstance().getPlugin(fieldConfig.type)
        if (!plugin) {
          throw new PortError(
            PortErrorType.SerializationError,
            `Unknown field type: ${fieldConfig.type}`,
          )
        }
        serializedFields[key] = plugin.serializeConfig(fieldConfig)
      }

      const serializedConfig: JSONObject = {
        ...config,
        schema: {
          ...config.schema,
          properties: serializedFields,
        },
      }

      if (config.defaultValue !== undefined) {
        // Serialize the default value using the ObjectPortPlugin’s own serializeValue,
        // passing in the config so that nested fields are serialized according to their settings.
        serializedConfig.defaultValue = ObjectPortPlugin.serializeValue(config.defaultValue, config)
      }

      return serializedConfig
    } catch (error) {
      throw new PortError(
        PortErrorType.SerializationError,
        error instanceof Error ? error.message : 'Unknown error during object config serialization',
      )
    }
  },
  deserializeConfig: (data: JSONValue): ObjectPortConfig => {
    try {
      const result = configSchema.safeParse(data)
      if (!result.success) {
        throw new PortError(
          PortErrorType.SerializationError,
          `Invalid object configuration for deserialization ${JSON.stringify(result)} DATA: ${JSON.stringify(data)}`,
          result.error,
        )
      }

      // Deserialize each field's config using its corresponding plugin,
      // iterating over the schema.properties.
      const deserializedFields: Record<string, IPortConfig> = {}
      for (const [key, fieldConfig] of Object.entries(result.data.schema.properties)) {
        const plugin = PortPluginRegistry.getInstance().getPlugin(fieldConfig.type)
        if (!plugin) {
          throw new PortError(
            PortErrorType.SerializationError,
            `Unknown field type: ${fieldConfig.type}`,
          )
        }
        deserializedFields[key] = plugin.deserializeConfig(fieldConfig)
      }

      // Build the full deserialized configuration.
      const deserializedConfig: ObjectPortConfig = {
        ...result.data,
        schema: {
          ...result.data.schema,
          properties: deserializedFields,
        },
      }

      if (deserializedConfig.defaultValue !== undefined) {
        deserializedConfig.defaultValue = ObjectPortPlugin.deserializeValue(
          deserializedConfig.defaultValue,
          deserializedConfig,
        )
      }

      return deserializedConfig as ObjectPortConfig
    } catch (error) {
      throw new PortError(
        PortErrorType.SerializationError,
        error instanceof Error ? error.message : 'Unknown error during object config deserialization',
      )
    }
  },
  validateValue: (value: ObjectPortValue, config: ObjectPortConfig): string[] => {
    return validateObjectValue(value, config)
  },
  validateConfig: (config: ObjectPortConfig): string[] => {
    const errors: string[] = []

    // Validate the overall object config using the Zod schema.
    const result = configSchema.safeParse(config)
    if (!result.success) {
      errors.push(...result.error.errors.map((issue: z.ZodIssue) => issue.message))
    }

    // Validate each field's configuration by delegating to the plugin's own config validation (if available).
    for (const [fieldName, fieldConfig] of Object.entries(config.schema.properties)) {
      const plugin = PortPluginRegistry.getInstance().getPlugin(fieldConfig.type)
      if (plugin && plugin.validateConfig) {
        const fieldErrors = plugin.validateConfig(fieldConfig)
        if (fieldErrors.length > 0) {
          errors.push(...fieldErrors.map(msg => `Field "${fieldName}": ${msg}`))
        }
      }
    }

    return errors
  },
}
