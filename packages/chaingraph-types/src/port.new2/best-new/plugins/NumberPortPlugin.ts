import type {
  NumberPortConfig,
  NumberPortValue,
} from '../base/types'
import { z } from 'zod'
import {
  createPortPlugin,
  PortError,
  PortErrorType,
} from '../base/types'

/**
 * Type guard for number value
 */
export function isNumberValue(value: unknown): value is NumberPortValue {
  return (
    typeof value === 'object'
    && value !== null
    && 'type' in value
    && value.type === 'number'
    && 'value' in value
    && typeof (value as NumberPortValue).value === 'number'
  )
}

/**
 * Type guard for number config
 */
export function isNumberPortConfig(config: unknown): config is NumberPortConfig {
  return (
    typeof config === 'object'
    && config !== null
    && 'type' in config
    && config.type === 'number'
  )
}

/**
 * Helper to create a number port value
 */
export function createNumberValue(value: number): NumberPortValue {
  return {
    type: 'number',
    value,
  }
}

/**
 * Helper to create a number port config
 */
export function createNumberConfig(options: Partial<Omit<NumberPortConfig, 'type'>> = {}): NumberPortConfig {
  return {
    type: 'number',
    ...options,
  }
}

/**
 * Check if a number aligns with a step value
 */
function isAlignedWithStep(value: number, step: number, min = 0): boolean {
  const offset = value - min
  return Math.abs(offset % step) < Number.EPSILON
}

/**
 * Number port configuration schema
 */
const configSchema = z.object({
  type: z.literal('number'),
  id: z.string().optional(),
  name: z.string().optional(),
  metadata: z.record(z.unknown()).optional(),
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

  // Validate step is compatible with range
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
})

/**
 * Number port value schema
 */
const valueSchema = z.object({
  type: z.literal('number'),
  value: z.number(),
}).passthrough()

/**
 * Validate number value against config
 */
export function validateNumberValue(
  value: unknown,
  config: NumberPortConfig,
): string[] {
  const errors: string[] = []

  // Type validation
  if (!isNumberValue(value)) {
    errors.push('Invalid number value structure')
    return errors
  }

  const numValue = value.value

  // Range validation
  if (config.min !== undefined && numValue < config.min) {
    errors.push(`Value must be greater than or equal to ${config.min}`)
  }

  if (config.max !== undefined && numValue > config.max) {
    errors.push(`Value must be less than or equal to ${config.max}`)
  }

  // Step validation
  if (config.step !== undefined) {
    if (!isAlignedWithStep(numValue, config.step, config.min)) {
      errors.push(`Value must be aligned with step ${config.step}`)
    }
  }

  // Integer validation
  if (config.integer === true && !Number.isInteger(numValue)) {
    errors.push('Value must be an integer')
  }

  return errors
}

/**
 * Number port plugin implementation
 */
export const NumberPortPlugin = createPortPlugin(
  'number',
  configSchema,
  valueSchema,
  (value: NumberPortValue) => {
    try {
      if (!isNumberValue(value)) {
        throw new PortError(
          PortErrorType.SerializationError,
          'Invalid number value structure',
        )
      }
      return {
        type: 'number',
        value: value.value,
      }
    } catch (error) {
      throw new PortError(
        PortErrorType.SerializationError,
        error instanceof Error ? error.message : 'Unknown error during number serialization',
      )
    }
  },
  (data: unknown) => {
    try {
      if (!isNumberValue(data)) {
        throw new PortError(
          PortErrorType.SerializationError,
          'Invalid number value for deserialization',
        )
      }
      return {
        type: 'number',
        value: data.value,
      }
    } catch (error) {
      throw new PortError(
        PortErrorType.SerializationError,
        error instanceof Error ? error.message : 'Unknown error during number deserialization',
      )
    }
  },
)
