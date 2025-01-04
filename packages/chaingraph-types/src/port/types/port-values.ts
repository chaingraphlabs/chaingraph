import type { Decimal } from 'decimal.js'
import type { ComplexPortType, PortType, PortTypeEnum, PrimitivePortTypeUnion } from './port-types'

// ----------------
// Primitive Types
// ----------------

/**
 * Mapping primitive types to their value types
 */
export interface PrimitiveTypeMap {
  [PortTypeEnum.String]: string
  [PortTypeEnum.Number]: Decimal
  [PortTypeEnum.Boolean]: boolean
}

/**
 * Get value type for primitive port type
 */
export type PrimitivePortValue<T extends PrimitivePortTypeUnion> = PrimitiveTypeMap[T]

/**
 * Get value type for array elements
 */
export type ArrayElementValue<T extends PortType> =
    T extends PrimitivePortTypeUnion ? PrimitiveTypeMap[T]
      : T extends ComplexPortType[PortTypeEnum.Array] ? ArrayPortValue<T['elementType']>
        : T extends ComplexPortType[PortTypeEnum.Object] ? ObjectPortValue<T['schema']['properties']>
          : never

/**
 * Get value type for array port
 */
export type ArrayPortValue<T extends PortType> = Array<ArrayElementValue<T>>

/**
 * Get value type for object port
 */
export type ObjectPortValue<T extends Record<string, PortType>> = {
  [K in keyof T]: PortValue<T[K]>
}

/**
 * Get value type for any port type
 */
export type PortValue<T extends PortType> = T extends PrimitivePortTypeUnion
  ? PrimitiveTypeMap[T]
  : T extends ComplexPortType[PortTypeEnum.Array]
    ? ArrayPortValue<T['elementType']>
    : T extends ComplexPortType[PortTypeEnum.Object]
      ? ObjectPortValue<T['schema']['properties']>
      : never

/**
 * Helper type for extracting value type from port config
 */
export type ExtractPortValue<T extends PortType> = PortValue<T>

// ----------------
// Array Helpers
// ----------------

// ----------------
// Examples
// ----------------

// Primitive examples
// type StringValue = PortValue<PortTypeEnum.String> // string
// type NumberValue = PortValue<PortTypeEnum.Number> // Decimal
// type BooleanValue = PortValue<PortTypeEnum.Boolean> // boolean
//
// // Example with explicit type
// const stringArrayType = {
//   type: PortTypeEnum.Array,
//   elementType: PortTypeEnum.String,
// } as const satisfies ComplexPortType[PortTypeEnum.Array]
//
// type StringArrayValue = PortValue<typeof stringArrayType>// string[]
//
// // Usage examples:
// const numberArrayType: ArrayType<PortTypeEnum.Number> = {
//   type: PortTypeEnum.Array,
//   elementType: PortTypeEnum.Number,
// } as const
//
// type NumberArrayValue = PortValue<typeof numberArrayType> // Should infer Decimal[]
//
// // Another example with helper function
// function createArrayType<T extends PortType>(elementType: T): ArrayType<T> {
//   return {
//     type: PortTypeEnum.Array,
//     elementType,
//   } as const
// }
//
// const stringArrayType2 = createArrayType(PortTypeEnum.String)
// type StringArrayValue2 = PortValue<typeof stringArrayType2> // Should infer string[]
