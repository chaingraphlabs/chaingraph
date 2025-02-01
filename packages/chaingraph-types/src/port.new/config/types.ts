import { z } from 'zod'
import { PortDirection, PortType } from './constants'

/**
 * Base port configuration
 */
export const basePortConfigSchema = z.object({
  id: z.string().optional(),
  title: z.string().optional(),
  key: z.string().optional(),
  description: z.string().optional(),
  direction: z.nativeEnum(PortDirection).optional(),
  optional: z.boolean().optional(),
  metadata: z.record(z.unknown()).optional(),
})

export type BasePortConfig = z.infer<typeof basePortConfigSchema>

/**
 * String port validation
 */
export const stringValidationSchema = z.object({
  minLength: z.number().int().min(0).optional(),
  maxLength: z.number().int().min(0).optional(),
}).refine(
  val => !val.minLength || !val.maxLength || val.maxLength >= val.minLength,
  'maxLength must be greater than or equal to minLength',
)

/**
 * Number port validation
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
 * Port configuration schemas
 */
export const portConfigSchema: z.ZodType<PortConfig> = z.lazy(() =>
  z.discriminatedUnion('type', [
    // String port
    basePortConfigSchema.extend({
      type: z.literal(PortType.String),
      validation: stringValidationSchema.optional(),
      defaultValue: z.string().optional(),
    }),

    // Number port
    basePortConfigSchema.extend({
      type: z.literal(PortType.Number),
      validation: numberValidationSchema.optional(),
      defaultValue: z.number().optional(),
    }),

    // Boolean port
    basePortConfigSchema.extend({
      type: z.literal(PortType.Boolean),
      defaultValue: z.boolean().optional(),
    }),

    // Array port
    basePortConfigSchema.extend({
      type: z.literal(PortType.Array),
      elementConfig: z.lazy(() => portConfigSchema),
      defaultValue: z.array(z.unknown()).optional(),
    }),

    // Object port
    basePortConfigSchema.extend({
      type: z.literal(PortType.Object),
      schema: z.object({
        properties: z.record(z.lazy(() => portConfigSchema)),
      }),
      defaultValue: z.record(z.unknown()).optional(),
    }),

    // Stream port
    basePortConfigSchema.extend({
      type: z.literal(PortType.Stream),
      valueType: z.lazy(() => portConfigSchema),
      mode: z.enum(['input', 'output']),
      bufferSize: z.number().int().min(0).optional(),
      defaultValue: z.any().optional(),
    }),

    // Enum port
    basePortConfigSchema.extend({
      type: z.literal(PortType.Enum),
      options: z.array(z.lazy(() => portConfigSchema)),
      defaultValue: z.string().optional(),
    }),

    // Any port
    basePortConfigSchema.extend({
      type: z.literal(PortType.Any),
      internalType: z.lazy(() => portConfigSchema).optional(),
      defaultValue: z.unknown().optional(),
    }),
  ]),
)

/**
 * Port configuration type
 */
export type PortConfig = {
  type: PortType
  id?: string
  title?: string
  key?: string
  parentId?: string
  nodeId?: string
  description?: string
  direction?: PortDirection
  optional?: boolean
  metadata?: Record<string, unknown>
  defaultValue?: unknown
} & (
  | {
    type: PortType.String
    validation?: z.infer<typeof stringValidationSchema>
    defaultValue?: string
  }
  | {
    type: PortType.Number
    validation?: z.infer<typeof numberValidationSchema>
    defaultValue?: number
  }
  | {
    type: PortType.Boolean
    defaultValue?: boolean
  }
  | {
    type: PortType.Array
    elementConfig: PortConfig
    defaultValue?: unknown[]
  }
  | {
    type: PortType.Object
    schema: ObjectSchema
    defaultValue?: Record<string, unknown>
  }
  | {
    type: PortType.Stream
    valueType: PortConfig
    mode: 'input' | 'output'
    bufferSize?: number
  }
  | {
    type: PortType.Enum
    options: PortConfig[]
    defaultValue?: string
  }
  | {
    type: PortType.Any
    defaultValue?: unknown
    internalType?: PortConfig
  }
)

export interface ObjectSchema {
  properties: Record<string, PortConfig>

  // Metadata
  id?: string
  type?: string
  description?: string
  category?: string
  isObjectSchema?: boolean
}

/**
 * Helper type for extracting config type from port type
 */
export type ConfigFromPortType<T extends PortType> = Extract<PortConfig, { type: T }>

export type StringPortConfig = ConfigFromPortType<PortType.String>
export type NumberPortConfig = ConfigFromPortType<PortType.Number>
export type BooleanPortConfig = ConfigFromPortType<PortType.Boolean>
export type ArrayPortConfig = ConfigFromPortType<PortType.Array>
export type ObjectPortConfig = ConfigFromPortType<PortType.Object>
export type StreamPortConfig = ConfigFromPortType<PortType.Stream>
export type EnumPortConfig = ConfigFromPortType<PortType.Enum>
export type AnyPortConfig = ConfigFromPortType<PortType.Any>

/**
 * Validation result type
 */
export interface ValidationResult {
  valid: boolean
  errors?: string[]
}
