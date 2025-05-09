/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { JSONValue } from '../../utils/json'
import type {
  AnyPortConfig,
  AnyPortValue,
  IPortConfig,
  IPortPlugin,
  IPortValue,
  PortType,
} from '../base'
import { z } from 'zod'
import {
  basePortConfigSchema,
  basePortConfigUISchema,
  isAnyPortValue,
  PortError,
  PortErrorType,
} from '../base'
import { PortPluginRegistry } from './PortPluginRegistry'

/**
 * Helper to create an any port value
 */
export function createAnyValue(value: IPortValue): AnyPortValue {
  return value
}

/**
 * Helper to create an any port config
 */
export function createAnyConfig(
  underlyingType: IPortConfig,
  options: Partial<Omit<AnyPortConfig, 'type' | 'underlyingType'>> = {},
): AnyPortConfig {
  return {
    type: 'any',
    underlyingType,
    ...options,
  }
}

/**
 * Any port value schema
 */
const valueSchema = z.custom<any>((val) => {
  // TODO: decide if we want to validate the value against the underlying type
  // const result = PortPluginRegistry.getInstance().getValueUnionSchema().safeParse(val)
  // return result.success
  return true
}, { message: 'Invalid AnyPort value' }).optional().nullable()

/**
 * Any port configuration schema
 */
const anySpecificSchema = z.object({
  type: z.literal('any'),
  // underlyingType: z.any(),
  underlyingType: z.custom<IPortConfig | undefined>((val) => {
    if (val === undefined || val === null) {
      return true
    }

    if (
      typeof val !== 'object'
      || !('type' in val)
      || typeof (val as any).type !== 'string'
    ) {
      return false
    }
    const plugin = PortPluginRegistry.getInstance().getPlugin(
      (val as any).type as PortType,
    )
    if (!plugin) {
      return false
    }
    const result = plugin.configSchema.safeParse(val)
    return result.success
  }, { message: 'Invalid underlying port configuration' }),
  defaultValue: valueSchema.optional().nullable(),
  ui: basePortConfigUISchema.optional(),
}).passthrough()

// Merge base schema with any-specific schema
const configSchema = basePortConfigSchema.merge(anySpecificSchema).passthrough()

/**
 * Validate any value against config
 */
export function validateAnyValue(
  value: unknown,
  config: AnyPortConfig,
): string[] {
  const errors: string[] = []

  if (value === undefined) {
    return errors
  }

  // Type validation
  if (!isAnyPortValue(value)) {
    errors.push('Invalid any value structure')
    return errors
  }

  if (config.underlyingType !== undefined && config.underlyingType !== null) {
    // Get the plugin for the underlying type
    const plugin = PortPluginRegistry.getInstance().getPlugin(config.underlyingType.type)
    if (!plugin) {
      errors.push(`Unknown underlying type: ${config.underlyingType.type}`)
      return errors
    }

    // Validate the inner value using the underlying plugin
    if (value !== undefined) {
      const innerErrors = plugin.validateValue(value, config.underlyingType)
      errors.push(...innerErrors)
    }
  }

  return errors
}

/**
 * Any port plugin implementation
 */
