/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { JSONValue } from '../../utils/json'
import type { IPortPlugin, StringPortConfig, StringPortValue } from '../base'
import Decimal from 'decimal.js'
import { z } from 'zod'
import { isBooleanPortValue } from '../base'
import { isNumberPortValue } from '../base'
import {
  basePortConfigSchema,
  isStringPortValue,
  PortError,
  PortErrorType,
  stringPortConfigUISchema,
} from '../base'

/**
 * Helper to create a string port value
 */
export function createStringValue(value: string): StringPortValue {
  return value
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
const valueSchema = z.string()

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
  ui: stringPortConfigUISchema.optional(),
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
  if (!isStringPortValue(value)) {
    errors.push('Invalid string value structure')
    return errors
  }

  // Length validation
  if (config.minLength !== undefined && value.length < config.minLength) {
    errors.push(`String must be at least ${config.minLength} characters long`)
  }

  if (config.maxLength !== undefined && value.length > config.maxLength) {
    errors.push(`String must be at most ${config.maxLength} characters long`)
  }

  // Pattern validation
  if (config.pattern !== undefined) {
    const validation = validateRegexPattern(config.pattern)
    if (!validation.valid) {
      errors.push(`Invalid pattern: ${validation.error}`)
    } else if (!testRegexPattern(value, config.pattern)) {
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
    if (value === undefined || value === null) {
      return ''
    }

    try {
      if (!isStringPortValue(value)) {
        if (isNumberPortValue(value)) {
          // If the value is a number, convert it to a string
          return new Decimal(value).toString()
        }

        if (isBooleanPortValue(value)) {
          // If the value is a boolean, convert it to a string
          return value ? 'true' : 'false'
        }

        if (typeof value === 'object' || Array.isArray(value)) {
          // If the value is an object, convert it to a string
          return JSON.stringify(value)
        }

        throw new PortError(
          PortErrorType.SerializationError,
          `Invalid string value structure, actual type: ${typeof value}: ${JSON.stringify(value)}`,
        )
      }
      return value
    } catch (error) {
      throw new PortError(
        PortErrorType.SerializationError,
        error instanceof Error ? error.message : 'Unknown error during string serialization',
      )
    }
  },
  deserializeValue: (data: JSONValue) => {
    if (data === undefined || data === null) {
      return ''
    }

    try {
      if (!isStringPortValue(data)) {
        if (isNumberPortValue(data)) {
          return new Decimal(data).toString()
        }
        throw new PortError(
          PortErrorType.SerializationError,
          'Invalid string value for deserialization',
        )
      }
      return data
    } catch (error) {
      throw new PortError(
        PortErrorType.SerializationError,
        error instanceof Error ? error.message : 'Unknown error during string deserialization',
      )
    }
  },
  serializeConfig: (config: StringPortConfig): JSONValue => {
    try {
      if (isNumberPortValue(config.defaultValue)) {
        // If the value is a number, convert it to a string
        return {
          ...config,
          defaultValue: new Decimal(config.defaultValue).toString(),
        }
      }

      return { ...config }
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
    if (!isStringPortValue(value)) {
      return ['Invalid string value structure']
    }

    const errors: string[] = []

    if (typeof config.minLength === 'number' && value.length < config.minLength) {
      errors.push(`String must be at least ${config.minLength} characters long`)
    }

    if (typeof config.maxLength === 'number' && value.length > config.maxLength) {
      errors.push(`String must be at most ${config.maxLength} characters long`)
    }

    if (typeof config.pattern === 'string') {
      try {
        const regex = new RegExp(config.pattern)
        if (!regex.test(value)) {
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
    return []
  },
}
