import type { JSONValue } from '../base/json'
import type {
  IPortPlugin,
  StringPortConfig,
  StringPortValue,
} from '../base/types'
import { z } from 'zod'
import { basePortConfigSchema } from '../base/base-config.schema'
import {
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
    // eslint-disable-next-line no-new
    new RegExp(pattern)
    return { valid: true }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Invalid regex pattern'
    return {
      valid: false,
      error: `Invalid regular expression: ${errorMessage}`,
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
 * String port value schema
 */
const valueSchema = z.object({
  type: z.literal('string'),
  value: z.string(),
}).passthrough()

/**
 * String port configuration schema
 */
// String-specific schema
const stringSpecificSchema = z.object({
  type: z.literal('string'),
  defaultValue: valueSchema.optional(),
  minLength: z.number().int().min(0).optional(),
  maxLength: z.number().int().min(1).optional(),
  pattern: z.string().optional(),
}).passthrough()

// Merge base schema with string-specific schema
const configSchema = basePortConfigSchema.merge(stringSpecificSchema).superRefine((data, ctx) => {
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
export const StringPortPlugin: IPortPlugin<'string'> = {
  typeIdentifier: 'string',
  configSchema,
  valueSchema,
  serializeValue: (value: StringPortValue): JSONValue => {
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
  deserializeValue: (data: JSONValue) => {
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
  serializeConfig: (config: StringPortConfig): JSONValue => {
    try {
      // For string port, we can simply return the config as is
      // since it doesn't contain any non-serializable parts
      return config
    } catch (error) {
      throw new PortError(
        PortErrorType.SerializationError,
        error instanceof Error ? error.message : 'Unknown error during string config serialization',
      )
    }
  },
  deserializeConfig: (data: JSONValue) => {
    try {
      const result = configSchema.safeParse(data)
      if (!result.success) {
        throw new PortError(
          PortErrorType.SerializationError,
          'Invalid string configuration for deserialization',
          result.error,
        )
      }
      return result.data
    } catch (error) {
      throw new PortError(
        PortErrorType.SerializationError,
        error instanceof Error ? error.message : 'Unknown error during string config deserialization',
      )
    }
  },
  validateValue: (value: StringPortValue, config: StringPortConfig): string[] => {
    const errors: string[] = []

    if (typeof config.minLength === 'number' && value.value.length < config.minLength) {
      errors.push(`String must be at least ${config.minLength} characters long`)
    }

    if (typeof config.maxLength === 'number' && value.value.length > config.maxLength) {
      errors.push(`String must be at most ${config.maxLength} characters long`)
    }

    if (typeof config.pattern === 'string') {
      try {
        const regex = new RegExp(config.pattern)
        if (!regex.test(value.value)) {
          errors.push(`String must match pattern: ${config.pattern}`)
        }
      } catch (error) {
        errors.push(`Invalid pattern: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    }

    return errors
  },
  validateConfig: (config: StringPortConfig): string[] => {
    const parseResult = configSchema.safeParse(config)
    if (!parseResult.success) {
      return parseResult.error.errors.map(issue => issue.message)
    }
    // Optionally, add additional checks (e.g., custom logic for default values, etc.)
    return []
  },
}
