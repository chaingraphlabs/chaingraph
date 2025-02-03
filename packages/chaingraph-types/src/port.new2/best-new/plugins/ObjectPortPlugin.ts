import type { JSONValue } from '../base/json'
import type {
  IPortConfig,
  IPortPlugin,
  IPortValue,
  ObjectPortConfig,
  ObjectPortValue,
  ObjectPortValueFromSchema,
  ObjectSchema,
  PortType,
} from '../base/types'
import { z } from 'zod'
import { basePortConfigSchema } from '../base/base-config.schema'
import {
  isObjectPortValue,
  PortError,
  PortErrorType,
} from '../base/types'
import { portRegistry } from '../registry/PortRegistry'
import { validateNumberValue } from './NumberPortPlugin'
import { validateStringValue } from './StringPortPlugin'

/**
 * Helper to create an object port value.
 * (Uses the "schema.properties" field for nested values)
 */
export function createObjectValue(value: Record<string, IPortValue>): ObjectPortValue {
  return {
    type: 'object',
    value: value as ObjectPortValueFromSchema<ObjectSchema<Record<string, IPortConfig>>>,
  }
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
  if (
    typeof value !== 'object'
    || value === null
    || !('type' in value)
    || typeof (value as { type: unknown }).type !== 'string'
    || !('value' in value)
  ) {
    return false
  }

  const fieldType = (value as { type: string }).type
  return portRegistry.getPlugin(fieldType as PortType) !== undefined
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

  // Basic structure validation
  if (!isValidFieldValue(fieldValue)) {
    errors.push(`Invalid field value structure for field ${fieldPath}`)
    return errors
  }

  // Type validation – collect all errors without early return
  if (fieldValue.type !== fieldConfig.type) {
    errors.push(`Invalid value for field ${fieldPath}: expected type ${fieldConfig.type}, got ${fieldValue.type}`)
  }

  const plugin = portRegistry.getPlugin(fieldConfig.type)
  if (!plugin) {
    errors.push(`Unknown field type: ${fieldConfig.type} for field ${fieldPath}`)
    return errors
  }

  try {
    // Plugin-specific validation
    switch (fieldConfig.type) {
      case 'string':
        if (fieldValue.type === fieldConfig.type) {
          errors.push(...validateStringValue(fieldValue, fieldConfig))
        }
        break
      case 'number':
        if (fieldValue.type === fieldConfig.type) {
          errors.push(...validateNumberValue(fieldValue, fieldConfig))
        }
        break
      case 'object': {
        // For object port type, we now check the "schema" property.
        if (fieldValue.type === fieldConfig.type && 'schema' in fieldConfig) {
          const objectConfig = fieldConfig as ObjectPortConfig
          const objectValue = fieldValue as ObjectPortValue

          // Validate each nested field found in schema.properties.
          for (const [key, nestedConfig] of Object.entries(objectConfig.schema.properties)) {
            const nestedValue = objectValue.value[key]
            if (!nestedValue) {
              errors.push(`Missing required field: ${fieldPath}.${key}`)
              continue
            }

            const nestedErrors = validateField(
              nestedValue,
              nestedConfig,
              `${fieldPath}.${key}`,
            )
            errors.push(...nestedErrors)
          }

          // Check for extra fields that are not defined in schema.properties.
          for (const key of Object.keys(objectValue.value)) {
            if (!objectConfig.schema.properties[key]) {
              errors.push(`Unexpected field: ${fieldPath}.${key}`)
            }
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

  // Type validation.
  if (!isObjectPortValue(maybeValue)) {
    errors.push('Invalid object value structure')
    return errors
  }

  const value = maybeValue

  // Validate each field defined in the schema.
  for (const [key, fieldConfig] of Object.entries(config.schema.properties)) {
    const fieldValue = value.value[key]
    if (!fieldValue) {
      errors.push(`Missing required field: ${key}`)
      continue
    }
    const fieldErrors = validateField(fieldValue, fieldConfig, key)
    errors.push(...fieldErrors)
  }

  // Check for extra fields in the value that are not defined in the schema.
  for (const key of Object.keys(value.value)) {
    if (!config.schema.properties[key]) {
      errors.push(`Unexpected field: ${key}`)
    }
  }

  return errors
}

/**
 * Object port value schema using Zod.
 */
const valueSchema: z.ZodType<ObjectPortValue> = z.lazy(() =>
  z.object({
    type: z.literal('object'),
    value: z.record(z.custom<IPortValue>((val) => {
      if (!isValidFieldValue(val)) {
        return false
      }

      const plugin = portRegistry.getPlugin(val.type as PortType)
      if (!plugin) {
        return false
      }

      const result = plugin.valueSchema.safeParse(val)
      return result.success
    })),
  }).passthrough(),
)

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
      const plugin = portRegistry.getPlugin((val as { type: string }).type as PortType)
      if (!plugin) {
        return false
      }
      const result = plugin.configSchema.safeParse(val)
      return result.success
    })),
  }).passthrough(),
  defaultValue: valueSchema.optional(),
}).passthrough()

