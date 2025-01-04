/**
 * Base enum for all available port types
 */
export enum PortTypeEnum {
  // Primitive types
  String = 'string',
  Number = 'number',
  Boolean = 'boolean',

  // Complex types
  Array = 'array',
  Object = 'object',
}

/**
 * Primitive port types derived from PortTypeEnum
 */
export type PrimitivePortTypeUnion =
  | PortTypeEnum.String
  | PortTypeEnum.Number
  | PortTypeEnum.Boolean

export const PrimitivePortType = {
  [PortTypeEnum.String]: PortTypeEnum.String,
  [PortTypeEnum.Number]: PortTypeEnum.Number,
  [PortTypeEnum.Boolean]: PortTypeEnum.Boolean,
} as const

/**
 * Object schema for structured data
 */
export interface ObjectSchema {
  properties: Record<string, PortType>
  required?: string[]
}

/**
 * Complex port types for structured data
 */
export interface ComplexPortType {
  [PortTypeEnum.Array]: {
    type: PortTypeEnum.Array
    elementType: PortType
  }
  [PortTypeEnum.Object]: {
    type: PortTypeEnum.Object
    schema: ObjectSchema
  }
}

/**
 /* Helper type for creating strictly typed array configurations
 */
export interface ArrayType<T extends PortType> {
  readonly type: PortTypeEnum.Array
  readonly elementType: T
}

/**
 * Union of all possible port types
 */
export type PortType =
  | PrimitivePortTypeUnion
  | ComplexPortType[keyof ComplexPortType]

/**
 * Type guards
 */
export function isPrimitivePortType(type: PortType): type is PrimitivePortTypeUnion {
  return Object.values(PrimitivePortType).includes(type as PrimitivePortTypeUnion)
}

export function isArrayPortType(type: PortType): type is ComplexPortType[PortTypeEnum.Array] {
  return typeof type === 'object' && 'type' in type && type.type === PortTypeEnum.Array
}

export function isObjectPortType(type: PortType): type is ComplexPortType[PortTypeEnum.Object] {
  return typeof type === 'object' && 'type' in type && type.type === PortTypeEnum.Object
}
