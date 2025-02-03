import { z } from 'zod'
import { PortDirection } from '../config/constants'

/**
 * Base metadata schema
 */
export const baseMetadataSchema = z.record(z.unknown())

/**
 * Base port schema
 * Common properties shared by all port types
 */
export const basePortSchema = z.object({
  id: z.string().optional(),
  parentId: z.string().optional(),
  nodeId: z.string().optional(),
  key: z.string().optional(),
  title: z.string().optional(),
  description: z.string().optional(),
  direction: z.nativeEnum(PortDirection).optional(),
  optional: z.boolean().optional(),
  metadata: baseMetadataSchema.optional(),
})

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

// Export types for the base port schema
export type BasePortSchema = z.infer<typeof basePortSchema>
