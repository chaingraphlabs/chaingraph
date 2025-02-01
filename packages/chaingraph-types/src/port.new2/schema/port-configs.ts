// File: chaingraph/packages/chaingraph-types/src/port.new2/schema/port-configs.ts
import type { BasePortConfig, PortUnion } from './port'
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
 * Enum Port Config
 */
export interface IEnumPortConfig extends BasePortConfig {
  type: PortTypeEnum.Enum
  options: PortEnumOption[]
}

/**
 * Array Port Config
 */
export interface IArrayPortConfig extends BasePortConfig {
  type: PortTypeEnum.Array
}

/**
 * Object Port Config
 */
export interface IObjectPortConfig extends BasePortConfig {
  type: PortTypeEnum.Object
}

/**
 * Represents an option inside an enum port.
 */
export interface PortEnumOption {
  port: PortUnion
}

/**
 * The union of all possible config interfaces.
 */
export type IPortConfigUnion =
  | IStringPortConfig
  | INumberPortConfig
  | IBooleanPortConfig
  | IEnumPortConfig
  | IArrayPortConfig
  | IObjectPortConfig
