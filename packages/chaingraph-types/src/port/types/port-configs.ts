import type { PortConfig } from './port-interface'
import type { ComplexPortType, PortType } from './port-types'

/**
 * Object property configuration
 */
export interface ObjectTypeProperty {
  type: PortType
  config: PortConfig<PortType>
}

/**
 * Object port configuration
 */
export interface ObjectTypePortConfig {
  type: ComplexPortType.Object
  properties: Record<string, ObjectTypeProperty>
}

/**
 * Array port configuration
 */
export interface ArrayTypePortConfig<T extends PortType> {
  type: ComplexPortType.Array
  elementType: T
  elementConfig: PortConfig<T>
}
