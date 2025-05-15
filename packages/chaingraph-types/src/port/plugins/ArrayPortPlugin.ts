/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { JSONValue } from '../../utils/json'
import type { ArrayPortConfig, ArrayPortValue, IPortConfig, IPortPlugin, IPortValue, PortType } from '../base'
import { z } from 'zod'
import { arrayPortConfigUISchema, basePortConfigSchema, isArrayPortValue, PortError, PortErrorType } from '../base'
import { PortPluginRegistry } from './PortPluginRegistry'

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

  if (value === undefined || value === null) {
    return []
  }

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

  const elementPlugin = PortPluginRegistry.getInstance().getPlugin(config.itemConfig.type)
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
    if (val === undefined || val === null) {
      return true
    }

    if (
      typeof val !== 'object'
      || val === null
      || !('type' in val)
      || typeof (val as any).type !== 'string'
    ) {
      return false
    }
    // Retrieve the corresponding plugin from the registry
    const plugin = PortPluginRegistry.getInstance().getPlugin((val as any).type as PortType)
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
    if (value === undefined || value === null || !Array.isArray(value)) {
      return []
    }

    if (!config.itemConfig || !config.itemConfig.type) {
      // return the raw value if no itemConfig is provided
      return value
    }

    try {
      if (!isArrayPortValue(value)) {
        throw new PortError(
          PortErrorType.SerializationError,
          'Invalid array value structure',
        )
      }

      const plugin = PortPluginRegistry.getInstance().getPlugin(config.itemConfig.type)
      if (!plugin) {
        throw new PortError(
          PortErrorType.SerializationError,
          `Unknown item config type: ${config.itemConfig.type}`,
        )
      }

      if (value.length === 0) {
        return []
      }

      // Serialize each array item using its corresponding plugin
      return value.map((item, index) => {
        return plugin.serializeValue(item, config.itemConfig) as JSONValue
      })
    } catch (error) {
      throw new PortError(
        PortErrorType.SerializationError,
        error instanceof Error ? error.message : 'Unknown error during array serialization',
      )
    }
  },
  deserializeValue: (data: JSONValue, config: ArrayPortConfig): ArrayPortValue => {
    if (data === undefined || data === null || !Array.isArray(data)) {
      return []
    }

    try {
      if (!isArrayPortValue(data)) {
        throw new PortError(
          PortErrorType.SerializationError,
          'Invalid array value for deserialization',
        )
      }

      const plugin = PortPluginRegistry.getInstance().getPlugin(config.itemConfig.type)
      if (!plugin) {
        throw new PortError(
          PortErrorType.SerializationError,
          `Unknown item config type: ${config.itemConfig.type}`,
        )
      }

      // Deserialize each array item using its corresponding plugin
      return (data as any[]).map((item, index) => {
        return plugin.deserializeValue(item, config.itemConfig) as IPortValue
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
      const plugin = PortPluginRegistry.getInstance().getPlugin(config.type)
      if (!plugin) {
        throw new PortError(
          PortErrorType.SerializationError,
          `Unknown plugin type: ${config.type}`,
        )
      }

      if (!config.itemConfig || !config.itemConfig.type) {
        // return the raw config if no itemConfig is provided
        return { ...config }
      }

      const pluginItem = PortPluginRegistry.getInstance().getPlugin(config.itemConfig.type)
      if (!pluginItem) {
        throw new PortError(
          PortErrorType.SerializationError,
          `Unknown item config type: ${config.itemConfig.type}`,
        )
      }

      const serializedConfig = {
        ...config,
        itemConfig: pluginItem.serializeConfig(config.itemConfig),
      }

      let defaultValueSerialized: ArrayPortValue | undefined
      if (config.defaultValue !== undefined) {
        serializedConfig.defaultValue = plugin.serializeValue(config.defaultValue, config) as ArrayPortValue
      }

      return serializedConfig
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

      if (!result.data.itemConfig || !result.data.itemConfig.type) {
        // return the raw config if no itemConfig is provided
        return { ...result.data }
      }

      // Deserialize the nested itemConfig using its corresponding plugin
      const itemPlugin = PortPluginRegistry.getInstance().getPlugin(result.data.itemConfig.type)
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

      const plugin = PortPluginRegistry.getInstance().getPlugin(config.type)
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
    if (value === undefined || value === null) {
      return []
    }

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
