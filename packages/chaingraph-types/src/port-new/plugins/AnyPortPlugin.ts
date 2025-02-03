import type { JSONValue } from '../base/json'
import type {
  AnyPortConfig,
  AnyPortValue,
  IPortConfig,
  IPortPlugin,
  IPortValue,

  PortType,
} from '../base/types'
import { basePortConfigUISchema } from '@chaingraph/types/port-new/base'
import { z } from 'zod'
import { basePortConfigSchema } from '../base/base-config.schema'
import {
  isAnyPortValue,
  PortError,
  PortErrorType,
} from '../base/types'
import { portRegistry } from '../registry/PortPluginRegistry'

/**
 * Type guard for any value
 */
export function isAnyValue(value: unknown): value is AnyPortValue {
  return (
    typeof value === 'object'
    && value !== null
    && 'type' in value
    && value.type === 'any'
    && 'value' in value
    && typeof value.value === 'object'
  )
}

/**
 * Helper to create an any port value
 */
export function createAnyValue(value: IPortValue): AnyPortValue {
  return {
    type: 'any',
    value,
  }
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
const valueSchema = z.object({
  type: z.literal('any'),
  value: z.custom<IPortValue>((val) => {
    if (
      typeof val !== 'object'
      || val === null
      || !('type' in val)
      || typeof (val as any).type !== 'string'
    ) {
      return false
    }
    const plugin = portRegistry.getPlugin((val as any).type as PortType)
    if (!plugin) {
      return false
    }

    if ((val as any)?.value === undefined) {
      return true
    }

    const result = plugin.valueSchema.safeParse(val)
    return result.success
  }, { message: 'Invalid AnyPort value' }).optional(),
}).passthrough()

/**
 * Any port configuration schema
 */
const anySpecificSchema = z.object({
  type: z.literal('any'),
  underlyingType: z.custom<IPortConfig | undefined>((val) => {
    if (
      typeof val !== 'object'
      || val === null
      || !('type' in val)
      || typeof (val as any).type !== 'string'
    ) {
      return false
    }
    const plugin = portRegistry.getPlugin((val as any).type as PortType)
    if (!plugin) {
      return false
    }
    const result = plugin.configSchema.safeParse(val)
    return result.success
  }, { message: 'Invalid underlying port configuration' }),
  defaultValue: valueSchema.optional(),
  ui: basePortConfigUISchema.optional(),
}).passthrough()

// Merge base schema with any-specific schema
const configSchema = basePortConfigSchema.merge(anySpecificSchema)

/**
 * Validate any value against config
 */
export function validateAnyValue(
  value: unknown,
  config: AnyPortConfig,
): string[] {
  const errors: string[] = []

  // Type validation
  if (!isAnyValue(value)) {
    errors.push('Invalid any value structure')
    return errors
  }

  if (config.underlyingType !== undefined && config.underlyingType !== null) {
    // Get the plugin for the underlying type
    const plugin = portRegistry.getPlugin(config.underlyingType.type)
    if (!plugin) {
      errors.push(`Unknown underlying type: ${config.underlyingType.type}`)
      return errors
    }

    // Validate the inner value using the underlying plugin
    if (value.value !== undefined) {
      const innerErrors = plugin.validateValue(value.value, config.underlyingType)
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
  serializeValue: (value: AnyPortValue): JSONValue => {
    try {
      if (!isAnyPortValue(value)) {
        throw new PortError(
          PortErrorType.SerializationError,
          'Invalid any value structure',
        )
      }

      if (value.value === undefined) {
        return {
          type: 'any',
          value: undefined,
        }
      }

      // Get the plugin for the inner value's type
      const plugin = portRegistry.getPlugin(value.value.type)
      if (!plugin) {
        throw new PortError(
          PortErrorType.SerializationError,
          `Unknown value type: ${value.value.type}`,
        )
      }

      // Serialize the inner value using its plugin
      const serializedInnerValue = plugin.serializeValue(value.value)

      return {
        type: 'any',
        value: serializedInnerValue,
      }
    } catch (error) {
      throw new PortError(
        PortErrorType.SerializationError,
        error instanceof Error ? error.message : 'Unknown error during any serialization',
      )
    }
  },
  deserializeValue: (data: JSONValue): AnyPortValue => {
    try {
      if (
        typeof data !== 'object'
        || data === null
        || !('type' in data)
        || data.type !== 'any'
        || !('value' in data)
      ) {
        throw new PortError(
          PortErrorType.SerializationError,
          'Invalid any value structure',
        )
      }

      const innerValue = data.value
      if (
        typeof innerValue !== 'object'
        || innerValue === null
        || !('type' in innerValue)
        || typeof (innerValue as any).type !== 'string'
      ) {
        throw new PortError(
          PortErrorType.SerializationError,
          'Invalid inner value structure',
        )
      }

      // Get the plugin for the inner value's type
      const plugin = portRegistry.getPlugin((innerValue as any).type as PortType)
      if (!plugin) {
        throw new PortError(
          PortErrorType.SerializationError,
          `Unknown value type: ${(innerValue as any).type}`,
        )
      }

      // Deserialize the inner value using its plugin
      const deserializedInnerValue = plugin.deserializeValue(innerValue)

      return {
        type: 'any',
        value: deserializedInnerValue,
      }
    } catch (error) {
      throw new PortError(
        PortErrorType.SerializationError,
        error instanceof Error ? error.message : 'Unknown error during any deserialization',
      )
    }
  },
  serializeConfig: (config: AnyPortConfig): JSONValue => {
    try {
      let underlyingTypeSerialized: JSONValue
      let defaultValueSerialized: JSONValue

      if (config.underlyingType !== undefined && config.underlyingType !== null) {
        // Get the plugin for the underlying type
        const plugin = portRegistry.getPlugin(config.underlyingType.type)
        if (!plugin) {
          throw new PortError(
            PortErrorType.SerializationError,
            `Unknown underlying type: ${config.underlyingType.type}`,
          )
        }

        // Serialize the underlying type config using its plugin
        underlyingTypeSerialized = plugin.serializeConfig(config.underlyingType)
      }

      if (config.defaultValue !== undefined) {
        // Get the plugin for the default value's type
        const plugin = portRegistry.getPlugin(config.defaultValue.type)
        if (!plugin) {
          throw new PortError(
            PortErrorType.SerializationError,
            `Unknown default value type: ${config.defaultValue.type}`,
          )
        }

        // Serialize the default value using its plugin
        defaultValueSerialized = plugin.serializeValue(config.defaultValue)
      }

      return {
        ...config,
        underlyingType: underlyingTypeSerialized,
        defaultValue: defaultValueSerialized,
      }
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
          'Invalid any configuration for deserialization',
          result.error,
        )
      }

      if (
        result.data.underlyingType !== undefined
        && result.data.underlyingType !== null
        && typeof result.data.underlyingType === 'object'
        && 'type' in result.data.underlyingType
      ) {
        // Get the plugin for the underlying type
        const plugin = portRegistry.getPlugin(result.data.underlyingType.type)
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
          defaultValue: result.data.defaultValue,
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
      const plugin = portRegistry.getPlugin(config.underlyingType.type)
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
