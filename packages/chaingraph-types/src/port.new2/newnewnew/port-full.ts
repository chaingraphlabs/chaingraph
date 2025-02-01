import type { z } from 'zod'
import type { FullPort } from './port'
import type {
  IArrayPortConfig,
  IBooleanPortConfig,
  IEnumPortConfig,
  INumberPortConfig,
  IObjectPortConfig,
  IPortConfigUnion,
  IStreamPortConfig,
  IStringPortConfig,
} from './port-configs'
import type { PortTypeEnum } from './port-types.enum'
import type {
  IBooleanPortValue,
  IEnumPortValue,
  IGenericArrayPortValue,
  IGenericObjectPortValue,
  INumberPortValue,
  IStreamPortValue,
  IStringPortValue,
} from './port-value-types'
import type { FullPortSchema } from './zod-full-port'

/**
 * Specialized ports with strict type constraints:
 */
export type StringPort = FullPort<PortTypeEnum.String, IStringPortConfig, IStringPortValue>
export type NumberPort = FullPort<PortTypeEnum.Number, INumberPortConfig, INumberPortValue>
export type BooleanPort = FullPort<PortTypeEnum.Boolean, IBooleanPortConfig, IBooleanPortValue>
export type EnumPort = FullPort<PortTypeEnum.Enum, IEnumPortConfig, IEnumPortValue>

/**
 * Generic Array Port.
 * T is the item configuration describing each element of the array.
 */
export type ArrayPort<T extends IPortConfigUnion> = FullPort<
  PortTypeEnum.Array,
  IArrayPortConfig<T>,
  IGenericArrayPortValue<T>
>

/**
 * Generic Object Port.
 * Schema is a record mapping keys to port configuration.
 */
export type ObjectPort<Schema extends { [key: string]: IPortConfigUnion }> = FullPort<
  PortTypeEnum.Object,
  IObjectPortConfig<Schema>,
  IGenericObjectPortValue<Schema>
>

export type StreamPort = FullPort<PortTypeEnum.Stream, IStreamPortConfig, IStreamPortValue>

/**
 * Union of all full ports.
 * (This union is useful for aggregate operations.)
 */
export type PortUnion =
  | StringPort
  | NumberPort
  | BooleanPort
  | EnumPort
  | ArrayPort<IPortConfigUnion>
  | ObjectPort<{ [key: string]: IPortConfigUnion }>
  | StreamPort

/**
 * Full port type inferred from Zod schema.
 * This can be used as an alternative to the PortUnion type.
 */
export type InferredFullPort = z.infer<typeof FullPortSchema>
