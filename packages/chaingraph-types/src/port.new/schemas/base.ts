import { z } from 'zod'
import { PortDirection } from '../config/constants'

/**
 * Base metadata schema
 */
export const baseMetadataSchema = z.record(z.unknown())

/**
 * Base port properties schema
 * Common properties shared by all port types
 */
export const basePortPropsSchema = z.object({
  id: z.string().optional(),
  title: z.string().optional(),
  description: z.string().optional(),
  direction: z.nativeEnum(PortDirection).optional(),
  optional: z.boolean().optional(),
  metadata: baseMetadataSchema.optional(),
})

/**
 * Create a min/max validation schema
 */
export function createMinMaxValidation(options: {
  minKey: string
  maxKey: string
  message: string
}) {
  return z.object({
    [options.minKey]: z.number().optional(),
    [options.maxKey]: z.number().optional(),
  }).refine((val) => {
    const min = val[options.minKey]
    const max = val[options.maxKey]
    if (min !== undefined && max !== undefined) {
      return max >= min
    }
    return true
  }, options.message)
}

/**
 * Create a length validation schema
 */
export function createLengthValidation() {
  return createMinMaxValidation({
    minKey: 'minLength',
    maxKey: 'maxLength',
    message: 'maxLength must be greater than or equal to minLength',
  })
}

/**
 * Create a numeric range validation schema
 */
export function createRangeValidation() {
  return z.object({
    min: z.number().optional(),
    max: z.number().optional(),
    integer: z.boolean().optional(),
  }).refine((val) => {
    if (val.min !== undefined && val.max !== undefined) {
      return val.max >= val.min
    }
    return true
  }, 'max must be greater than or equal to min')
}

/**
 * Type guard to check if a value has validation properties
 */
export function hasValidation(value: unknown): value is { validation: unknown } {
  return typeof value === 'object'
    && value !== null
    && 'validation' in value
    && value.validation !== undefined
}

/**
 * Type guard to check if a value has length validation
 */
export function hasLengthValidation(value: unknown): value is {
  validation: { minLength?: number, maxLength?: number }
} {
  return hasValidation(value)
    && typeof value.validation === 'object'
    && value.validation !== null
    && ('minLength' in value.validation || 'maxLength' in value.validation)
}

/**
 * Type guard to check if a value has range validation
 */
export function hasRangeValidation(value: unknown): value is {
  validation: { min?: number, max?: number, integer?: boolean }
} {
  return hasValidation(value)
    && typeof value.validation === 'object'
    && value.validation !== null
    && ('min' in value.validation || 'max' in value.validation || 'integer' in value.validation)
}

/**
 * Apply length validation to a string schema
 */
export function applyLengthValidation(
  schema: z.ZodString,
  validation: { minLength?: number, maxLength?: number },
): z.ZodString {
  let result = schema
  if (typeof validation.minLength === 'number') {
    result = result.min(validation.minLength)
  }
  if (typeof validation.maxLength === 'number') {
    result = result.max(validation.maxLength)
  }
  return result
}

/**
 * Apply range validation to a number schema
 */
export function applyRangeValidation(
  schema: z.ZodNumber,
  validation: { min?: number, max?: number, integer?: boolean },
): z.ZodNumber {
  let result = schema
  if (typeof validation.min === 'number') {
    result = result.min(validation.min)
  }
  if (typeof validation.max === 'number') {
    result = result.max(validation.max)
  }
  if (validation.integer) {
    result = result.int()
  }
  return result
}
