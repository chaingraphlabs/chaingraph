import type { Decimal } from 'decimal.js'
import type { ArrayPortConfig, ObjectPortConfig, ObjectProperty } from './port-configs'
import type { PortConfig } from './port-interface'
import type { ComplexPortType, PortType, PrimitivePortType } from './port-types'

// ----------------
// Primitive Types
// ----------------

/**
 * Mapping of primitive port types to their value types
 */
export interface PrimitiveTypeMap {
  [PrimitivePortType.String]: string
  [PrimitivePortType.Number]: Decimal
  [PrimitivePortType.Boolean]: boolean
}

/**
 * Type mapping for primitive port values
 */
export type PrimitivePortValue<T extends PrimitivePortType> = PrimitiveTypeMap[T]

// ----------------
// Complex Types
// ----------------

/**
 * Recursive type for possible port values
 */
export type RecursivePortValue =
  | PrimitiveTypeMap[keyof PrimitiveTypeMap]
  | Array<RecursivePortValue>
  | { [key: string]: RecursivePortValue }

/**
 * Base value type mapping
 */
export interface BaseTypeMap {
  [PrimitivePortType.String]: string
  [PrimitivePortType.Number]: Decimal
  [PrimitivePortType.Boolean]: boolean
  [ComplexPortType.Array]: Array<RecursivePortValue>
  [ComplexPortType.Object]: { [key: string]: RecursivePortValue }
}

// ----------------
// Array Values
// ----------------

/**
 * Array value type with recursive type checking
 */
export type ArrayValue<T extends PortType> =
  T extends PrimitivePortType ? Array<PrimitiveTypeMap[T]> :
    T extends ComplexPortType.Array ? Array<Array<RecursivePortValue>> :
      T extends ComplexPortType.Object ? Array<{ [key: string]: RecursivePortValue }> :
        never

// ----------------
// Object Values
// ----------------

/**
 * Object property value with recursive type checking
 */
export type ObjectPropertyValue<T extends ObjectProperty> =
  T['type'] extends PrimitivePortType ? PrimitiveTypeMap[T['type']] :
    T['type'] extends ComplexPortType.Array ? Array<RecursivePortValue> :
      T['type'] extends ComplexPortType.Object ? { [key: string]: RecursivePortValue } :
        never

/**
 * Object value type
 */
export type ObjectValue<T extends ObjectPortConfig> = {
  [K in keyof T['properties']]: ObjectPropertyValue<T['properties'][K]>
}

// ----------------
// Type Helpers
// ----------------

/**
 * Type mapping for complex port values
 */
export type ComplexPortValue<T> =
  T extends ArrayPortConfig<infer E>
    ? E extends PortType
      ? ArrayValue<E>
      : never
    : T extends ObjectPortConfig
      ? ObjectValue<T>
      : never

/**
 * Combined type for all possible port values
 */
export type PortValue<T> =
  T extends PortType | ArrayPortConfig<PortType> | ObjectPortConfig
    ? T extends PrimitivePortType ? PrimitiveTypeMap[T]
      : T extends ArrayPortConfig<infer E>
        ? E extends PortType
          ? ArrayValue<E>
          : never
        : T extends ObjectPortConfig
          ? ObjectValue<T>
          : never
    : never

/**
 * Helper type for array port values
 */
export type ArrayPortValue<T extends PortType> = Array<PortValue<T>>

/**
 * Helper for extracting the value type from a port type
 */
export type ExtractPortValue<T extends PortType> = PortValue<T>

/**
 * Helper for extracting the value type from a port config
 */
export type ExtractConfigValue<T extends PortConfig<PortType>> = PortValue<T['type']>
