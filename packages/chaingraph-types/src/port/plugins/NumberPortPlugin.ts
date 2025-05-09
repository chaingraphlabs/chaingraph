/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { JSONValue } from '../../utils/json'
import type { IPortPlugin, NumberPortConfig, NumberPortValue } from '../base'
import Decimal from 'decimal.js'
import { z } from 'zod'
import {
  basePortConfigSchema,
  isNumberPortValue,
  numberPortConfigUISchema,
  PortError,
  PortErrorType,
} from '../base'

/**
 * Schemas for number port validation
 */

// Value schema for number ports
const valueSchema: z.ZodType<NumberPortValue> = z.number()

// Number-specific schema
const numberSpecificSchema = z.object({
  type: z.literal('number'),
  defaultValue: valueSchema.optional(),
  min: z.number().optional(),
  max: z.number().optional(),
  step: z.number().positive().optional(),
  integer: z.boolean().optional(),
  ui: numberPortConfigUISchema.optional(),
}).passthrough()

// Merge base schema with number-specific schema to create the final config schema
const configSchema: z.ZodType<NumberPortConfig> = basePortConfigSchema
  .merge(numberSpecificSchema)
  .superRefine((data, ctx) => {
    // Validate min/max relationship
    if (data.min !== undefined && data.max !== undefined) {
      const minDec = new Decimal(data.min)
      const maxDec = new Decimal(data.max)
      if (minDec.gt(maxDec)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `min (${data.min}) must be less than or equal to max (${data.max})`,
          path: ['min'],
        })
      }
    }

    // Validate step alignment with range
    if (data.step !== undefined && data.min !== undefined && data.max !== undefined) {
      const minDec = new Decimal(data.min)
      const maxDec = new Decimal(data.max)
      const stepDec = new Decimal(data.step)
      const range = maxDec.sub(minDec)
      if (!range.mod(stepDec).equals(0)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `step (${data.step}) must divide range (${range.toNumber()}) evenly`,
          path: ['step'],
        })
      }
    }
  })

/**
 * Helper to create a number port value
 */
export function createNumberValue(value: number): NumberPortValue {
  return value
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
 * Check if a Decimal value is aligned with a given step.
 * @param value - The value to check.
 * @param step - The step size.
 * @param min - The minimum value (default 0).
 */
function isAlignedWithStep(
  value: Decimal,
  step: Decimal,
  min: Decimal = new Decimal(0),
): boolean {
  const offset = value.sub(min)
  // The remainder of offset divided by step must equal zero.
  return offset.mod(step).equals(0)
}

/**
 * Validates a number port value against its configuration using Decimal.js.
 */
export function validateNumberValue(
  value: unknown,
  config: NumberPortConfig,
): string[] {
  const errors: string[] = []

  if (value === undefined || value === null) {
    // If the value is undefined or null, we can skip validation
    return errors
  }

  if (!isNumberPortValue(value)) {
    errors.push(`Invalid number value structure, actual value: ${JSON.stringify(value)}`)
    return errors
  }

  let decimalValue: Decimal
  try {
    decimalValue = new Decimal(value)
  } catch (err) {
    errors.push('Failed to convert value to Decimal')
    return errors
  }

  if (config.min !== undefined) {
    const minDec = new Decimal(config.min)
    if (decimalValue.lt(minDec)) {
      errors.push(`Value must be greater than or equal to ${config.min}`)
    }
  }

  if (config.max !== undefined) {
    const maxDec = new Decimal(config.max)
    if (decimalValue.gt(maxDec)) {
      errors.push(`Value must be less than or equal to ${config.max}`)
    }
  }

  if (config.step !== undefined) {
    const stepDec = new Decimal(config.step)
    const minDec = config.min !== undefined ? new Decimal(config.min) : new Decimal(0)
    if (!isAlignedWithStep(decimalValue, stepDec, minDec)) {
      errors.push(`Value must be aligned with step ${config.step}`)
    }
  }

  if (decimalValue && config.integer === true && !decimalValue.isInteger()) {
    errors.push('Value must be an integer')
  }

  return errors
}

/**
 * Number port plugin implementation
 */
export const NumberPortPlugin: IPortPlugin<'number'> = {
  typeIdentifier: 'number',
  configSchema,
  valueSchema,
  serializeValue: (value: NumberPortValue): JSONValue => {
    if (value === undefined || value === null) {
      return 0
    }

    try {
      if (!isNumberPortValue(value)) {
        throw new PortError(
          PortErrorType.SerializationError,
          `Invalid number value structure, actual value: ${JSON.stringify(value)}`,
        )
      }
      return value
    } catch (error) {
      throw new PortError(
        PortErrorType.SerializationError,
        error instanceof Error ? error.message : 'Unknown error during number serialization',
      )
    }
  },
  deserializeValue: (data: JSONValue) => {
    if (data === undefined || data === null) {
      return 0
    }

    try {
      if (!isNumberPortValue(data)) {
        throw new PortError(
          PortErrorType.SerializationError,
          `Invalid number value for deserialization, actual value: ${JSON.stringify(data)}`,
        )
      }
      return data || 0
    } catch (error) {
      throw new PortError(
        PortErrorType.SerializationError,
        error instanceof Error ? error.message : 'Unknown error during number deserialization',
      )
    }
  },
  serializeConfig: (config: NumberPortConfig): JSONValue => {
    try {
      // For number port, we can simply return the config as is
      // since it doesn't contain any non-serializable parts
      return { ...config }
    } catch (error) {
      throw new PortError(
        PortErrorType.SerializationError,
        error instanceof Error ? error.message : 'Unknown error during number config serialization',
      )
    }
  },
  deserializeConfig: (data: JSONValue) => {
    try {
      const result = configSchema.safeParse(data)
      if (!result.success) {
        throw new PortError(
          PortErrorType.SerializationError,
          'Invalid number configuration for deserialization',
          result.error,
        )
      }
      return result.data
    } catch (error) {
      throw new PortError(
        PortErrorType.SerializationError,
        error instanceof Error ? error.message : 'Unknown error during number config deserialization',
      )
    }
  },
  validateValue: (value: NumberPortValue, config: NumberPortConfig): string[] => {
    return validateNumberValue(value, config)
  },
  validateConfig: (config: NumberPortConfig): string[] => {
    // Use the Zod config schema to validate the configuration first.
    const result = configSchema.safeParse(config)
    if (!result.success) {
      // Map over Zod's error issues and return the error messages.
      return result.error.errors.map(issue => issue.message)
    }

    return []
  },
}
