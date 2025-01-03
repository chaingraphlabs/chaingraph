/**
 * Primitive port types
 */
export enum PrimitivePortType {
  String = 'string',
  Number = 'number',
  Boolean = 'boolean',
}

/**
 * Complex port types for structured data
 */
export enum ComplexPortType {
  Array = 'array',
  Object = 'object',
}

/**
 * Union of all possible port types
 */
export type PortType = PrimitivePortType | ComplexPortType

/**
 * Type guard for primitive port types
 */
export function isPrimitivePortType(type: PortType): type is PrimitivePortType {
  return Object.values(PrimitivePortType).includes(type as PrimitivePortType)
}

/**
 * Type guard for complex port types
 */
export function isComplexPortType(type: PortType): type is ComplexPortType {
  return Object.values(ComplexPortType).includes(type as ComplexPortType)
}
