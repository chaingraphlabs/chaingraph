import type { IPortConfig, IPortPlugin, IPortValue } from '../base/types'
import { z } from 'zod'

/**
 * Configuration schema for string ports
 */
interface StringPortConfig extends IPortConfig {
  type: 'string'
  defaultValue?: string
  minLength?: number
  maxLength?: number
  pattern?: string
}

/**
 * Value schema for string ports
 */
interface StringPortValue extends IPortValue<string> {
  type: 'string'
}

/**
 * Validate a regular expression pattern
 */
function isValidRegex(pattern: string): boolean {
  try {
    // eslint-disable-next-line no-new
    new RegExp(pattern)
    return true
  } catch {
    return false
  }
}

// Create base schemas first
const configSchema = z.object({
  type: z.literal('string'),
  id: z.string().optional(),
  name: z.string().optional(),
  metadata: z.record(z.unknown()).optional(),
  defaultValue: z.string().optional(),
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

  // Validate pattern is a valid regex
  if (data.pattern !== undefined && !isValidRegex(data.pattern)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: `Invalid regular expression pattern: ${data.pattern}`,
      path: ['pattern'],
    })
  }

  // Validate defaultValue against constraints
  if (data.defaultValue !== undefined) {
    if (data.minLength !== undefined && data.defaultValue.length < data.minLength) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Default value length (${data.defaultValue.length}) is less than minLength (${data.minLength})`,
        path: ['defaultValue'],
      })
    }
    if (data.maxLength !== undefined && data.defaultValue.length > data.maxLength) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Default value length (${data.defaultValue.length}) is greater than maxLength (${data.maxLength})`,
        path: ['defaultValue'],
      })
    }
    if (data.pattern !== undefined && isValidRegex(data.pattern)) {
      const regex = new RegExp(data.pattern)
      if (!regex.test(data.defaultValue)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Default value does not match pattern: ${data.pattern}`,
          path: ['defaultValue'],
        })
      }
    }
  }
})

const valueSchema = z.object({
  type: z.literal('string'),
  value: z.string(),
}).passthrough()

// Schema for validating value against config
const validationSchema = z.object({
  config: configSchema,
  value: valueSchema,
}).superRefine((data, ctx) => {
  const { config, value } = data

  // Validate value against constraints
  if (config.minLength !== undefined && value.value.length < config.minLength) {
    ctx.addIssue({
      code: z.ZodIssueCode.too_small,
      message: `String must be at least ${config.minLength} characters long`,
      minimum: config.minLength,
      type: 'string',
      inclusive: true,
      path: ['value', 'value'],
    })
  }

  if (config.maxLength !== undefined && value.value.length > config.maxLength) {
    ctx.addIssue({
      code: z.ZodIssueCode.too_big,
      message: `String must be at most ${config.maxLength} characters long`,
      maximum: config.maxLength,
      type: 'string',
      inclusive: true,
      path: ['value', 'value'],
    })
  }

  if (config.pattern !== undefined && isValidRegex(config.pattern)) {
    const regex = new RegExp(config.pattern)
    if (!regex.test(value.value)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `String must match pattern: ${config.pattern}`,
        path: ['value', 'value'],
      })
    }
  }
})

/**
 * Plugin implementation for string ports
 */
export const StringPortPlugin: IPortPlugin<StringPortConfig, StringPortValue> = {
  typeIdentifier: 'string',
  configSchema,
  valueSchema,
  serializeValue: (value: StringPortValue) => value.value,
  deserializeValue: (data: unknown) => {
    if (typeof data !== 'string') {
      throw new TypeError('Expected string value for deserialization')
    }
    return {
      type: 'string',
      value: data,
    }
  },
}

/**
 * Helper function for string validation
 */
function validateStringValue(value: string, config: StringPortConfig): string[] {
  const result = validationSchema.safeParse({
    config,
    value: { type: 'string', value },
  })
  if (!result.success) {
    return result.error.errors
      .filter(err => err.path[0] === 'value') // Only return value-related errors
      .map(err => err.message)
  }
  return []
}

export { validateStringValue }
