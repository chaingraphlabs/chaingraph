import type { PortConfig } from './new-port-config'

/**
 * Configuration options specific to number ports
 */
export interface NumberPortConfigOptions {
  /** Minimum allowed value */
  min?: number

  /** Maximum allowed value */
  max?: number

  /** Step value for increments/decrements */
  step?: number

  /** Whether the value must be an integer */
  integer?: boolean
}

/**
 * Extended port configuration for number ports
 */
export interface NumberPortConfig extends PortConfig<number>, NumberPortConfigOptions {}
