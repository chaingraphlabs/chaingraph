import type { ObjectSchema } from '@chaingraph/types'
import type { PortConfig } from '../config/types'
import { z } from 'zod'
import { PortDirection, PortType } from '../config/constants'

// Base schema for all port types
const basePortSchema = z.object({
  id: z.string().optional(),
  parentId: z.string().optional(),
  nodeId: z.string().optional(),
  key: z.string().optional(),
  title: z.string().optional(),
  description: z.string().optional(),
  direction: z.nativeEnum(PortDirection).optional(),
  optional: z.boolean().optional(),
  metadata: z.record(z.unknown()).optional(),
})

// Forward declaration for recursive schemas
let portSchema: z.ZodType

// String port schema
export const stringPortSchema = basePortSchema.extend({
  type: z.literal(PortType.String),
  defaultValue: z.string().optional(),
  validation: z.object({
    minLength: z.number().int().min(0).optional(),
    maxLength: z.number().int().min(0).optional(),
  }).refine((val) => {
    if (val.minLength && val.maxLength) {
      return val.maxLength >= val.minLength
    }
    return true
  }, 'maxLength must be greater than or equal to minLength').optional(),
})

// Number port schema
export const numberPortSchema = basePortSchema.extend({
  type: z.literal(PortType.Number),
  defaultValue: z.number().optional(),
  validation: z.object({
    min: z.number().optional(),
    max: z.number().optional(),
    integer: z.boolean().optional(),
  }).refine((val) => {
    if (val.min !== undefined && val.max !== undefined) {
      return val.max >= val.min
    }
    return true
  }, 'max must be greater than or equal to min').optional(),
})

// Boolean port schema
export const booleanPortSchema = basePortSchema.extend({
  type: z.literal(PortType.Boolean),
  defaultValue: z.boolean().optional(),
})

// Object schema
export const objectSchemaSchema: z.ZodType<ObjectSchema> = z.lazy(() =>
  z.object({
    id: z.string().optional(),
    type: z.string().optional(),
    description: z.string().optional(),
    properties: z.record(z.lazy(() => portSchema)),
  }),
)

// Array port schema
export const arrayPortSchema = basePortSchema.extend({
  type: z.literal(PortType.Array),
  elementConfig: z.lazy(() => portSchema),
  defaultValue: z.array(z.unknown()).optional(),
})

// Object port schema
export const objectPortSchema = basePortSchema.extend({
  type: z.literal(PortType.Object),
  schema: objectSchemaSchema,
  defaultValue: z.record(z.unknown()).optional(),
})

// Enum port schema
export const enumPortSchema = basePortSchema.extend({
  type: z.literal(PortType.Enum),
  options: z.lazy(() => z.array(portSchema)),
  defaultValue: z.string().nullable().optional(),
})

// Stream port schema
export const streamPortSchema = basePortSchema.extend({
  type: z.literal(PortType.Stream),
  valueType: z.lazy(() => portSchema),
  mode: z.enum(['input', 'output']),
  bufferSize: z.number().int().min(0).optional(),
  defaultValue: z.any().optional(), // Will be MultiChannel<T>
})

// Any port schema
export const anyPortSchema = basePortSchema.extend({
  type: z.literal(PortType.Any),
  connectedPortConfig: z.lazy(() => portSchema.nullable()).optional(),
  defaultValue: z.unknown().optional(),
})

// Initialize the combined schema
portSchema = z.union([
  stringPortSchema,
  numberPortSchema,
  booleanPortSchema,
  arrayPortSchema,
  objectPortSchema,
  enumPortSchema,
  streamPortSchema,
  anyPortSchema,
])

export const portConfigSchema = portSchema as z.ZodType<PortConfig>

/**
 * Helper function to validate a port configuration
 */
export function validatePortConfig(config: unknown): PortConfig {
  return portConfigSchema.parse(config)
}

/**
 * Helper function to validate a port configuration of a specific type
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

/**
 * Type guard to check if a value is a valid port configuration
 */
export function isPortConfig(value: unknown): value is PortConfig {
  try {
    validatePortConfig(value)
    return true
  } catch {
    return false
  }
}

/**
 * Type guard to check if a port configuration is of a specific type
 */
export function isPortType<T extends PortType>(
  config: PortConfig,
  type: T,
): config is Extract<PortConfig, { type: T }> {
  return config.type === type
}
