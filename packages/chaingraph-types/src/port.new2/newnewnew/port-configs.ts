import type { z } from 'zod'
import type { JSONValue } from './json'
import type { PortTypeEnum } from './port-types.enum'
import type {
  PortConfigUnionSchema,
} from './zod-port-configs'

/**
 * String Port Config
 */
export interface IStringPortConfig {
  type: PortTypeEnum.String
  id?: string
  name?: string
  metadata?: Record<string, JSONValue>
}

/**
 * Number Port Config
 */
export interface INumberPortConfig {
  type: PortTypeEnum.Number
  id?: string
  name?: string
  metadata?: Record<string, JSONValue>
}

/**
 * Boolean Port Config
 */
export interface IBooleanPortConfig {
  type: PortTypeEnum.Boolean
  id?: string
  name?: string
  metadata?: Record<string, JSONValue>
}

/**
 * Enum Port Config, with an "options" field that is an array of full port configs.
 */
export interface IEnumPortConfig {
  type: PortTypeEnum.Enum
  id?: string
  name?: string
  metadata?: Record<string, JSONValue>
  options: IPortConfigUnion[]
}

/**
 * Generic Array Port Config – parameterized by ItemConfig.
 * The "itemConfig" field fully describes the configuration for each array element.
 */
export interface IArrayPortConfig<ItemConfig extends IPortConfigUnion> {
  type: PortTypeEnum.Array
  id?: string
  name?: string
  metadata?: Record<string, JSONValue>
  itemConfig: ItemConfig
}

/**
 * Generic Object Port Config – parameterized by Schema.
 * "schema" is a record mapping field names to port configurations.
 */
export interface IObjectPortConfig<Schema extends { [key: string]: IPortConfigUnion }> {
  type: PortTypeEnum.Object
  id?: string
  name?: string
  metadata?: Record<string, JSONValue>
  schema: Schema
}

/**
 * The union of all possible port configuration types.
 * (For IArrayPortConfig and IObjectPortConfig we use a generic form.)
 */
export type IPortConfigUnion = z.infer<typeof PortConfigUnionSchema>
