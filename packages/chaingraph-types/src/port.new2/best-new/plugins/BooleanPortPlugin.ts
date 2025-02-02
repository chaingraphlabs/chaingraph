import type {
  BooleanPortConfig,
  BooleanPortValue,
} from '../base/types'
import { z } from 'zod'
import {
  createPortPlugin,
  isBooleanPortValue,
  PortError,
  PortErrorType,
} from '../base/types'

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
 * Boolean port configuration schema
 */
const configSchema = z.object({
  type: z.literal('boolean'),
  id: z.string().optional(),
  name: z.string().optional(),
  metadata: z.record(z.unknown()).optional(),
  defaultValue: z.boolean().optional(),
}).passthrough()

/**
 * Boolean port value schema
 */
const valueSchema = z.object({
  type: z.literal('boolean'),
  value: z.boolean(),
}).passthrough()

/**
 * Boolean port plugin implementation
 */
export const BooleanPortPlugin = {
  ...createPortPlugin(
    'boolean',
    configSchema,
    valueSchema,
    (value: BooleanPortValue) => {
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
    (data: unknown) => {
      try {
        const result = valueSchema.safeParse(data)
        if (!result.success) {
          throw new PortError(
            PortErrorType.SerializationError,
            'Invalid boolean value for deserialization',
          )
        }
        return result.data
      } catch (error) {
        throw new PortError(
          PortErrorType.SerializationError,
          error instanceof Error ? error.message : 'Unknown error during boolean deserialization',
        )
      }
    },
  ),
  validate: (value: BooleanPortValue, config: BooleanPortConfig): string[] => {
    const errors: string[] = []

    if (!isBooleanPortValue(value)) {
      errors.push('Invalid boolean value structure')
      return errors
    }

    return errors
  },
}
