import type { PortConfig } from './types'
import { z } from 'zod'
import { PortDirection, PortType } from './constants'

/**
 * Base port configuration schema
 */
export const basePortSchema = z.object({
  id: z.string().optional(),
  title: z.string().optional(),
  description: z.string().optional(),
  direction: z.nativeEnum(PortDirection).optional(),
  optional: z.boolean().optional(),
  metadata: z.record(z.unknown()).optional(),
})

/**
 * String validation schema
 */
export const stringValidationSchema = z.object({
  minLength: z.number().int().min(0).optional(),
  maxLength: z.number().int().min(0).optional(),
}).refine(
  val => !val.minLength || !val.maxLength || val.maxLength >= val.minLength,
  'maxLength must be greater than or equal to minLength',
)

/**
 * Number validation schema
 */
export const numberValidationSchema = z.object({
  min: z.number().optional(),
  max: z.number().optional(),
  integer: z.boolean().optional(),
}).refine(
  val => !val.min || !val.max || val.max >= val.min,
  'max must be greater than or equal to min',
)

/**
 * String port schema
 */
export const stringPortSchema = basePortSchema.extend({
  type: z.literal(PortType.String),
  validation: stringValidationSchema.optional(),
  defaultValue: z.string().optional(),
})

/**
 * Number port schema
 */
export const numberPortSchema = basePortSchema.extend({
  type: z.literal(PortType.Number),
  validation: numberValidationSchema.optional(),
  defaultValue: z.number().optional(),
})

/**
 * Boolean port schema
 */
export const booleanPortSchema = basePortSchema.extend({
  type: z.literal(PortType.Boolean),
  defaultValue: z.boolean().optional(),
})

/**
 * Combined port configuration schema
 */
export const portConfigSchema = z.union([
  stringPortSchema,
  numberPortSchema,
  booleanPortSchema,
])

/**
 * Helper function to validate port configuration
 */
export function validatePortConfig(config: unknown): PortConfig {
  return portConfigSchema.parse(config)
}

/**
 * Helper function to validate port configuration of a specific type
 */
export function validatePortConfigType<T extends PortType>(
  config: unknown,
  type: T,
): Extract<PortConfig, { type: T }> {
  const validated = validatePortConfig(config)
  if (validated.type !== type) {
    throw new Error(`Expected port config of type "${type}" but got "${validated.type}"`)
  }
  return validated as Extract<PortConfig, { type: T }>
}
