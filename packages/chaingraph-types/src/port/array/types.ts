import type { PortConfig, PortValidation } from '../types/port-interface'
import type { ComplexPortType, PortType } from '../types/port-types'
import type { PortValue } from '../types/port-values'

/**
 * Validation rules specific to array ports
 */
export interface ArrayPortValidation<T extends PortType> extends Omit<PortValidation<ComplexPortType.Array>, 'validator'> {
  /** Custom array validator */
  validator?: (values: Array<PortValue<T>>) => boolean | Promise<boolean>
  /** Element-level validator */
  elementValidator?: (value: PortValue<T>) => boolean | Promise<boolean>
}

/**
 * Configuration for array ports
 */
export interface ArrayPortConfig<T extends PortType> extends Omit<PortConfig<ComplexPortType.Array>, 'defaultValue'> {
  /** The type of array elements */
  elementType: T
  /** Configuration for array elements */
  elementConfig?: PortConfig<T>
  /** Array validation rules */
  validation?: ArrayPortValidation<T>
  /** Default array value */
  defaultValue?: Array<PortValue<T>>
}
