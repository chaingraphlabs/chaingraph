import type {
  StringPortConfig,
  StringPortValue,
} from '../base/types'
import { z } from 'zod'
import {
  createPortPlugin,
  PortError,
  PortErrorType,
} from '../base/types'

/**
 * Type guard for string value
 */
export function isStringValue(value: unknown): value is StringPortValue {
  return (
    typeof value === 'object'
    && value !== null
    && 'type' in value
    && value.type === 'string'
    && 'value' in value
    && typeof (value as StringPortValue).value === 'string'
  )
}

/**
 * Type guard for string config
 */
export function isStringPortConfig(config: unknown): config is StringPortConfig {
  return (
    typeof config === 'object'
    && config !== null
    && 'type' in config
    && config.type === 'string'
  )
}

/**
 * Helper to create a string port value
 */
export function createStringValue(value: string): StringPortValue {
  return {
    type: 'string',
    value,
  }
}

/**
 * Helper to create a string port config
 */
export function createStringConfig(options: Partial<Omit<StringPortConfig, 'type'>> = {}): StringPortConfig {
  return {
    type: 'string',
    ...options,
  }
}

/**
 * Validate regex pattern
 */
function validateRegexPattern(pattern: string): { valid: boolean, error?: string } {
  try {
    // Store the result to avoid using RegExp constructor for side effects
    const regex = new RegExp(pattern)
    return { valid: true }
  } catch (error) {
    return {
      valid: false,
      error: error instanceof Error ? error.message : 'Invalid regex pattern',
    }
  }
}

/**
 * Test string against regex pattern
 */
function testRegexPattern(value: string, pattern: string): boolean {
  const validation = validateRegexPattern(pattern)
  if (!validation.valid) {
    return false
  }
  return new RegExp(pattern).test(value)
}

/**
 * String port configuration schema
 */
const configSchema = z.object({
  type: z.literal('string'),
  id: z.string().optional(),
  name: z.string().optional(),
  metadata: z.record(z.unknown()).optional(),
  minLength: z.number().int().min(0).optional(),
  maxLength: z.number().int().min(1).optional(),
  pattern: z.string().optional(),
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

  // Validate pattern is valid regex
  if (data.pattern !== undefined) {
    const validation = validateRegexPattern(data.pattern)
    if (!validation.valid) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: validation.error || `Invalid regex pattern: ${data.pattern}`,
        path: ['pattern'],
      })
    }
  }
})

/**
 * String port value schema
 */
const valueSchema = z.object({
  type: z.literal('string'),
  value: z.string(),
}).passthrough()

/**
 * Validate string value against config
 */
export function validateStringValue(
  value: unknown,
  config: StringPortConfig,
): string[] {
  const errors: string[] = []

  // Type validation
  if (!isStringValue(value)) {
    errors.push('Invalid string value structure')
    return errors
  }

  // Length validation
  if (config.minLength !== undefined && value.value.length < config.minLength) {
    errors.push(`String must be at least ${config.minLength} characters long`)
  }

  if (config.maxLength !== undefined && value.value.length > config.maxLength) {
    errors.push(`String must be at most ${config.maxLength} characters long`)
  }

  // Pattern validation
  if (config.pattern !== undefined) {
    const validation = validateRegexPattern(config.pattern)
    if (!validation.valid) {
      errors.push(`Invalid pattern: ${validation.error}`)
    } else if (!testRegexPattern(value.value, config.pattern)) {
      errors.push(`String must match pattern: ${config.pattern}`)
    }
  }

  return errors
}

/**
 * String port plugin implementation
 */
export const StringPortPlugin = createPortPlugin(
  'string',
  configSchema,
  valueSchema,
  (value: StringPortValue) => {
    try {
      if (!isStringValue(value)) {
        throw new PortError(
          PortErrorType.SerializationError,
          'Invalid string value structure',
        )
      }
      return {
        type: 'string',
        value: value.value,
      }
    } catch (error) {
      throw new PortError(
        PortErrorType.SerializationError,
        error instanceof Error ? error.message : 'Unknown error during string serialization',
      )
    }
  },
  (data: unknown) => {
    try {
      if (!isStringValue(data)) {
        throw new PortError(
          PortErrorType.SerializationError,
          'Invalid string value for deserialization',
        )
      }
      return {
        type: 'string',
        value: data.value,
      }
    } catch (error) {
      throw new PortError(
        PortErrorType.SerializationError,
        error instanceof Error ? error.message : 'Unknown error during string deserialization',
      )
    }
  },
)
