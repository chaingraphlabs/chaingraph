import type { JSONValue } from '../base/json'
import type {
  ArrayPortConfig,
  ArrayPortValue,
  IPortConfig,
  IPortPlugin,
  IPortValue,
  PortType,
} from '../base/types'
import { z } from 'zod'
import { basePortConfigSchema } from '../base/base-config.schema'
import { PortError, PortErrorType } from '../base/types'
import { arrayPortConfigUISchema } from '../base/ui-config.schema'
import { portRegistry } from '../registry/PortPluginRegistry'

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

/**
 * Schemas for array port validation
 */

// Value schema for array ports
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

// Array-specific schema
const arraySpecificSchema = z.object({
  type: z.literal('array'),
  defaultValue: valueSchema.optional(),
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
  ui: arrayPortConfigUISchema.optional(),
}).passthrough()

// Merge base schema with array-specific schema to create the final config schema
const configSchema: z.ZodType<ArrayPortConfig> = basePortConfigSchema
  .merge(arraySpecificSchema)
  .superRefine((data, ctx) => {
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
  })

/**
 * Plugin implementation for array ports
 */
export const ArrayPortPlugin: IPortPlugin<'array'> = {
  typeIdentifier: 'array',
  configSchema,
  valueSchema,
  serializeValue: (value: ArrayPortValue): JSONValue => {
    try {
      if (!isArrayValue(value)) {
        throw new PortError(
          PortErrorType.SerializationError,
          'Invalid array value structure',
        )
      }

      // Serialize each array item using its corresponding plugin
      const serializedItems = value.value.map((item, index) => {
        const plugin = portRegistry.getPlugin(item.type)
        if (!plugin) {
          throw new PortError(
            PortErrorType.SerializationError,
            `Unknown item type at index ${index}: ${item.type}`,
          )
        }
        return plugin.serializeValue(item) as JSONValue
      })

      return {
        type: 'array',
        value: serializedItems,
      }
    } catch (error) {
      throw new PortError(
        PortErrorType.SerializationError,
        error instanceof Error ? error.message : 'Unknown error during array serialization',
      )
    }
  },
  deserializeValue: (data: JSONValue): ArrayPortValue => {
    try {
      if (!isArrayValue(data)) {
        throw new PortError(
          PortErrorType.SerializationError,
          'Invalid array value for deserialization',
        )
      }

      // Deserialize each array item using its corresponding plugin
      const deserializedItems = data.value.map((item, index) => {
        if (
          typeof item !== 'object'
          || item === null
          || !('type' in item)
          || typeof item.type !== 'string'
        ) {
          throw new PortError(
            PortErrorType.SerializationError,
            `Invalid array item structure at index ${index}`,
          )
        }

        const plugin = portRegistry.getPlugin(item.type)
        if (!plugin) {
          throw new PortError(
            PortErrorType.SerializationError,
            `Unknown item type at index ${index}: ${item.type}`,
          )
        }
        return plugin.deserializeValue(item)
      })

      return {
        type: 'array',
        value: deserializedItems,
      }
    } catch (error) {
      throw new PortError(
        PortErrorType.SerializationError,
        error instanceof Error ? error.message : 'Unknown error during array deserialization',
      )
    }
  },
  serializeConfig: (config: ArrayPortConfig): JSONValue => {
    try {
      // Serialize the nested itemConfig using its corresponding plugin
      const plugin = portRegistry.getPlugin(config.itemConfig.type)
      if (!plugin) {
        throw new PortError(
          PortErrorType.SerializationError,
          `Unknown item config type: ${config.itemConfig.type}`,
        )
      }

      return {
        ...config,
        itemConfig: plugin.serializeConfig(config.itemConfig),
      }
    } catch (error) {
      throw new PortError(
        PortErrorType.SerializationError,
        error instanceof Error ? error.message : 'Unknown error during array config serialization',
      )
    }
  },
  deserializeConfig: (data: JSONValue): ArrayPortConfig => {
    try {
      const result = configSchema.safeParse(data)
      if (!result.success) {
        throw new PortError(
          PortErrorType.SerializationError,
          'Invalid array configuration for deserialization',
          result.error,
        )
      }

      // Deserialize the nested itemConfig using its corresponding plugin
      const plugin = portRegistry.getPlugin(result.data.itemConfig.type)
      if (!plugin) {
        throw new PortError(
          PortErrorType.SerializationError,
          `Unknown item config type: ${result.data.itemConfig.type}`,
        )
      }

      return {
        ...result.data,
        itemConfig: plugin.deserializeConfig(result.data.itemConfig),
      }
    } catch (error) {
      throw new PortError(
        PortErrorType.SerializationError,
        error instanceof Error ? error.message : 'Unknown error during array config deserialization',
      )
    }
  },
  validateValue: (value: ArrayPortValue, config: ArrayPortConfig): string[] => {
    return validateArrayValue(value, config)
  },
  validateConfig: (config: ArrayPortConfig): string[] => {
    // Validate the configuration using the Zod schema.
    const result = configSchema.safeParse(config)
    if (!result.success) {
      return result.error.errors.map((issue: z.ZodIssue) => issue.message)
    }

    return []
  },
}
