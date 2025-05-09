/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { JSONValue } from '../../utils/json'
import type { EnumPortConfig, EnumPortValue, IPortConfig, IPortPlugin } from '../base'
import { z } from 'zod'
import {
  basePortConfigSchema,
  enumPortConfigUISchema,
  isEnumPortValue,
  PortError,
  PortErrorType,
} from '../base'
import { PortPluginRegistry } from './PortPluginRegistry'

/**
 * Helper to create an enum port value
 */
export function createEnumValue(value: string): EnumPortValue {
  return value
}

/**
 * Helper to create an enum port config
 */
export function createEnumConfig(options: IPortConfig[], configOptions: Partial<Omit<EnumPortConfig, 'type' | 'options'>> = {}): EnumPortConfig {
  return {
    type: 'enum',
    options,
    ...configOptions,
  }
}

/**
 * Enum port value schema
 */
const valueSchema: z.ZodType<EnumPortValue> = z.string()

/**
 * Enum port configuration schema
 */
const enumSpecificSchema = z.object({
  type: z.literal('enum'),
  options: z.array(z.custom<IPortConfig>((val) => {
    if (val === undefined) {
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
    // Validate each option using its corresponding plugin
    const plugin = PortPluginRegistry.getInstance().getPlugin((val as any).type)
    if (!plugin) {
      return false
    }
    const result = plugin.configSchema.safeParse(val)
    return result.success
  }, { message: 'Invalid option configuration' })),
  defaultValue: valueSchema.optional(),
  ui: enumPortConfigUISchema.optional(),
}).passthrough()

// Merge base schema with enum-specific schema
const configSchema = basePortConfigSchema.merge(enumSpecificSchema)

/**
 * Validate enum value against config
 */
export function validateEnumValue(
  value: unknown,
  config: EnumPortConfig,
): string[] {
  const errors: string[] = []

  if (value === undefined || value === null) {
    return errors
  }

  // Type validation
  if (!isEnumPortValue(value)) {
    errors.push('Invalid enum value structure')
    return errors
  }

  // Validate that the value matches one of the option ids
  const validOptionIds = config.options
    .map(option => option.id)
    .filter((id): id is string => typeof id === 'string')

  if (value !== undefined) {
    if (!validOptionIds.includes(value)) {
      errors.push(`Value must be one of the valid option ids: ${validOptionIds.join(', ')}`)
    }
  }

  return errors
}

/**
 * Enum port plugin implementation
 */
export const EnumPortPlugin: IPortPlugin<'enum'> = {
  typeIdentifier: 'enum',
  configSchema,
  valueSchema,
  serializeValue: (value: EnumPortValue): JSONValue => {
    if (value === undefined || value === null) {
      return ''
    }

    try {
      if (!isEnumPortValue(value)) {
        throw new PortError(
          PortErrorType.SerializationError,
          'Invalid enum value structure',
        )
      }
      return value
    } catch (error) {
      throw new PortError(
        PortErrorType.SerializationError,
        error instanceof Error ? error.message : 'Unknown error during enum serialization',
      )
    }
  },
  deserializeValue: (data: JSONValue): EnumPortValue => {
    if (data === undefined || data === null) {
      return ''
    }

    try {
      if (!isEnumPortValue(data)) {
        throw new PortError(
          PortErrorType.SerializationError,
          'Invalid enum value for deserialization',
        )
      }
      return data
    } catch (error) {
      throw new PortError(
        PortErrorType.SerializationError,
        error instanceof Error ? error.message : 'Unknown error during enum deserialization',
      )
    }
  },
  serializeConfig: (config: EnumPortConfig): JSONValue => {
    try {
      // Serialize each option using its corresponding plugin
      const serializedOptions = config.options.map((option) => {
        const plugin = PortPluginRegistry.getInstance().getPlugin(option.type)
        if (!plugin) {
          throw new PortError(
            PortErrorType.SerializationError,
            `Unknown option type: ${option.type}`,
          )
        }
        return plugin.serializeConfig(option)
      })

      return {
        ...config,
        options: serializedOptions,
      }
    } catch (error) {
      throw new PortError(
        PortErrorType.SerializationError,
        error instanceof Error ? error.message : 'Unknown error during enum config serialization',
      )
    }
  },
  deserializeConfig: (data: JSONValue): EnumPortConfig => {
    try {
      const result = configSchema.safeParse(data)
      if (!result.success) {
        throw new PortError(
          PortErrorType.SerializationError,
          'Invalid enum configuration for deserialization',
          result.error,
        )
      }

      // Deserialize each option using its corresponding plugin
      const deserializedOptions = result.data.options.map((option) => {
        const plugin = PortPluginRegistry.getInstance().getPlugin(option.type)
        if (!plugin) {
          throw new PortError(
            PortErrorType.SerializationError,
            `Unknown option type: ${option.type}`,
          )
        }
        return plugin.deserializeConfig(option)
      })

      return {
        ...result.data,
        options: deserializedOptions,
      }
    } catch (error) {
      throw new PortError(
        PortErrorType.SerializationError,
        error instanceof Error ? error.message : 'Unknown error during enum config deserialization',
      )
    }
  },
  validateValue: (value: EnumPortValue, config: EnumPortConfig): string[] => {
    return validateEnumValue(value, config)
  },
  validateConfig: (config: EnumPortConfig): string[] => {
    const errors: string[] = []

    // Validate using the Zod schema
    const result = configSchema.safeParse(config)
    if (!result.success) {
      return result.error.errors.map(issue => issue.message)
    }

    // Validate each option using its corresponding plugin
    config.options.forEach((option, index) => {
      const plugin = PortPluginRegistry.getInstance().getPlugin(option.type)
      if (!plugin) {
        errors.push(`Invalid option type at index ${index}: ${option.type}`)
        return
      }

      const optionErrors = plugin.validateConfig(option)
      if (optionErrors.length > 0) {
        errors.push(...optionErrors.map(err => `Option ${index}: ${err}`))
      }
    })

    // Validate that options have unique ids
    const ids = config.options
      .map(option => option.id)
      .filter((id): id is string => typeof id !== 'undefined')
    const uniqueIds = new Set(ids)
    if (uniqueIds.size !== ids.length) {
      errors.push('Option ids must be unique')
    }

    return errors
  },
}
