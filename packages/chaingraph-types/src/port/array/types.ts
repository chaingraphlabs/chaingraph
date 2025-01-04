import type { PortConfig, PortValidation } from '../types/port-interface'
import type { ComplexPortType, PortType } from '../types/port-types'

/**
 * Array-specific validation
 */
export interface ArrayPortValidation extends PortValidation<ComplexPortType.Array> {
  minLength?: number
  maxLength?: number
}

/**
 * Configuration for array ports
 */
export interface ArrayPortConfig<T extends PortType> extends PortConfig<ComplexPortType.Array> {
  /** Element type configuration */
  element: {
    type: T
    config: PortConfig<T>
  }
}
