/**
 * Base interface for all port configurations.
 * Provides common fields that every port type shares.
 */
export interface BasePortConfig<T> {
  /** Unique identifier for the port */
  id?: string

  /** ID of the parent node/object containing this port */
  parentId?: string

  /** ID of the node this port belongs to */
  nodeId?: string

  /** Key identifier for the port within its parent context */
  key?: string

  /** Human-readable title for the port */
  title?: string

  /** Detailed description of the port's purpose and usage */
  description?: string

  /** Specifies whether this is an input or output port */
  direction?: 'input' | 'output'

  /** Indicates if this port is optional in its context */
  optional?: boolean

  /** Default value for the port if no value is provided */
  defaultValue?: T

  /** Additional metadata for the port */
  metadata?: Record<string, unknown>
}

/**
 * Available port types in the system.
 * Each type corresponds to a specific port plugin implementation.
 */
export type PortType = 'string' | 'number' | 'array' | 'object' | 'boolean' | 'stream'

/**
 * Extended port configuration that includes the required type field.
 * This is the main interface used for defining ports in the system.
 */
export interface PortConfig<T> extends BasePortConfig<T> {
  /** The type of port, determining its behavior and validation rules */
  type: PortType
}

/**
 * Schema definition for object-type ports.
 * Describes the structure and properties of object ports.
 */
export interface ObjectSchema {
  /** Optional unique identifier for the schema */
  id?: string

  /** Human-readable title for the schema */
  title?: string

  /** Detailed description of the schema's purpose and structure */
  description?: string

  /** Optional category for organizing schemas */
  category?: string

  /** Property definitions for the object, mapping property names to their port configurations */
  properties: Record<string, PortConfig<any>>

  /** Flag indicating this is an object schema (useful for type checking) */
  isObjectSchema?: boolean

  /** Additional metadata for the schema */
  metadata?: Record<string, unknown>
}
