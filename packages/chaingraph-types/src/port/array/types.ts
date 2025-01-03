import type { PortConfig } from '@chaingraph/types'
import type { PortValue, PortValueType } from '@chaingraph/types/port/values'

/**
 * Configuration for array ports
 */
export interface ArrayPortConfig<T extends PortValueType> extends Omit<PortConfig, 'type' | 'defaultValue'> {
  type: 'array'
  elementType: T
  elementConfig: Omit<PortConfig, 'id' | 'name'> // Shared configuration for elements
  defaultValue?: PortValue<T>[]
}
