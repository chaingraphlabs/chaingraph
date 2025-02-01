import type { BasePortConfig } from './port'
import type { PortTypeEnum } from './port-types.enum'

/**
 * String Port Config
 */
export interface IStringPortConfig extends BasePortConfig {
  type: PortTypeEnum.String
}

/**
 * Number Port Config
 */
export interface INumberPortConfig extends BasePortConfig {
  type: PortTypeEnum.Number
}

/**
 * Boolean Port Config
 */
export interface IBooleanPortConfig extends BasePortConfig {
  type: PortTypeEnum.Boolean
}

/**
 * Enum Port Config, with an "options" field that is an array of full port configs.
 */
export interface IEnumPortConfig extends BasePortConfig {
  type: PortTypeEnum.Enum
  options: IPortConfigUnion[]
}

/**
 * Generic Array Port Config – parameterized by ItemConfig.
 * The "itemConfig" field fully describes the configuration for each array element.
 */
export interface IArrayPortConfig<ItemConfig extends IPortConfigUnion> extends BasePortConfig {
  type: PortTypeEnum.Array
  itemConfig: ItemConfig
}

/**
 * Generic Object Port Config – parameterized by Schema.
 * "schema" is a record mapping field names to port configurations.
 */
export interface IObjectPortConfig<Schema extends { [key: string]: IPortConfigUnion }> extends BasePortConfig {
  type: PortTypeEnum.Object
  schema: Schema
}

/**
 * The union of all possible port configuration types.
 * (For IArrayPortConfig and IObjectPortConfig we use a generic form.)
 */
export type IPortConfigUnion =
  | IStringPortConfig
  | INumberPortConfig
  | IBooleanPortConfig
  | IEnumPortConfig
  | IArrayPortConfig<IPortConfigUnion>
  | IObjectPortConfig<{ [key: string]: IPortConfigUnion }>
