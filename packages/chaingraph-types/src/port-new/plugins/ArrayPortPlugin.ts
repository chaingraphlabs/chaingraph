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
import { isArrayPortValue, PortError, PortErrorType } from '../base/types'
import { arrayPortConfigUISchema } from '../base/ui-config.schema'
import { portRegistry } from '../registry/PortPluginRegistry'

/**
 * Helper to create an array port value
 */
export function createArrayValue(items: IPortValue[]): ArrayPortValue {
  return items as ArrayPortValue<any>
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
  if (!isArrayPortValue(value)) {
    errors.push('Invalid array value structure')
    return errors
  }

  // Validate array length constraints
  if (config.minLength !== undefined && value.length < config.minLength) {
    errors.push(`Array must have at least ${config.minLength} items`)
  }

  if (config.maxLength !== undefined && value.length > config.maxLength) {
    errors.push(`Array must have at most ${config.maxLength} items`)
  }

  const elementPlugin = portRegistry.getPlugin(config.itemConfig.type)
  if (!elementPlugin) {
    errors.push(`Unknown item config type: ${config.itemConfig.type}`)
    return errors
  }

  // Validate array items
  value.forEach((item, index) => {
    if (elementPlugin.validateValue(item, config.itemConfig).length > 0) {
      errors.push(`Invalid item structure at index ${index}`)
    }
  })

  return errors
}

/**
 * Schemas for array port validation
 */

// Value schema for array ports
const valueSchema: z.ZodType<ArrayPortValue> = z.array(z.unknown())

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
  serializeValue: (value: ArrayPortValue, config: ArrayPortConfig): JSONValue => {
    try {
      if (!isArrayPortValue(value)) {
        throw new PortError(
          PortErrorType.SerializationError,
          'Invalid array value structure',
        )
      }

      const plugin = portRegistry.getPlugin(config.itemConfig.type)
      if (!plugin) {
        throw new PortError(
          PortErrorType.SerializationError,
          `Unknown item config type: ${config.itemConfig.type}`,
        )
      }

      // Serialize each array item using its corresponding plugin
      return value.map((item, index) => {
        return plugin.serializeValue(item, config) as JSONValue
      })
    } catch (error) {
      throw new PortError(
        PortErrorType.SerializationError,
        error instanceof Error ? error.message : 'Unknown error during array serialization',
      )
    }
  },
  deserializeValue: (data: JSONValue, config: ArrayPortConfig): ArrayPortValue => {
    try {
      if (!isArrayPortValue(data)) {
        throw new PortError(
          PortErrorType.SerializationError,
          'Invalid array value for deserialization',
        )
      }

      const plugin = portRegistry.getPlugin(config.itemConfig.type)
      if (!plugin) {
        throw new PortError(
          PortErrorType.SerializationError,
          `Unknown item config type: ${config.itemConfig.type}`,
        )
      }

      // Deserialize each array item using its corresponding plugin
      return data.map((item, index) => {
        return plugin.deserializeValue(item, config) as IPortValue
      })
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
      const plugin = portRegistry.getPlugin(config.type)
      if (!plugin) {
        throw new PortError(
          PortErrorType.SerializationError,
          `Unknown plugin type: ${config.type}`,
        )
      }

      const pluginItem = portRegistry.getPlugin(config.itemConfig.type)
      if (!pluginItem) {
        throw new PortError(
          PortErrorType.SerializationError,
          `Unknown item config type: ${config.itemConfig.type}`,
        )
      }

      let defaultValueSerialized: ArrayPortValue | undefined
      if (config.defaultValue !== undefined) {
        defaultValueSerialized = plugin.serializeValue(config.defaultValue, config) as ArrayPortValue
      }

      return {
        ...config,
        itemConfig: pluginItem.serializeConfig(config.itemConfig),
        defaultValue: defaultValueSerialized,
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
      const itemPlugin = portRegistry.getPlugin(result.data.itemConfig.type)
      if (!itemPlugin) {
        throw new PortError(
          PortErrorType.SerializationError,
          `Unknown item config type: ${result.data.itemConfig.type}`,
        )
      }

      const config: ArrayPortConfig = {
        ...result.data,
        itemConfig: itemPlugin.deserializeConfig(result.data.itemConfig),
      }

      const plugin = portRegistry.getPlugin(config.type)
      if (!plugin) {
        throw new PortError(
          PortErrorType.SerializationError,
          `Unknown plugin type: ${config.type}`,
        )
      }

      const defaultValue = result.data.defaultValue !== undefined
        ? plugin.deserializeValue(result.data.defaultValue, config)
        : undefined

      if (defaultValue !== undefined) {
        config.defaultValue = defaultValue
      }

      return config
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
