import type { ArrayPortConfig } from '@chaingraph/types/port/types'
import type { BooleanPortConfig } from './scalar/boolean'
import type { NumberPortConfig } from './scalar/number'
import type { StringPortConfig } from './scalar/string'
import type { IPort, PortConfig } from './types/port-interface'
import { ArrayPort } from './array/array'
import { BooleanPort } from './scalar/boolean'
import { NumberPort } from './scalar/number'
import { StringPort } from './scalar/string'
import { ComplexPortType, type PortType, PrimitivePortType } from './types/port-types'

export class PortFactory {
  // /**
  //  * Create string port
  //  */
  // static createPort(config: StringPortConfig): StringPort
  // /**
  //  * Create number port
  //  */
  // static createPort(config: NumberPortConfig): NumberPort
  // /**
  //  * Create boolean port
  //  */
  // static createPort(config: BooleanPortConfig): BooleanPort
  // /**
  //  * Create array port
  //  */
  // static createPort<T extends PortType>(config: ArrayPortConfig<T>): ArrayPort<T>
  // /**
  //  * Create object port
  //  */
  // static createPort(config: ObjectPortConfig): ObjectPort

  /**
   * Implementation
   */
  static createPort(config: PortConfig<PortType>): IPort<any> {
    switch (config.type) {
      case PrimitivePortType.String:
        return this.createStringPort(config as StringPortConfig)

      case PrimitivePortType.Number:
        return this.createNumberPort(config as NumberPortConfig)

      case PrimitivePortType.Boolean:
        return this.createBooleanPort(config as BooleanPortConfig)

      case ComplexPortType.Array:
        return this.createArrayPort(config as ArrayPortConfig<any>)

        // case ComplexPortType.Object:
        //   return new ObjectPort(config as ObjectPortConfig)

      default:
        throw new Error(`Unsupported port type: ${config.type}`)
    }
  }

  /**
   * Create primitive ports with specific types
   */
  static createStringPort(
    config: Omit<StringPortConfig, 'type'>,
  ): StringPort {
    return new StringPort({ ...config, type: PrimitivePortType.String })
  }

  static createNumberPort(
    config: Omit<NumberPortConfig, 'type'>,
  ): NumberPort {
    return new NumberPort({ ...config, type: PrimitivePortType.Number })
  }

  static createBooleanPort(
    config: Omit<BooleanPortConfig, 'type'>,
  ): BooleanPort {
    return new BooleanPort({ ...config, type: PrimitivePortType.Boolean })
  }

  /**
   * Create array port
   */
  static createArrayPort<T extends PortType>(
    config: Omit<ArrayPortConfig<T>, 'type'>,
  ): ArrayPort<T> {
    return new ArrayPort({
      ...config,
      type: ComplexPortType.Array,
    } as ArrayPortConfig<T>)
  }

  /**
   * Create object port
   */
  // static createObjectPort(
  //   config: Omit<ObjectPortConfig, 'type'>,
  // ): ObjectPort {
  //   return new ObjectPort({
  //     ...config,
  //     type: ComplexPortType.Object,
  //   } as ObjectPortConfig)
  // }
}
