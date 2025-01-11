import type {
  AnyPort,
  ArrayPort,
  BooleanPort,
  NumberPort,
  NumberPortValue,
  ObjectPort,
  ObjectPortValueFromSchema,
  ObjectSchema,
  StringPort,
} from '@chaingraph/types/port'
import type { MultiChannel } from '@chaingraph/types/port/channel/multi-channel'
import type { EnumPort } from '@chaingraph/types/port/enum/enum-port'
import type { StreamInputPort } from '@chaingraph/types/port/stream/stream-input-port'
import type { StreamOutputPort } from '@chaingraph/types/port/stream/stream-output-port'
import { zodDecimal } from '@chaingraph/types/decimal/zodDecimal'
import { ObjectSchemaSchema,
} from '@chaingraph/types/port'
import { z } from 'zod'

/*
 * * * * * * * * * * *
 * Port Kind
 * * * * * * * * * * *
 */
export enum PortKindEnum {
  String = 'string',
  Number = 'number',
  Boolean = 'boolean',
  Array = 'array',
  Object = 'object',
  Any = 'any',
  Enum = 'enum',
  StreamOutput = 'stream-output',
  StreamInput = 'stream-input',
}

export const PortKindSchema = z.nativeEnum(PortKindEnum)

export type PortKind =
  | PortKindEnum.String
  | PortKindEnum.Number
  | PortKindEnum.Boolean
  | PortKindEnum.Array
  | PortKindEnum.Object
  | PortKindEnum.Any
  | PortKindEnum.Enum
  | PortKindEnum.StreamOutput
  | PortKindEnum.StreamInput

/*
 * * * * * * * * * * *
 * Port Direction
 * * * * * * * * * * *
 */
export enum PortDirectionEnum {
  Input = 'input',
  Output = 'output',
}

export const PortDirectionSchema = z.nativeEnum(PortDirectionEnum)
export type PortDirection = PortDirectionEnum.Input | PortDirectionEnum.Output

/*
 * * * * * * * * * * *
 * Port Validation
 * * * * * * * * * * *
 */
export const StringPortValidationSchema = z.object({}).optional()
export const NumberPortValidationSchema = z.object({}).optional()
export const BooleanPortValidationSchema = z.object({}).optional()
export const ArrayPortValidationSchema = z.object({}).optional()
export const ObjectPortValidationSchema = z.object({}).optional()
export const EnumPortValidationSchema = z.object({}).optional()
export const StreamOutputPortValidationSchema = z.object({}).optional()
export const StreamInputPortValidationSchema = z.object({}).optional()
export const PortValidationSchema = z.union([
  StringPortValidationSchema,
  NumberPortValidationSchema,
  BooleanPortValidationSchema,
  ArrayPortValidationSchema,
  ObjectPortValidationSchema,
  EnumPortValidationSchema,
  StreamOutputPortValidationSchema,
  StreamInputPortValidationSchema,
])

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

export interface BasePortConfig<K extends PortKind> extends BasePortConfigSchemaType {
  kind: K
}

/*
 * * * * * * * * * * *
 * Port Value
 * * * * * * * * * * *
 */
export const NumberPortValueSchema = z.union([
  zodDecimal(),
  z.number(),
  z.string(),
])

export const PortValueSchema = z.union([
  z.string(),
  NumberPortValueSchema,
  z.boolean(),
  z.array(z.any()),
  z.record(z.string(), z.any()),
  z.unknown(),
  z.null(),
])

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
})

export interface AnyPortConfig
  extends BasePortConfig<PortKindEnum.Any>, z.infer<typeof AnyPortConfigSchema> {
  connectedPortConfig?: PortConfig | null
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

/*
 * * * * * * * * * * *
 * Port Config
 * * * * * * * * * * *
 */
export type PortConfig =
  | StringPortConfig
  | NumberPortConfig
  | BooleanPortConfig
  | ArrayPortConfig<any>
  | ObjectPortConfig<any>
  | AnyPortConfig
  | EnumPortConfig<any>
  | StreamOutputPortConfig<any>
  | StreamInputPortConfig<any>

export type PortFromConfig<C extends PortConfig> =
  C extends StringPortConfig ? StringPort :
    C extends NumberPortConfig ? NumberPort :
      C extends BooleanPortConfig ? BooleanPort :
        C extends ArrayPortConfig<infer E> ? ArrayPort<E> :
          C extends ObjectPortConfig<infer S> ? ObjectPort<S> :
            C extends AnyPortConfig ? AnyPort :
              C extends EnumPortConfig<infer E> ? EnumPort<E> :
                C extends StreamOutputPortConfig<infer T> ? StreamOutputPort<T> :
                  C extends StreamInputPortConfig<infer T> ? StreamInputPort<T> :
                    never

export type PortValueFromConfig<C extends PortConfig> =
  C extends StringPortConfig ? string :
    C extends NumberPortConfig ? NumberPortValue :
      C extends BooleanPortConfig ? boolean :
        C extends ArrayPortConfig<infer E> ? Array<PortValueFromConfig<E>> :
          C extends ObjectPortConfig<infer S> ? ObjectPortValueFromSchema<S> :
            C extends AnyPortConfig ? any :
              C extends EnumPortConfig<any> ? string | null :
                C extends StreamOutputPortConfig<infer T> ? MultiChannel<T> :
                  C extends StreamInputPortConfig<infer T> ? MultiChannel<T> | null :
                    never

export type PortValueByKind<K extends PortKind> = PortValueFromConfig<PortConfigByKind<K>>

export type PortConfigByKind<K extends PortKind> =
  K extends PortKindEnum.String ? StringPortConfig :
    K extends PortKindEnum.Number ? NumberPortConfig :
      K extends PortKindEnum.Boolean ? BooleanPortConfig :
        K extends PortKindEnum.Array ? ArrayPortConfig<any> :
          K extends PortKindEnum.Object ? ObjectPortConfig<any> :
            K extends PortKindEnum.Any ? AnyPortConfig :
              K extends PortKindEnum.Enum ? EnumPortConfig<any> :
                K extends PortKindEnum.StreamOutput ? StreamOutputPortConfig<any> :
                  K extends PortKindEnum.StreamInput ? StreamInputPortConfig<any> :
                    never
