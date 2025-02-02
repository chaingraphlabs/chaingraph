import type { z } from 'zod'

/**
 * Base interface for all port plugins
 */
export interface IPortPlugin<TConfig = any, TValue = any> {
  /** Unique identifier for this port type */
  typeIdentifier: string

  /** Schema for port configuration */
  configSchema: z.ZodSchema<TConfig>

  /** Schema for port value */
  valueSchema: z.ZodSchema<TValue>

  /** Optional serialization method */
  serializeValue?: (value: TValue) => unknown

  /** Optional deserialization method */
  deserializeValue?: (data: unknown) => TValue
}

/**
 * Base interface for port configuration
 */
export interface IPortConfig {
  /** Unique identifier for the port instance */
  id?: string

  /** Display name for the port */
  name?: string

  /** Port type identifier */
  type: string

  /** Additional metadata */
  metadata?: Record<string, unknown>
}

/**
 * Base interface for port value
 */
export interface IPortValue<T = unknown> {
  /** Port type identifier (must match config.type) */
  type: string

  /** Actual value data */
  value: T
}

/**
 * Complete port interface combining config and value
 */
export interface IPort<TConfig extends IPortConfig = IPortConfig, TValue extends IPortValue = IPortValue> {
  config: TConfig
  value: TValue
}

/**
 * Type helper to extract the config type from a port plugin
 */
export type ExtractConfigType<T extends IPortPlugin> = z.infer<T['configSchema']>

/**
 * Type helper to extract the value type from a port plugin
 */
export type ExtractValueType<T extends IPortPlugin> = z.infer<T['valueSchema']>

/**
 * Error types for port operations
 */
export enum PortErrorType {
  ValidationError = 'ValidationError',
  SerializationError = 'SerializationError',
  DeserializationError = 'DeserializationError',
  RegistryError = 'RegistryError',
}

/**
 * Custom error class for port-related errors
 */
export class PortError extends Error {
  constructor(
    public type: PortErrorType,
    message: string,
    public originalError?: unknown,
  ) {
    super(message)
    this.name = 'PortError'
  }
}
