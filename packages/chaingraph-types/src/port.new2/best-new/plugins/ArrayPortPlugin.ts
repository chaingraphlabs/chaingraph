import type {
  ArrayPortConfig,
  ArrayPortValue,
  IPortConfig,
  IPortPlugin,
  IPortValue,
} from '../base/types'
import { z } from 'zod'
import {
  PortError,
  PortErrorType,
} from '../base/types'
import { portRegistry } from '../registry/PortRegistry'

/**
 * Type guard for array value
 */
function isArrayValue(value: unknown): value is ArrayPortValue {
  return (
    typeof value === 'object'
    && value !== null
    && 'type' in value
    && value.type === 'array'
    && 'value' in value
    && Array.isArray((value as ArrayPortValue).value)
  )
}

/**
 * Validate array value against config
 */
export function validateArrayValue(
  value: unknown,
  config: ArrayPortConfig,
): string[] {
  const errors: string[] = []

  // Type validation
  if (!isArrayValue(value)) {
    errors.push('Invalid array value structure')
    return errors
  }

  // Validate array length constraints
  if (config.minLength !== undefined && value.value.length < config.minLength) {
    errors.push(`Array must have at least ${config.minLength} items`)
  }

  if (config.maxLength !== undefined && value.value.length > config.maxLength) {
    errors.push(`Array must have at most ${config.maxLength} items`)
  }

  // Validate array items
  value.value.forEach((item, index) => {
    if (!('type' in item) || !('value' in item)) {
      errors.push(`Invalid item structure at index ${index}`)
    }
  })

  return errors
}

// Create lazy schemas for recursive types
const configSchema: z.ZodType<ArrayPortConfig> = z.lazy(() =>
  z.object({
    type: z.literal('array'),
    id: z.string().optional(),
    name: z.string().optional(),
    metadata: z.record(z.unknown()).optional(),
    itemConfig: z.custom<IPortConfig>(),
    minLength: z.number().int().min(0).optional(),
    maxLength: z.number().int().min(1).optional(),
  }).passthrough().superRefine((data, ctx) => {
    // Validate minLength/maxLength relationship
    if (data.minLength !== undefined && data.maxLength !== undefined) {
      if (data.minLength > data.maxLength) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `minLength (${data.minLength}) must be less than or equal to maxLength (${data.maxLength})`,
          path: ['minLength'],
        })
      }
    }
  }),
)

const valueSchema: z.ZodType<ArrayPortValue> = z.lazy(() =>
  z.object({
    type: z.literal('array'),
    value: z.array(z.custom<IPortValue>()),
  }).passthrough(),
)

/**
 * Plugin implementation for array ports
 */
export const ArrayPortPlugin: IPortPlugin<'array'> = {
  typeIdentifier: 'array',
  configSchema,
  valueSchema,
  serializeValue: (value: ArrayPortValue) => {
    try {
      if (!isArrayValue(value)) {
        throw new PortError(
          PortErrorType.SerializationError,
          'Invalid array value structure',
        )
      }

      return {
        type: 'array',
        value: value.value.map((item, index) => {
          if (!('type' in item) || !('value' in item)) {
            throw new PortError(
              PortErrorType.SerializationError,
              `Invalid array item structure at index ${index}`,
            )
          }
          return item
        }),
      }
    } catch (error) {
      throw new PortError(
        PortErrorType.SerializationError,
        error instanceof Error ? error.message : 'Unknown error during array serialization',
      )
    }
  },
  deserializeValue: (data: unknown) => {
    try {
      if (!isArrayValue(data)) {
        throw new PortError(
          PortErrorType.SerializationError,
          'Invalid array value for deserialization',
        )
      }

      return {
        type: 'array',
        value: data.value.map((item, index) => {
          if (
            typeof item !== 'object'
            || item === null
            || !('type' in item)
            || !('value' in item)
          ) {
            throw new PortError(
              PortErrorType.SerializationError,
              `Invalid array item structure at index ${index}`,
            )
          }
          return item as IPortValue
        }),
      }
    } catch (error) {
      throw new PortError(
        PortErrorType.SerializationError,
        error instanceof Error ? error.message : 'Unknown error during array deserialization',
      )
    }
  },
  serializeConfig: (config: ArrayPortConfig) => {
    try {
      // Serialize the nested itemConfig using the registry
      return {
        ...config,
        itemConfig: portRegistry.serializeConfig(config.itemConfig),
      }
    } catch (error) {
      throw new PortError(
        PortErrorType.SerializationError,
        error instanceof Error ? error.message : 'Unknown error during array config serialization',
      )
    }
  },
  deserializeConfig: (data: unknown) => {
    try {
      const result = configSchema.safeParse(data)
      if (!result.success) {
        throw new PortError(
          PortErrorType.SerializationError,
          'Invalid array configuration for deserialization',
          result.error,
        )
      }

      // Deserialize the nested itemConfig using the registry
      const config = result.data
      if (typeof config.itemConfig === 'object' && config.itemConfig !== null && 'type' in config.itemConfig) {
        config.itemConfig = portRegistry.deserializeConfig(config.itemConfig.type, config.itemConfig)
      } else {
        throw new PortError(
          PortErrorType.SerializationError,
          'Invalid itemConfig structure in array configuration',
        )
      }

      return config
    } catch (error) {
      throw new PortError(
        PortErrorType.SerializationError,
        error instanceof Error ? error.message : 'Unknown error during array config deserialization',
      )
    }
  },
  validate: (value: ArrayPortValue, config: ArrayPortConfig): string[] => {
    const errors: string[] = []

    // Type validation
    if (!isArrayValue(value)) {
      errors.push('Invalid array value structure')
      return errors
    }

    // Validate array length constraints
    if (config.minLength !== undefined && value.value.length < config.minLength) {
      errors.push(`Array must have at least ${config.minLength} items`)
    }

    if (config.maxLength !== undefined && value.value.length > config.maxLength) {
      errors.push(`Array must have at most ${config.maxLength} items`)
    }

    // Validate array items
    value.value.forEach((item, index) => {
      if (!('type' in item) || !('value' in item)) {
        errors.push(`Invalid item structure at index ${index}`)
      }
    })

    return errors
  },
}
