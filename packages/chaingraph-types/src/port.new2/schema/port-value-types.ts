// File: chaingraph/packages/chaingraph-types/src/port.new2/schema/port-value-types.ts
import type { EnsureJSONSerializable } from './json'
import type { IPortConfigUnion } from './port-configs'
import type { MapItemConfigToValue } from './port-mappings'
import type { PortTypeEnum } from './port-types.enum'

/** String port value. */
export interface IStringPortValue {
  type: PortTypeEnum.String
  value: string
}

/** Number port value. */
export interface INumberPortValue {
  type: PortTypeEnum.Number
  value: number
}

/** Boolean port value. */
export interface IBooleanPortValue {
  type: PortTypeEnum.Boolean
  value: boolean
}

/** Enum port value. */
export interface IEnumPortValue {
  type: PortTypeEnum.Enum
  value: string
}

/** Object port value. */
export interface IObjectPortValue {
  type: PortTypeEnum.Object
  value: { [key: string]: IPortValueUnion }
}

/**
 * Generic Array Port Value definition.
 * The property "value" is an array of elements whose type is MapItemConfigToValue<ItemConfig>.
 */
export interface IGenericArrayPortValue<ItemConfig extends IPortConfigUnion> {
  type: PortTypeEnum.Array
  value: Array<MapItemConfigToValue<ItemConfig>>
}

/** The raw union of all possible port value variants. */
export type IPortValueUnion =
  | IStringPortValue
  | INumberPortValue
  | IBooleanPortValue
  | IEnumPortValue
  | IObjectPortValue
  | IGenericArrayPortValue<IPortConfigUnion>

/**
 * The final PortValue type used throughout the system.
 * This is safely recursive because TypeScript can handle
 * interface-based unions referencing themselves.
 */
export type PortValue = EnsureJSONSerializable<IPortValueUnion>
