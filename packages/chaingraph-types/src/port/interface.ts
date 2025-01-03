import type { PortConfig } from './types'

/**
 * Base interface for all ports in ChainGraph
 */
export interface IPort<T = unknown> {
  /** Port configuration */
  config: PortConfig

  /** Current value of the port */
  value: T

  /** Get the current value */
  getValue: () => T

  /** Set a new value */
  setValue: (value: T) => void

  /** Validate the current value */
  validate: () => Promise<boolean>

  /** Reset the port to its default value */
  reset: () => void

  /** Check if the port has a value */
  hasValue: () => boolean

  /** Clone the port */
  clone: () => IPort<T>
}
