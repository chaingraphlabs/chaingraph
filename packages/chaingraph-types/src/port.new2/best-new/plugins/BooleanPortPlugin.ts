import type { JSONValue } from '../base/json'
import type {
  BooleanPortConfig,
  BooleanPortValue,
  IPortPlugin,
} from '../base/types'
import { z } from 'zod'
import { basePortConfigSchema } from '../base/base-config.schema'
import {
  isBooleanPortValue,
  PortError,
  PortErrorType,
} from '../base/types'

/**
 * Schemas for boolean port validation
 */

// Value schema for boolean ports
const valueSchema: z.ZodType<BooleanPortValue> = z.object({
  type: z.literal('boolean'),
  value: z.boolean(),
}).passthrough()

// Boolean-specific schema
const booleanSpecificSchema = z.object({
  type: z.literal('boolean'),
  defaultValue: valueSchema.optional(),
}).passthrough()

// Merge base schema with boolean-specific schema to create the final config schema
const configSchema: z.ZodType<BooleanPortConfig> = basePortConfigSchema
  .merge(booleanSpecificSchema)

/**
 * Helper to create a boolean port value
 */
export function createBooleanValue(value: boolean): BooleanPortValue {
  return {
    type: 'boolean',
    value,
  }
}

/**
 * Helper to create a boolean port config
 */
export function createBooleanConfig(options: Partial<Omit<BooleanPortConfig, 'type'>> = {}): BooleanPortConfig {
  return {
    type: 'boolean',
    ...options,
  }
}

/**
 * Boolean port plugin implementation
 */
export const BooleanPortPlugin: IPortPlugin<'boolean'> = {
  typeIdentifier: 'boolean',
  configSchema,
  valueSchema,
  serializeValue: (value: BooleanPortValue): JSONValue => {
    try {
      if (!isBooleanPortValue(value)) {
        throw new PortError(
          PortErrorType.SerializationError,
          'Invalid boolean value structure',
        )
      }
      return {
        type: 'boolean',
        value: value.value,
      }
    } catch (error) {
      throw new PortError(
        PortErrorType.SerializationError,
        error instanceof Error ? error.message : 'Unknown error during boolean serialization',
      )
    }
  },
  deserializeValue: (data: JSONValue) => {
    try {
      if (!isBooleanPortValue(data)) {
        throw new PortError(
          PortErrorType.SerializationError,
          'Invalid boolean value for deserialization',
        )
      }
      return {
        type: 'boolean',
        value: data.value,
      }
    } catch (error) {
      throw new PortError(
        PortErrorType.SerializationError,
        error instanceof Error ? error.message : 'Unknown error during boolean deserialization',
      )
    }
  },
  serializeConfig: (config: BooleanPortConfig): JSONValue => {
    try {
      // For boolean port, we can simply return the config as is
      // since it doesn't contain any non-serializable parts
      return config
    } catch (error) {
      throw new PortError(
        PortErrorType.SerializationError,
        error instanceof Error ? error.message : 'Unknown error during boolean config serialization',
      )
    }
  },
  deserializeConfig: (data: JSONValue) => {
    try {
      const result = configSchema.safeParse(data)
      if (!result.success) {
        throw new PortError(
          PortErrorType.SerializationError,
          'Invalid boolean configuration for deserialization',
          result.error,
        )
      }
      return result.data
    } catch (error) {
      throw new PortError(
        PortErrorType.SerializationError,
        error instanceof Error ? error.message : 'Unknown error during boolean config deserialization',
      )
    }
  },
  validateValue: (value: BooleanPortValue, _config: BooleanPortConfig): string[] => {
    const errors: string[] = []

    if (!isBooleanPortValue(value)) {
      errors.push('Invalid boolean value structure')
    }

    return errors
  },
  validateConfig: (config: BooleanPortConfig): string[] => {
    const result = configSchema.safeParse(config)
    if (!result.success) {
      return result.error.errors.map((issue: z.ZodIssue) => issue.message)
    }
    return []
  },
}
