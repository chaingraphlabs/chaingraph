import type {
  IPortConfig,
  IPortPlugin,
  IPortValue,
  ObjectPortConfig,
  ObjectPortValue,
  PortType,
} from '../base/types'
import { z } from 'zod'
import {
  isObjectPortValue,
  PortError,
  PortErrorType,
} from '../base/types'
import { portRegistry } from '../registry/PortRegistry'
import { validateNumberValue } from './NumberPortPlugin'
import { validateStringValue } from './StringPortPlugin'

/**
 * Helper to create an object port value
 */
export function createObjectValue(value: Record<string, IPortValue>): ObjectPortValue {
  return {
    type: 'object',
    value,
  }
}

/**
 * Helper to create an object port config
 */
export function createObjectConfig(
  fields: Record<string, IPortConfig>,
  options: Partial<Omit<ObjectPortConfig, 'type' | 'fields'>> = {},
): ObjectPortConfig {
  return {
    type: 'object',
    fields,
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
 * Validate field value against its config
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

  // Type validation - don't return early, collect all errors
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
      case 'object':
        if (fieldValue.type === fieldConfig.type && 'fields' in fieldConfig) {
          const objectConfig = fieldConfig as ObjectPortConfig
          const objectValue = fieldValue as ObjectPortValue

          // Validate each nested field
          for (const [key, nestedConfig] of Object.entries(objectConfig.fields)) {
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

          // Check for extra fields
          for (const key of Object.keys(objectValue.value)) {
            if (!objectConfig.fields[key]) {
              errors.push(`Unexpected field: ${fieldPath}.${key}`)
            }
          }
        }
        break
      default:
        {
          // For other types, use schema validation
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
 * Validate object value against config
 */
export function validateObjectValue(
  maybeValue: unknown,
  config: ObjectPortConfig,
): string[] {
  const errors: string[] = []

  // Type validation
  if (!isObjectPortValue(maybeValue)) {
    errors.push('Invalid object value structure')
    return errors
  }

  const value = maybeValue

  // Validate each field
  for (const [key, fieldConfig] of Object.entries(config.fields)) {
    const fieldValue = value.value[key]
    if (!fieldValue) {
      errors.push(`Missing required field: ${key}`)
      continue
    }

    const fieldErrors = validateField(fieldValue, fieldConfig, key)
    errors.push(...fieldErrors)
  }

  // Check for extra fields
  for (const key of Object.keys(value.value)) {
    if (!config.fields[key]) {
      errors.push(`Unexpected field: ${key}`)
    }
  }

  return errors
}

/**
 * Object port configuration schema
 */
const configSchema: z.ZodType<ObjectPortConfig> = z.lazy(() =>
  z.object({
    type: z.literal('object'),
    id: z.string().optional(),
    name: z.string().optional(),
    metadata: z.record(z.unknown()).optional(),
    fields: z.record(z.custom<IPortConfig>((val) => {
      if (
        typeof val !== 'object'
        || val === null
        || !('type' in val)
        || typeof val.type !== 'string'
      ) {
        return false
      }

      const plugin = portRegistry.getPlugin(val.type as PortType)
      if (!plugin) {
        return false
      }

      const result = plugin.configSchema.safeParse(val)
      return result.success
    })),
  }).passthrough(),
)

/**
 * Object port value schema
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
 * Object port plugin implementation
 */
export const ObjectPortPlugin: IPortPlugin<'object'> = {
  typeIdentifier: 'object',
  configSchema,
  valueSchema,
  serializeValue: (value: ObjectPortValue) => {
    try {
      if (!isObjectPortValue(value)) {
        throw new PortError(
          PortErrorType.SerializationError,
          'Invalid object value structure',
        )
      }

      // Serialize each field value using its corresponding plugin
      const serializedFields: Record<string, unknown> = {}
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
  deserializeValue: (data: unknown) => {
    try {
      if (!isObjectPortValue(data)) {
        throw new PortError(
          PortErrorType.SerializationError,
          'Invalid object value structure',
        )
      }

      // Deserialize each field value using its corresponding plugin
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
        value: deserializedFields,
      }
    } catch (error) {
      throw new PortError(
        PortErrorType.SerializationError,
        error instanceof Error ? error.message : 'Unknown error during object deserialization',
      )
    }
  },
  serializeConfig: (config: ObjectPortConfig) => {
    try {
      // We need to serialize each field's config using its corresponding plugin
      const serializedFields: Record<string, unknown> = {}
      for (const [key, fieldConfig] of Object.entries(config.fields)) {
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
        fields: serializedFields,
      }
    } catch (error) {
      throw new PortError(
        PortErrorType.SerializationError,
        error instanceof Error ? error.message : 'Unknown error during object config serialization',
      )
    }
  },
  deserializeConfig: (data: unknown) => {
    try {
      const result = configSchema.safeParse(data)
      if (!result.success) {
        throw new PortError(
          PortErrorType.SerializationError,
          'Invalid object configuration for deserialization',
          result.error,
        )
      }

      // We need to deserialize each field's config using its corresponding plugin
      const deserializedFields: Record<string, IPortConfig> = {}
      for (const [key, fieldConfig] of Object.entries(result.data.fields)) {
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
        fields: deserializedFields,
      }
    } catch (error) {
      throw new PortError(
        PortErrorType.SerializationError,
        error instanceof Error ? error.message : 'Unknown error during object config deserialization',
      )
    }
  },
  validate: (value: ObjectPortValue, config: ObjectPortConfig): string[] => {
    return validateObjectValue(value, config)
  },
}
