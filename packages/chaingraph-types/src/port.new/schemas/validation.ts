import { z } from 'zod'

/**
 * Create a min/max validation schema
 */
export function createMinMaxValidation(options: {
  minKey: string
  maxKey: string
  message: string
}) {
  return z.object({
    [options.minKey]: z.number().min(0).optional(),
    [options.maxKey]: z.number().min(0).optional(),
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
 * Apply length validation to a string schema
 */
export function applyLengthValidation(
  schema: z.ZodString,
  validation: { minLength?: number, maxLength?: number },
): z.ZodString {
  let result = schema
  if (typeof validation.minLength === 'number') {
    result = result.min(validation.minLength, `String must be at least ${validation.minLength} characters`)
  }
  if (typeof validation.maxLength === 'number') {
    result = result.max(validation.maxLength, `String must be at most ${validation.maxLength} characters`)
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
    result = result.min(validation.min, `Number must be greater than or equal to ${validation.min}`)
  }
  if (typeof validation.max === 'number') {
    result = result.max(validation.max, `Number must be less than or equal to ${validation.max}`)
  }
  if (validation.integer) {
    result = result.int('Number must be an integer')
  }
  return result
}
