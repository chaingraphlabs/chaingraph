import type { ObjectPortValueFromSchema, ObjectSchema } from './object-schema'
import type { PortConfig, PortValueFromConfig } from './port-composite-types'
import { z } from 'zod'
import { ObjectSchemaSchema } from './object-schema'
import { PortDirectionSchema } from './port-direction'
import { PortKindEnum, PortKindSchema } from './port-kind-enum'
import {
  ArrayPortValidationSchema,
  BooleanPortValidationSchema,
  EnumPortValidationSchema,
  NumberPortValidationSchema,
  ObjectPortValidationSchema,
  PortValidationSchema,
  StringPortValidationSchema,
} from './port-validation'
import {
  NumberPortValueSchema,
  PortValueSchema,
} from './port-value'

/*
 * * * * * * * * * * *
 * Base Port Config
 * * * * * * * * * * *
 */
export const BasePortConfigSchema = z.object({
  kind: PortKindSchema,
  id: z.string().optional(),
  parentId: z.string().optional(),
  nodeId: z.string().optional(),
  key: z.string().optional(),
  title: z.string().optional(),
  description: z.string().optional(),
  direction: PortDirectionSchema.optional(),
  optional: z.boolean().optional(),
  defaultValue: z.any().optional(), // Will be specified in each specific config
  validation: PortValidationSchema.optional(), // Will be specified in each specific config
  metadata: z.record(z.string(), z.unknown()).optional(),
})

export type BasePortConfigSchemaType = z.infer<typeof BasePortConfigSchema>

export interface BasePortConfig<K extends PortKindEnum> extends BasePortConfigSchemaType {
  kind: K
}

/*
 * * * * * * * * * * *
 * String Port Config
 * * * * * * * * * * *
 */
export const StringPortConfigSchema = BasePortConfigSchema.extend({
  kind: z.literal(PortKindEnum.String),
  defaultValue: z.string().optional(),
  validation: StringPortValidationSchema,
})
export type StringPortConfig = z.infer<typeof StringPortConfigSchema>

/*
 * * * * * * * * * * *
 * Number Port Config
 * * * * * * * * * * *
 */
export const NumberPortConfigSchema = BasePortConfigSchema.extend({
  kind: z.literal(PortKindEnum.Number),
  defaultValue: NumberPortValueSchema.optional(),
  validation: NumberPortValidationSchema,
})
export type NumberPortConfig = z.infer<typeof NumberPortConfigSchema>

/*
 * * * * * * * * * * *
 * Boolean Port Config
 * * * * * * * * * * *
 */
export const BooleanPortConfigSchema = BasePortConfigSchema.extend({
  kind: z.literal(PortKindEnum.Boolean),
  defaultValue: z.boolean().optional(),
  validation: BooleanPortValidationSchema,
})
export type BooleanPortConfig = z.infer<typeof BooleanPortConfigSchema>

/*
 * * * * * * * * * * *
 * Array Port Config
 * * * * * * * * * * *
 */
export const ArrayPortConfigSchema = BasePortConfigSchema.extend({
  kind: z.literal(PortKindEnum.Array),
  elementConfig: BasePortConfigSchema,
  defaultValue: z.array(PortValueSchema).optional(),
  validation: ArrayPortValidationSchema,
})

export interface ArrayPortConfig<E extends PortConfig>
  extends BasePortConfig<PortKindEnum.Array>, z.infer<typeof ArrayPortConfigSchema> {
  elementConfig: E
  defaultValue?: Array<PortValueFromConfig<E>>
}

/*
 * * * * * * * * * * *
 * Object Port Config
 * * * * * * * * * * *
 */
export const ObjectPortConfigSchema = BasePortConfigSchema.extend({
  kind: z.literal(PortKindEnum.Object),
  schema: ObjectSchemaSchema,
  defaultValue: z.record(z.string(), PortValueSchema).optional(),
  validation: ObjectPortValidationSchema,
})
export interface ObjectPortConfig<S extends ObjectSchema>
  extends BasePortConfig<PortKindEnum.Object>, z.infer<typeof ObjectPortConfigSchema> {
  schema: S
  defaultValue?: ObjectPortValueFromSchema<S>
}

/*
 * * * * * * * * * * *
 * Any Port Config
 * * * * * * * * * * *
 */
export const AnyPortConfigSchema = BasePortConfigSchema.extend({
  kind: z.literal(PortKindEnum.Any),
  connectedPortConfig: BasePortConfigSchema.nullable().optional(),
  defaultValue: z.any(),
})

export interface AnyPortConfig
  extends BasePortConfig<PortKindEnum.Any>, z.infer<typeof AnyPortConfigSchema> {
  connectedPortConfig?: PortConfig | null
  defaultValue?: any
}

/*
 * * * * * * * * * * *
 * Enum Port Config
 * * * * * * * * * * *
 */
export const EnumPortConfigSchema = BasePortConfigSchema.extend({
  kind: z.literal(PortKindEnum.Enum),
  options: z.array(BasePortConfigSchema),
  defaultValue: z.string().nullable().optional(),
  validation: EnumPortValidationSchema,
})

export interface EnumPortConfig<E extends PortConfig>
  extends BasePortConfig<PortKindEnum.Enum>, z.infer<typeof EnumPortConfigSchema> {
  options: E[] // Array of options, each is a PortConfig of specific type
  defaultValue?: string | null // Selected option's id
}

/*
 * * * * * * * * * * *
 * Stream Output Port Config
 * * * * * * * * * * *
 */
export const StreamOutputPortConfigSchema = BasePortConfigSchema.extend({
  kind: z.literal(PortKindEnum.StreamOutput),
  valueType: BasePortConfigSchema,
})

export interface StreamOutputPortConfig<T>
  extends BasePortConfig<PortKindEnum.StreamOutput>, z.infer<typeof StreamOutputPortConfigSchema> {
  valueType: PortConfig
}

/*
 * * * * * * * * * * *
 * Enum Port Config
 * * * * * * * * * * *
 */
export const StreamInputPortConfigSchema = BasePortConfigSchema.extend({
  kind: z.literal(PortKindEnum.StreamInput),
  valueType: BasePortConfigSchema,
})
export interface StreamInputPortConfig<T>
  extends BasePortConfig<PortKindEnum.StreamInput>, z.infer<typeof StreamInputPortConfigSchema> {
  valueType: PortConfig
}

// Union type of all PortConfigs
export const PortConfigDiscriminator = z.lazy(() => z.discriminatedUnion('kind', [
  StringPortConfigSchema,
  NumberPortConfigSchema,
  BooleanPortConfigSchema,
  ArrayPortConfigSchema,
  ObjectPortConfigSchema,
  AnyPortConfigSchema,
  EnumPortConfigSchema,
  StreamOutputPortConfigSchema,
  StreamInputPortConfigSchema,
]))

export type PortConfigDiscriminatorType = z.infer<typeof PortConfigDiscriminator>