export const AnyPortPlugin: IPortPlugin<'any'> = {
  typeIdentifier: 'any',
  configSchema,
  valueSchema,
  serializeValue: (value: AnyPortValue, config: AnyPortConfig): JSONValue => {
    if (value === undefined || value === null) {
      return value
    }

    try {
      if (!isAnyPortValue(value)) {
        throw new PortError(
          PortErrorType.SerializationError,
          'Invalid any value structure',
        )
      }

      if (value === undefined) {
        return undefined
      }

      if (config.underlyingType === undefined || config.underlyingType === null) {
        // just return raw value because we don't know how to serialize it
        return value
      }

      // Get the plugin for the inner value's type
      const plugin = PortPluginRegistry.getInstance().getPlugin(config.underlyingType.type)
      if (!plugin) {
        throw new PortError(
          PortErrorType.SerializationError,
          `Unknown value type: ${config.underlyingType.type}`,
        )
      }

      // Serialize the inner value using its plugin
      return plugin.serializeValue(value, config.underlyingType)
    } catch (error) {
      throw new PortError(
        PortErrorType.SerializationError,
        error instanceof Error ? error.message : 'Unknown error during any serialization',
      )
    }
  },
  deserializeValue: (data: JSONValue, config: AnyPortConfig): AnyPortValue => {
    try {
      const innerValue = data
      if (innerValue === undefined || config.underlyingType === undefined || config.underlyingType === null) {
        // just return raw value because we don't know how to deserialize it
        return data
      }

      // Get the plugin for the inner value's type
      const plugin = PortPluginRegistry.getInstance().getPlugin(config.underlyingType.type)
      if (!plugin) {
        throw new PortError(
          PortErrorType.SerializationError,
          `Unknown value type: ${(innerValue as any).type}`,
        )
      }

      // Deserialize the inner value using its plugin
      return plugin.deserializeValue(innerValue, config.underlyingType)
    } catch (error) {
      throw new PortError(
        PortErrorType.SerializationError,
        error instanceof Error ? error.message : 'Unknown error during any deserialization',
      )
    }
  },
  serializeConfig: (config: AnyPortConfig): JSONValue => {
    try {
      let underlyingTypeSerialized: JSONValue | undefined
      let defaultValueSerialized: JSONValue = config.defaultValue

      if (config.underlyingType !== undefined && config.underlyingType !== null) {
        // Get the plugin for the underlying type
        const plugin = PortPluginRegistry.getInstance().getPlugin(config.underlyingType.type)
        if (!plugin) {
          throw new PortError(
            PortErrorType.SerializationError,
            `Unknown underlying type: ${config.underlyingType.type}`,
          )
        }

        // console.log(`[AnyPortPlugin] serializeConfig`, config)
        // console.log(`[AnyPortPlugin] plugin`, config.underlyingType.type)

        // Serialize the underlying type config using its plugin
        underlyingTypeSerialized = plugin.serializeConfig(config.underlyingType)
      }

      if (config.defaultValue !== undefined && config.underlyingType !== null && config.underlyingType !== undefined) {
        // Get the plugin for the default value's type
        const plugin = PortPluginRegistry.getInstance().getPlugin(config.underlyingType.type)
        if (!plugin) {
          throw new PortError(
            PortErrorType.SerializationError,
            `Unknown default value type: ${config.defaultValue}`,
          )
        }

        // Serialize the default value using its plugin
        defaultValueSerialized = plugin.serializeValue(config.defaultValue, config.underlyingType)
      }

      let result = {
        ...config,
        underlyingType: underlyingTypeSerialized,
      }

      if (defaultValueSerialized !== undefined) {
        result = {
          ...result,
          underlyingType: underlyingTypeSerialized,
          defaultValue: defaultValueSerialized,
        }
      }

      // console.log(`[AnyPortPlugin] FINAL RESULT SERIALIZE`, result)
      // console.log(`[AnyPortPlugin] FINAL RESULT ORIGINAL`, config)

      return result
    } catch (error) {
      throw new PortError(
        PortErrorType.SerializationError,
        error instanceof Error ? error.message : 'Unknown error during any config serialization',
      )
    }
  },
  deserializeConfig: (data: JSONValue): AnyPortConfig => {
    try {
      const result = configSchema.safeParse(data)
      if (!result.success) {
        throw new PortError(
          PortErrorType.SerializationError,
          `Invalid any configuration for deserialization ${JSON.stringify(result)} DATA: ${JSON.stringify(data)}`,
          result.error,
        )
      }

      if (
        result.data.underlyingType !== undefined
        && result.data.underlyingType !== null
        && typeof result.data.underlyingType === 'object'
        // && 'type' in result.data.underlyingType
      ) {
        // Get the plugin for the underlying type
        const plugin = PortPluginRegistry.getInstance().getPlugin(result.data.underlyingType.type)
        if (!plugin) {
          throw new PortError(
            PortErrorType.SerializationError,
            `Unknown underlying type: ${result.data.underlyingType.type}`,
          )
        }

        // Deserialize the underlying type config using its plugin
        const deserializedUnderlyingType = plugin.deserializeConfig(result.data.underlyingType)

        return {
          ...result.data,
          underlyingType: deserializedUnderlyingType,
          defaultValue: result.data.defaultValue ? plugin.deserializeValue(result.data.defaultValue, deserializedUnderlyingType) : undefined,
        }
      }

      return { ...result.data, underlyingType: undefined }
    } catch (error) {
      throw new PortError(
        PortErrorType.SerializationError,
        error instanceof Error ? error.message : 'Unknown error during any config deserialization',
      )
    }
  },
  validateValue: (value: AnyPortValue, config: AnyPortConfig): string[] => {
    return validateAnyValue(value, config)
  },
  validateConfig: (config: AnyPortConfig): string[] => {
    const errors: string[] = []

    // Validate using the Zod schema
    const result = configSchema.safeParse(config)
    if (!result.success) {
      return result.error.errors.map(issue => issue.message)
    }

    if (config.underlyingType !== undefined && config.underlyingType !== null) {
      // Get the plugin for the underlying type
      const plugin = PortPluginRegistry.getInstance().getPlugin(config.underlyingType.type)
      if (!plugin) {
        errors.push(`Unknown underlying type: ${config.underlyingType.type}`)
        return errors
      }

      // Validate the underlying type config using its plugin
      const underlyingErrors = plugin.validateConfig(config.underlyingType)
      errors.push(...underlyingErrors.map(err => `Underlying config: ${err}`))
    }

    return errors
  },
}
