import { z } from 'zod'
import { PortType } from '../config/constants'
import { basePortPropsSchema, createLengthValidation, createRangeValidation } from './base'
import { booleanValueSchema, numberValueSchema, stringValueSchema } from './value'

/**
 * String port configuration schema
 */
export const stringConfigSchema = basePortPropsSchema.extend({
  type: z.literal(PortType.String),
  validation: createLengthValidation().optional(),
  defaultValue: stringValueSchema.optional(),
})

/**
 * Number port configuration schema
 */
export const numberConfigSchema = basePortPropsSchema.extend({
  type: z.literal(PortType.Number),
  validation: createRangeValidation().optional(),
  defaultValue: numberValueSchema.optional(),
})

/**
 * Boolean port configuration schema
 */
export const booleanConfigSchema = basePortPropsSchema.extend({
  type: z.literal(PortType.Boolean),
  defaultValue: booleanValueSchema.optional(),
})

// Forward declaration for recursive schemas
let portConfigSchema: z.ZodType

/**
 * Array port configuration schema
 */
export const arrayConfigSchema = basePortPropsSchema.extend({
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
export const objectConfigSchema = basePortPropsSchema.extend({
  type: z.literal(PortType.Object),
  schema: objectSchemaConfig,
  defaultValue: z.record(z.unknown()).optional(),
})

/**
 * Enum port configuration schema
 */
export const enumConfigSchema = basePortPropsSchema.extend({
  type: z.literal(PortType.Enum),
  options: z.array(z.string()),
  defaultValue: z.string().optional(),
})

/**
 * Stream port configuration schema
 */
export const streamConfigSchema = basePortPropsSchema.extend({
  type: z.literal(PortType.Stream),
  valueType: z.lazy(() => portConfigSchema),
  mode: z.enum(['input', 'output']),
  bufferSize: z.number().int().min(0).optional(),
  defaultValue: z.any().optional(),
})

/**
 * Any port configuration schema
 */
export const anyConfigSchema = basePortPropsSchema.extend({
  type: z.literal(PortType.Any),
  defaultValue: z.unknown().optional(),
})

// Initialize the combined schema
portConfigSchema = z.discriminatedUnion('type', [
  stringConfigSchema,
  numberConfigSchema,
  booleanConfigSchema,
  arrayConfigSchema,
  objectConfigSchema,
  enumConfigSchema,
  streamConfigSchema,
  anyConfigSchema,
])

/**
 * Export the combined port configuration schema
 */
export { portConfigSchema }

/**
 * Helper function to validate a port configuration
 */
export function validatePortConfig(config: unknown): z.infer<typeof portConfigSchema> {
  return portConfigSchema.parse(config)
}

/**
 * Helper function to validate a port configuration of a specific type
 */
export function validatePortConfigType<T extends PortType>(
  config: unknown,
  type: T,
): z.infer<typeof portConfigSchema> & { type: T } {
  const validated = validatePortConfig(config)
  if (validated.type !== type) {
    throw new Error(`Expected port config of type "${type}" but got "${validated.type}"`)
  }
  return validated as z.infer<typeof portConfigSchema> & { type: T }
}

/**
 * Type guard to check if a value is a valid port configuration
 */
export function isPortConfig(value: unknown): value is z.infer<typeof portConfigSchema> {
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
  config: z.infer<typeof portConfigSchema>,
  type: T,
): config is z.infer<typeof portConfigSchema> & { type: T } {
  return config.type === type
}