/**
 * Merge base schema with object-specific schema to create the final config schema
 */
const configSchema: z.ZodType<ObjectPortConfig> = basePortConfigSchema.merge(objectSpecificSchema)

/**
 * Object port plugin implementation.
 */
export const ObjectPortPlugin: IPortPlugin<'object'> = {
  typeIdentifier: 'object',
  configSchema,
  valueSchema,
  serializeValue: (value: ObjectPortValue): JSONValue => {
    try {
      if (!isObjectPortValue(value)) {
        throw new PortError(
          PortErrorType.SerializationError,
          'Invalid object value structure',
        )
      }

      // Serialize each nested field using its corresponding plugin.
      const serializedFields: Record<string, JSONValue> = {}
      for (const [key, fieldValue] of Object.entries(value.value)) {
        if (!isValidFieldValue(fieldValue)) {
          throw new PortError(
            PortErrorType.SerializationError,
            `Unknown field type: ${(fieldValue as any)?.type || 'undefined'}`,
          )
        }
        const plugin = portRegistry.getPlugin(fieldValue.type as PortType)
        if (!plugin) {
          throw new PortError(
            PortErrorType.SerializationError,
            `Unknown field type: ${fieldValue.type}`,
          )
        }
        serializedFields[key] = plugin.serializeValue(fieldValue)
      }

      return {
        type: 'object',
        value: serializedFields,
      }
    } catch (error) {
      throw new PortError(
        PortErrorType.SerializationError,
        error instanceof Error ? error.message : 'Unknown error during object serialization',
      )
    }
  },
  deserializeValue: (data: JSONValue): ObjectPortValue => {
    try {
      if (!isObjectPortValue(data)) {
        throw new PortError(
          PortErrorType.SerializationError,
          'Invalid object value structure',
        )
      }

      // Deserialize each nested field using its corresponding plugin.
      const deserializedFields: Record<string, IPortValue> = {}
      for (const [key, fieldValue] of Object.entries(data.value)) {
        if (!isValidFieldValue(fieldValue)) {
          throw new PortError(
            PortErrorType.SerializationError,
            `Invalid field value structure for field ${key}`,
          )
        }
        const plugin = portRegistry.getPlugin(fieldValue.type as PortType)
        if (!plugin) {
          throw new PortError(
            PortErrorType.SerializationError,
            `Unknown field type: ${fieldValue.type}`,
          )
        }
        deserializedFields[key] = plugin.deserializeValue(fieldValue)
      }

      return {
        type: 'object',
        value: deserializedFields as ObjectPortValueFromSchema<ObjectSchema>,
      }
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
        const plugin = portRegistry.getPlugin(fieldConfig.type)
        if (!plugin) {
          throw new PortError(
            PortErrorType.SerializationError,
            `Unknown field type: ${fieldConfig.type}`,
          )
        }
        serializedFields[key] = plugin.serializeConfig(fieldConfig)
      }

      return {
        ...config,
        schema: {
          ...config.schema,
          properties: serializedFields,
        },
      }
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
          'Invalid object configuration for deserialization',
          result.error,
        )
      }

      // Deserialize each field's config using its corresponding plugin,
      // iterating over the schema.properties.
      const deserializedFields: Record<string, IPortConfig> = {}
      for (const [key, fieldConfig] of Object.entries(result.data.schema.properties)) {
        const plugin = portRegistry.getPlugin(fieldConfig.type)
        if (!plugin) {
          throw new PortError(
            PortErrorType.SerializationError,
            `Unknown field type: ${fieldConfig.type}`,
          )
        }
        deserializedFields[key] = plugin.deserializeConfig(fieldConfig)
      }

      return {
        ...result.data,
        schema: {
          ...result.data.schema,
          properties: deserializedFields,
        },
      }
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
      const plugin = portRegistry.getPlugin(fieldConfig.type)
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
