import type { z } from 'zod'
import type { PortConfig } from '../config/types'
import type { PortValueType } from '../config/value-types'

/**
 * Serialized port data structure
 */
export interface SerializedPortData {
  config: PortConfig
  value?: unknown
  metadata?: Record<string, unknown>
}

/**
 * Base interface for all port types
 */
export interface IPort<TConfig extends PortConfig = PortConfig, TValue = PortValueType<TConfig>> {
  // Configuration
  readonly config: TConfig

  // Value management
  value: TValue
  getValue: () => TValue
  setValue: (value: TValue) => void
  hasValue: () => boolean
  reset: () => void

  // Validation
  validate: () => boolean
  validateValue: (value: unknown) => value is TValue
  validateConfig: (config: unknown) => config is TConfig

  // Metadata
  getMetadata: <T = unknown>(key: string) => T | undefined
  setMetadata: (key: string, value: unknown) => void

  // Serialization
  serialize: () => SerializedPortData
  deserialize: (data: SerializedPortData) => IPort<TConfig, TValue>

  // Utility
  clone: () => IPort<TConfig, TValue>
  toString: () => string

  // Schema access
  getConfigSchema: () => z.ZodType<TConfig>
  getValueSchema: () => z.ZodType<TValue>
}

/**
 * Port event types
 */
export type PortEventType =
  | 'value:change'
  | 'value:reset'
  | 'metadata:change'
  | 'validation:error'

/**
 * Port event handler
 */
export interface PortEventHandler<T = unknown> {
  (event: PortEventType, data: T): void
}

/**
 * Extended port interface with event handling
 */
export interface IEventPort<TConfig extends PortConfig = PortConfig, TValue = PortValueType<TConfig>>
  extends IPort<TConfig, TValue> {

  on: (event: PortEventType, handler: PortEventHandler) => void
  off: (event: PortEventType, handler: PortEventHandler) => void
  emit: (event: PortEventType, data?: unknown) => void
}

/**
 * Port constructor type
 */
export type PortConstructor<
  TConfig extends PortConfig = PortConfig,
  TValue = PortValueType<TConfig>,
> = new (config: TConfig) => IPort<TConfig, TValue>
