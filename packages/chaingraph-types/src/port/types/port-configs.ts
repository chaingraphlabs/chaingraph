import type { PortConfig } from './port-interface'
import type { ComplexPortType, PortType } from './port-types'

/**
 * Object property configuration
 */
export interface ObjectProperty {
  type: PortType
  config: PortConfig<PortType>
}

/**
 * Object port configuration
 */
export interface ObjectPortConfig extends PortConfig<ComplexPortType.Object> {
  properties: Record<string, ObjectProperty>
}

/**
 * Array port configuration
 */
export interface ArrayPortConfig<T extends PortType> extends PortConfig<ComplexPortType.Array> {
  elementType: T
  elementConfig?: PortConfig<T>
}
