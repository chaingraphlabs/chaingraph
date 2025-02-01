// File: chaingraph/packages/chaingraph-types/src/port.new2/schema/port-array-generic.ts
import type { IArrayPortConfig, IBooleanPortConfig, INumberPortConfig, IObjectPortConfig, IPortConfigUnion, IStringPortConfig } from './port-configs'
import type { IGenericArrayPortValue } from './port-value-types'

/**
 * GenericArrayPort is our unified type.
 * T must extend IPortConfigUnion (the configuration of the array's element).
 */
export interface GenericArrayPort<T extends IPortConfigUnion> {
  config: IArrayPortConfig<T>
  value: IGenericArrayPortValue<T>
}

/**
 * Helper type: ArrayPort<T> is an alias for GenericArrayPort<T>.
 */
export type ArrayPort<T extends IPortConfigUnion> = GenericArrayPort<T>

/** Single-dimension array of strings: item is a string config */
type ArrayOfStringConfig = IArrayPortConfig<IStringPortConfig>
export type ArrayOfStringPort = GenericArrayPort<IStringPortConfig>

/** Single-dimension array of numbers: item is a number config */
type ArrayOfNumberConfig = IArrayPortConfig<INumberPortConfig>
export type ArrayOfNumberPort = GenericArrayPort<INumberPortConfig>

/** Single-dimension array of booleans: item is a boolean config */
type ArrayOfBooleanConfig = IArrayPortConfig<IBooleanPortConfig>
export type ArrayOfBooleanPort = GenericArrayPort<IBooleanPortConfig>

/** Single-dimension array of objects: item is an object config */
type ArrayOfObjectConfig = IArrayPortConfig<IObjectPortConfig>
export type ArrayOfObjectPort = GenericArrayPort<IObjectPortConfig>

/** Double-dimension array of strings: item is itself an array-of-string config */
type ArrayOfArrayStringConfig = IArrayPortConfig<ArrayOfStringConfig>
export type ArrayOfArrayStringPort = GenericArrayPort<ArrayOfStringConfig>
