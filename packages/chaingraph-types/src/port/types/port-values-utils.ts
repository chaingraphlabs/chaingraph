import type { ObjectPortConfig } from './port-configs'
import type { PortConfig } from './port-interface'
import type { ComplexPortType, PortType, PrimitivePortType } from './port-types'
import type {
  ArrayValue,
  ObjectValue,
  PortValue,
  PrimitiveTypeMap,
} from './port-values'

// ----------------
// Basic Utility Types
// ----------------

/**
 * Helper for creating primitive port values
 */
export type PrimitiveValue<T extends PrimitivePortType> = PrimitiveTypeMap[T]

/**
 * Helper for creating array port values
 */
export type ArrayOf<T extends PortType> = ArrayValue<T>

/**
 * Helper for creating object port values
 */
export type ObjectOf<T extends ObjectPortConfig> = ObjectValue<T>

// ----------------
// Numeric Type Helpers
// ----------------

/**
 * Build array of length N
 */
type BuildArray<N extends number, T = unknown, R extends Array<T> = []> =
  R['length'] extends N
    ? R
    : BuildArray<N, T, [...R, T]>

/**
 * Subtract one number from another using array length
 */
type Subtract<N extends number> =
  BuildArray<N> extends [...BuildArray<1>, ...infer Rest]
    ? Rest['length']
    : never

// Usage examples:
type Zero = Subtract<1> // 0
type One = Subtract<2> // 1
type Two = Subtract<3> // 2
type Five = Subtract<6> // 5

/**
 * Helper for nested array port types
 */
export interface NestedArrayPortType<T extends PortType, Depth extends number = 1> {
  type: ComplexPortType.Array
  elementType: Depth extends 1 ? T : NestedArrayPortType<T, Subtract<Depth>>
}

/**
 * Helper for nested array values
 */
export type NestedArrayValue<T extends PortType, Depth extends number = 1> =
  Depth extends 1
    ? ArrayOf<T>
    : Array<NestedArrayValue<T, Subtract<Depth>>>

/**
 * Common matrix types
 */
export type Matrix<T extends PrimitivePortType> = NestedArrayValue<T, 2>
export type Cube<T extends PrimitivePortType> = NestedArrayValue<T, 3>

// ----------------
// Type Construction Helpers
// ----------------

/**
 * Helper for creating primitive port config
 */
export function createPrimitiveConfig<T extends PrimitivePortType>(
  type: T,
  id: string,
  name: string,
  defaultValue?: PortValue<T>,
): PortConfig<T> {
  return {
    id,
    name,
    type,
    defaultValue,
  }
}

//
// /**
//  * Helper for creating array port config
//  */
// export function createArrayConfig<T extends PortType>(
//   elementType: T,
//   elementConfig?: PortConfig<T>,
// ): ArrayPortConfig<T> {
//   return {
//     type: ComplexPortType.Array,
//     elementType,
//     elementConfig,
//   }
// }
//
// /**
//  * Helper for creating nested array port types
//  */
// export function createNestedArrayType<T extends PortType, D extends 1 | 2 | 3>(
//   elementType: T,
//   depth: D,
// ): NestedArrayPortType<T, D> {
//   if (depth === 1) {
//     return {
//       type: ComplexPortType.Array,
//       elementType,
//     } as NestedArrayPortType<T, D>
//   }
//
//   return {
//     type: ComplexPortType.Array,
//     elementType: createNestedArrayType(elementType, (depth - 1) as 1 | 2),
//   } as NestedArrayPortType<T, D>
// }
