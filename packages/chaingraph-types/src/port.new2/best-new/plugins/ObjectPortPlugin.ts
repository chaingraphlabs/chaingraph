import type {
  IPortConfig,
  IPortValue,
  ObjectPortConfig,
  ObjectPortValue,
  PortType,
} from '../base/types'
import { z } from 'zod'
import {
  createPortPlugin,
  isObjectPortValue,
  PortError,
  PortErrorType,
} from '../base/types'
import { portRegistry } from '../registry/PortRegistry'

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

  // Check for missing required fields
  for (const [key, fieldConfig] of Object.entries(config.fields)) {
    const fieldValue = value.value[key]
    if (!fieldValue) {
      errors.push(`Missing required field: ${key}`)
      continue
    }

    // Validate field value using the appropriate plugin
    if (!isValidFieldValue(fieldValue)) {
      errors.push(`Invalid field value structure for field ${key}`)
      continue
    }

    const plugin = portRegistry.getPlugin(fieldValue.type as PortType)
    if (!plugin) {
      errors.push(`Unknown field type: ${fieldValue.type} for field ${key}`)
      continue
    }

    try {
      const fieldErrors = plugin.valueSchema.safeParse(fieldValue)
      if (!fieldErrors.success) {
        errors.push(`Invalid value for field ${key}: ${fieldErrors.error.message}`)
      }
    } catch (error) {
      errors.push(`Error validating field ${key}: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
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
      try {
        portRegistry.validateConfig(val)
        return true
      } catch (error) {
        return false
      }
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
      try {
        portRegistry.validateValue(val)
        return true
      } catch (error) {
        return false
      }
    })),
  }).passthrough(),
)

/**
 * Object port plugin implementation
 */
export const ObjectPortPlugin = createPortPlugin(
  'object',
  configSchema,
  valueSchema,
  (value: ObjectPortValue) => {
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
            `Invalid field value structure for field ${key}`,
          )
        }

        const plugin = portRegistry.getPlugin(fieldValue.type as PortType)
        if (!plugin) {
          throw new PortError(
            PortErrorType.SerializationError,
            `Unknown field type: ${fieldValue.type} for field ${key}`,
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
  (data: unknown) => {
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
            `Unknown field type: ${fieldValue.type} for field ${key}`,
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
)
