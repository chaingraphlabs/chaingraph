import type { PortType } from './port-types'
import type { PortValue } from './port-values'

/**
 * Port validation configuration
 */
export interface PortValidation<T extends PortType> {
  /** Custom validation function */
  validator?: (value: PortValue<T>) => boolean | Promise<boolean>
  /** Error message for validation failure */
  errorMessage?: string
}

/**
 * Base port configuration
 */
export interface PortConfig<T extends PortType> {
  /** Unique identifier of the port */
  id: string
  /** Display name of the port */
  name: string
  /** Port type */
  type: T
  /** Default value */
  defaultValue?: PortValue<T>
  /** Validation rules */
  validation?: PortValidation<T>
  /** Additional metadata */
  metadata?: Record<string, unknown>
}

/**
 * Base port interface
 */
export interface IPort<T extends PortType> {
  /** Port configuration */
  readonly config: PortConfig<T>

  /** Current value */
  readonly value: PortValue<T>

  /** Get current value */
  getValue: () => PortValue<T>

  /** Set new value */
  setValue: (value: PortValue<T>) => void

  /** Validate current value */
  validate: () => Promise<boolean>

  /** Reset to default value */
  reset: () => void

  /** Check if port has value */
  hasValue: () => boolean

  /** Create a copy of the port */
  clone: () => IPort<T>
}
