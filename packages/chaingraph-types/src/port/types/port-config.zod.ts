import { z } from 'zod'
import { PortDirectionEnum } from './port-direction'
import { PortKindEnum } from './port-kind-enum'
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

export const PortKindSchema = z.nativeEnum(PortKindEnum)

export const PortDirectionSchema = z.nativeEnum(PortDirectionEnum)

// export const BasePortConfigSchema = z.object({
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

/*
 * * * * * * * * * * *
 * Object Port Config
 * * * * * * * * * * *
 */

export const ObjectSchemaSchema = z.object({
  id: z.string().optional(),
  type: z.string().optional(),
  description: z.string().optional(),
  properties: z.record(z.string(), BasePortConfigSchema),
})

export const ObjectPortConfigSchema = BasePortConfigSchema.extend({
  kind: z.literal(PortKindEnum.Object),
  schema: ObjectSchemaSchema,
  defaultValue: z.record(z.string(), PortValueSchema).optional(),
  validation: ObjectPortValidationSchema,
})

/*
 * * * * * * * * * * *
 * Any Port Config
 * * * * * * * * * * *
 */
export const AnyPortConfigSchema = BasePortConfigSchema.extend({
  kind: z.literal(PortKindEnum.Any),
  connectedPortConfig: BasePortConfigSchema.optional(),
  defaultValue: z.any(),
})

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

/*
 * * * * * * * * * * *
 * Stream Output Port Config
 * * * * * * * * * * *
 */
export const StreamOutputPortConfigSchema = BasePortConfigSchema.extend({
  kind: z.literal(PortKindEnum.StreamOutput),
  valueType: BasePortConfigSchema.optional(),
})

/*
 * * * * * * * * * * *
 * Enum Port Config
 * * * * * * * * * * *
 */
export const StreamInputPortConfigSchema = BasePortConfigSchema.extend({
  kind: z.literal(PortKindEnum.StreamInput),
  valueType: BasePortConfigSchema.optional(),
})

/*
 * * * * * * * * * * *
 * Port Config Discriminated Union
 * * * * * * * * * * *
 */
// export const PortConfigSchema = z.discriminatedUnion('kind', [
//   StringPortConfigSchema,
//   NumberPortConfigSchema,
//   BooleanPortConfigSchema,
//   ArrayPortConfigSchema,
//   ObjectPortConfigSchema,
//   AnyPortConfigSchema,
//   EnumPortConfigSchema,
//   StreamOutputPortConfigSchema,
//   StreamInputPortConfigSchema,
// ])
