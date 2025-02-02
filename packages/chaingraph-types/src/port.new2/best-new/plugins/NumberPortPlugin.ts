import type { IPortConfig, IPortPlugin, IPortValue } from '../base/types'
import { z } from 'zod'

/**
 * Configuration schema for number ports
 */
interface NumberPortConfig extends IPortConfig {
  type: 'number'
  defaultValue?: number
  min?: number
  max?: number
  step?: number
  integer?: boolean
}

/**
 * Value schema for number ports
 */
interface NumberPortValue extends IPortValue<number> {
  type: 'number'
}

// Create base schemas first
const configSchema = z.object({
  type: z.literal('number'),
  id: z.string().optional(),
  name: z.string().optional(),
  metadata: z.record(z.unknown()).optional(),
  defaultValue: z.number().optional(),
  min: z.number().optional(),
  max: z.number().optional(),
  step: z.number().positive().optional(),
  integer: z.boolean().optional(),
}).passthrough().superRefine((data, ctx) => {
  // Validate min/max relationship
  if (data.min !== undefined && data.max !== undefined) {
    if (data.min > data.max) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `min (${data.min}) must be less than or equal to max (${data.max})`,
        path: ['min'],
      })
    }
  }

  // Validate step is compatible with min/max range
  if (data.step !== undefined && data.min !== undefined && data.max !== undefined) {
    const range = data.max - data.min
    if (range % data.step !== 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `step (${data.step}) must divide range (${range}) evenly`,
        path: ['step'],
      })
    }
  }

  // Validate defaultValue against constraints
  if (data.defaultValue !== undefined) {
    if (data.min !== undefined && data.defaultValue < data.min) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Default value (${data.defaultValue}) is less than min (${data.min})`,
        path: ['defaultValue'],
      })
    }
    if (data.max !== undefined && data.defaultValue > data.max) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Default value (${data.defaultValue}) is greater than max (${data.max})`,
        path: ['defaultValue'],
      })
    }
    if (data.step !== undefined) {
      const offset = data.min !== undefined ? data.defaultValue - data.min : data.defaultValue
      if (offset % data.step !== 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Default value (${data.defaultValue}) must be aligned with step (${data.step})`,
          path: ['defaultValue'],
        })
      }
    }
    if (data.integer === true && !Number.isInteger(data.defaultValue)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Default value must be an integer',
        path: ['defaultValue'],
      })
    }
  }
})

const valueSchema = z.object({
  type: z.literal('number'),
  value: z.number(),
}).passthrough()

// Schema for validating value against config
const validationSchema = z.object({
  config: configSchema,
  value: valueSchema,
}).superRefine((data, ctx) => {
  const { config, value } = data

  // Validate value against constraints
  if (config.min !== undefined && value.value < config.min) {
    ctx.addIssue({
      code: z.ZodIssueCode.too_small,
      message: `Number must be greater than or equal to ${config.min}`,
      minimum: config.min,
      type: 'number',
      inclusive: true,
      path: ['value', 'value'],
    })
  }

  if (config.max !== undefined && value.value > config.max) {
    ctx.addIssue({
      code: z.ZodIssueCode.too_big,
      message: `Number must be less than or equal to ${config.max}`,
      maximum: config.max,
      type: 'number',
      inclusive: true,
      path: ['value', 'value'],
    })
  }

  if (config.step !== undefined) {
    const offset = config.min !== undefined ? value.value - config.min : value.value
    if (offset % config.step !== 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Value must be aligned with step ${config.step}`,
        path: ['value', 'value'],
      })
    }
  }

  if (config.integer === true && !Number.isInteger(value.value)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Value must be an integer',
      path: ['value', 'value'],
    })
  }
})

/**
 * Plugin implementation for number ports
 */
export const NumberPortPlugin: IPortPlugin<NumberPortConfig, NumberPortValue> = {
  typeIdentifier: 'number',
  configSchema,
  valueSchema,
  serializeValue: (value: NumberPortValue) => value.value,
  deserializeValue: (data: unknown) => {
    if (typeof data !== 'number' || !Number.isFinite(data)) {
      throw new TypeError('Expected finite number value for deserialization')
    }
    return {
      type: 'number',
      value: data,
    }
  },
}

/**
 * Helper function for number validation
 */
function validateNumberValue(value: number, config: NumberPortConfig): string[] {
  const result = validationSchema.safeParse({
    config,
    value: { type: 'number', value },
  })
  if (!result.success) {
    return result.error.errors
      .filter(err => err.path[0] === 'value') // Only return value-related errors
      .map(err => err.message)
  }
  return []
}

export { validateNumberValue }
