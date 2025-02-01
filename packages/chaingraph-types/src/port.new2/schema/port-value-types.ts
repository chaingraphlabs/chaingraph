// File: chaingraph/packages/chaingraph-types/src/port.new2/schema/port-value-types.ts
import type { EnsureJSONSerializable } from './json'
import type { PortTypeEnum } from './port-types.enum'

/*
  Each "I<X>PortValue" is an interface describing one variant.
  We avoid type aliases here to reduce the risk of circular references.
*/

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

/** Enum port value – stores a single selected option's identifier. */
export interface IEnumPortValue {
  type: PortTypeEnum.Enum
  value: string
}

/** Array port value – each element of the array is another PortValue. */
export interface IArrayPortValue {
  type: PortTypeEnum.Array
  value: IPortValueUnion[] // reference the union below
}

/** Object port value – each property is another PortValue. */
export interface IObjectPortValue {
  type: PortTypeEnum.Object
  value: { [key: string]: IPortValueUnion }
}

/*
  1) Define IPortValueUnion as the union of all subinterfaces.
  2) Then apply EnsureJSONSerializable to that union for the final PortValue type.
*/

/** The raw union of all possible port value variants. */
export type IPortValueUnion =
  | IStringPortValue
  | INumberPortValue
  | IBooleanPortValue
  | IEnumPortValue
  | IArrayPortValue
  | IObjectPortValue

/**
 * The final PortValue type used throughout the system.
 * This is safely recursive because TypeScript can handle
 * interface-based unions referencing themselves.
 */
export type PortValue = EnsureJSONSerializable<IPortValueUnion>
