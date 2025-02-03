import { z } from 'zod'
import { PortType } from '../config/constants'
import { basePortSchema } from './base'
import { createLengthValidation, createRangeValidation } from './validation'

/**
 * String port configuration schema
 */
export const stringPortSchema = basePortSchema.extend({
  type: z.literal(PortType.String),
  validation: createLengthValidation().optional(),
  defaultValue: z.string().optional(),
})

/**
 * Number port configuration schema
 */
export const numberPortSchema = basePortSchema.extend({
  type: z.literal(PortType.Number),
  validation: createRangeValidation().optional(),
  defaultValue: z.number().optional(),
})

/**
 * Boolean port configuration schema
 */
export const booleanPortSchema = basePortSchema.extend({
  type: z.literal(PortType.Boolean),
  defaultValue: z.boolean().optional(),
})

// Forward declaration for recursive schemas
// eslint-disable-next-line import/no-mutable-exports
let portConfigSchema: z.ZodType

/**
 * Array port configuration schema
 */
export const arrayPortSchema = basePortSchema.extend({
  type: z.literal(PortType.Array),
  elementConfig: z.lazy(() => portConfigSchema),
  defaultValue: z.array(z.unknown()).optional(),
})

/**
 * Object schema configuration
 */
export const objectSchemaConfig = z.object({
  properties: z.record(z.lazy(() => portConfigSchema)),
  required: z.array(z.string()).optional(),
})

/**
 * Object port configuration schema
 */
export const objectPortSchema = basePortSchema.extend({
  type: z.literal(PortType.Object),
  schema: objectSchemaConfig,
  defaultValue: z.record(z.unknown()).optional(),
})

/**
 * Enum port configuration schema
 */
export const enumPortSchema = basePortSchema.extend({
  type: z.literal(PortType.Enum),
  options: z.array(z.lazy(() => portConfigSchema)),
  defaultValue: z.string().optional(),
})

/**
 * Stream port configuration schema
 */
export const streamPortSchema = basePortSchema.extend({
  type: z.literal(PortType.Stream),
  valueType: z.lazy(() => portConfigSchema),
  mode: z.enum(['input', 'output']),
  bufferSize: z.number().int().min(0).optional(),
  defaultValue: z.any().optional(),
})

/**
 * Any port configuration schema
 */
export const anyPortSchema = basePortSchema.extend({
  type: z.literal(PortType.Any),
  internalType: z.lazy(() => portConfigSchema.optional()),
  defaultValue: z.unknown().optional(),
})

// Initialize the combined schema
portConfigSchema = z.discriminatedUnion('type', [
  stringPortSchema,
  numberPortSchema,
  booleanPortSchema,
  arrayPortSchema,
  objectPortSchema,
  enumPortSchema,
  streamPortSchema,
  anyPortSchema,
])

/**
 * Export the combined port configuration schema
 */
export { portConfigSchema }
