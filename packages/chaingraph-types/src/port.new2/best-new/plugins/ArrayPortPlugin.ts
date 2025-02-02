import type {
  ArrayPortConfig,
  ArrayPortValue,
  IPortConfig,
  IPortPlugin,
  IPortValue,
  PortType,
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
    itemConfig: z.custom<IPortConfig>((val) => {
      if (
        typeof val !== 'object'
        || val === null
        || !('type' in val)
        || typeof (val as any).type !== 'string'
      ) {
        return false
      }
      // Retrieve the corresponding plugin from the registry
      const plugin = portRegistry.getPlugin((val as any).type as PortType)
      if (!plugin) {
        return false
      }
      // Validate the itemConfig using the plugin's own configSchema
      const result = plugin.configSchema.safeParse(val)
      return result.success
    }, { message: 'Invalid itemConfig: must be a valid port configuration' }),
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
    value: z.array(
      z.custom<IPortValue>((val) => {
        if (typeof val !== 'object' || val === null)
          return false
        if (!('type' in val) || typeof (val as any).type !== 'string')
          return false
        const plugin = portRegistry.getPlugin((val as any).type as PortType)
        if (!plugin)
          return false
        const result = plugin.valueSchema.safeParse(val)
        return result.success
      }, { message: 'Invalid item in array value. Must be valid IPortValue according to its plugin.' }),
    ),
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

      const serializedElements = value.value.map((item, index) => {
        const plugin = portRegistry.getPlugin(item.type as PortType)
        if (!plugin) {
          throw new PortError(
            PortErrorType.SerializationError,
            `No plugin found for type "${item.type}" at index ${index}`,
          )
        }
        // Вызываем serializeValue для элемента
        return plugin.serializeValue(item)
      })

      return {
        type: 'array',
        value: serializedElements,
      }
    } catch (error) {
      if (error instanceof Error)
        throw error
      throw new PortError(
        PortErrorType.SerializationError,
        'Unknown error during array serialization',
      )
    }
  },
  deserializeValue: (data: unknown) => {
    try {
      if (typeof data !== 'object' || data === null) {
        throw new PortError(
          PortErrorType.SerializationError,
          'Invalid serialized data: expected an object',
        )
      }

      const dataObj = data as { type?: unknown, value?: unknown }

      if (dataObj.type !== 'array') {
        throw new PortError(
          PortErrorType.SerializationError,
          `Invalid serialized data: expected type "array", got "${dataObj.type}"`,
        )
      }

      if (!Array.isArray(dataObj.value)) {
        throw new PortError(
          PortErrorType.SerializationError,
          'Invalid serialized data: "value" field must be an array',
        )
      }

      const serializedElements = dataObj.value as unknown[]

      const deserializedElements = serializedElements.map((item, index) => {
        if (typeof item !== 'object' || item === null || !('type' in item)) {
          throw new PortError(
            PortErrorType.SerializationError,
            `Invalid item structure at index ${index}`,
          )
        }
        const itemType = (item as any).type as string
        const plugin = portRegistry.getPlugin(itemType as PortType)
        if (!plugin) {
          throw new PortError(
            PortErrorType.SerializationError,
            `No plugin found for type "${itemType}" at index ${index}`,
          )
        }
        return plugin.deserializeValue(item)
      })

      return {
        type: 'array',
        value: deserializedElements,
      }
    } catch (error) {
      if (error instanceof Error)
        throw error
      throw new PortError(
        PortErrorType.SerializationError,
        'Unknown error during array deserialization',
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
