import type { ArrayPortConfig } from '@chaingraph/types/port/array'
import type { BooleanPortConfig } from './scalar/boolean'
import type { NumberPortConfig } from './scalar/number'
import type { StringPortConfig } from './scalar/string'
import type { IPort, PortConfig } from './types/port-interface'
import type { PortType } from './types/port-types'
import { ArrayPort } from './array/array'
import { BooleanPort } from './scalar/boolean'
import { NumberPort } from './scalar/number'
import { StringPort } from './scalar/string'
import { ComplexPortType, PrimitivePortType } from './types/port-types'

export class PortFactory {
  /**
   * Function overloads with more specific types
   */
  static createElementPort<T extends PortType>(
    type: T,
    config: Omit<
      T extends PrimitivePortType.String ? StringPortConfig :
        T extends PrimitivePortType.Number ? NumberPortConfig :
          T extends PrimitivePortType.Boolean ? BooleanPortConfig :
            T extends ComplexPortType.Array ? ArrayPortConfig<T> :
              never,
      'type'
    >
  ): IPort<T>

  static createElementPort<T extends PortType>(
    type: T,
    config: PortConfig<any>,
  ): IPort<any> {
    const fullConfig = { ...config, type }

    switch (type) {
      case PrimitivePortType.String:
        return new StringPort(fullConfig)
      case PrimitivePortType.Number:
        return new NumberPort(fullConfig)
      case PrimitivePortType.Boolean:
        return new BooleanPort(fullConfig)
      case ComplexPortType.Array:
        return new ArrayPort(fullConfig)
      default:
        throw new Error(`Unsupported port type: ${type}`)
    }
  }
}
