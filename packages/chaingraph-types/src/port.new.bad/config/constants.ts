/**
 * Port direction enum
 */
export enum PortDirection {
  Input = 'input',
  Output = 'output',
}

/**
 * Port type enum
 */
export enum PortType {
  String = 'string',
  Number = 'number',
  Boolean = 'boolean',
  Array = 'array',
  Object = 'object',
  Enum = 'enum',
  Stream = 'stream',
  Any = 'any',
}

/**
 * Stream mode enum
 */
export enum StreamMode {
  Input = 'input',
  Output = 'output',
}

/**
 * Math operation types (example for custom types)
 */
export enum MathOperationType {
  Add = 'add',
  Subtract = 'subtract',
  Multiply = 'multiply',
  Divide = 'divide',
}

/**
 * Rounding modes
 */
export enum RoundingMode {
  Floor = 'floor',
  Ceil = 'ceil',
  Round = 'round',
}

/**
 * Version constants
 */
export const VERSION = {
  INITIAL: 1,
  CURRENT: 1,
} as const

/**
 * Error messages
 */
export const ERROR_MESSAGES = {
  UNKNOWN_PORT_TYPE: 'Unknown port type:',
  INVALID_PORT_TYPE: 'Invalid port type:',
  UNKNOWN_SERIALIZABLE_TYPE: 'No registered class for type:',
  DIVISION_BY_ZERO: 'Division by zero',
  SERIALIZATION_FAILED: 'Failed to serialize port configuration',
  DESERIALIZATION_FAILED: 'Failed to deserialize port configuration',
  INVALID_VALUE: 'Invalid value',
  DESERIALIZATION_ERROR: 'Deserialization error',
} as const
