/**
 * Represents the direction of a port
 */
export type PortDirection = 'input' | 'output'

/**
 * Base primitive types supported by ports
 */
export type PortPrimitiveType =
  | 'string'
  | 'number'
  | 'boolean'
  | 'null'

/**
 * Complex data types supported by ports
 */
export type PortComplexType =
  | 'object'
  | 'array'

/**
 * Special types for advanced use cases
 */
export type PortSpecialType =
  | 'stream'
  | 'promise'
  | 'observable'

/**
 * Union of all possible port types
 */
export type PortType =
  | PortPrimitiveType
  | PortComplexType
  | PortSpecialType
  | string // For custom types

/**
 * Configuration options for a port
 */
export interface PortConfig {
  /** Unique identifier of the port */
  id: string

  /** Display name of the port */
  name: string

  /** Direction of data flow */
  direction: PortDirection

  /** Type of data that can flow through this port */
  type: PortType

  /** Optional description */
  description?: string

  /** Default value */
  defaultValue?: unknown

  /** Whether the port is required */
  required?: boolean

  /** Custom validation rules */
  validation?: PortValidation

  /** Additional metadata */
  metadata?: Record<string, unknown>
}

/**
 * Validation rules for port values
 */
export interface PortValidation {
  /** Custom validation function */
  validator?: (value: unknown) => boolean | Promise<boolean>

  /** Error message for validation failure */
  errorMessage?: string

  /** Additional validation metadata */
  metadata?: Record<string, unknown>
}
