import type { ArrayPortConfig } from './array/array'
import type { BooleanPortConfig } from './scalar/boolean'
import type { NumberPortConfig } from './scalar/number'
import type { StringPortConfig } from './scalar/string'
import type { IPort, PortType } from './types'
import { ArrayPort } from './array/array'
import { BooleanPort } from './scalar/boolean'
import { NumberPort } from './scalar/number'
import { StringPort } from './scalar/string'
import { type ArrayType, PortTypeEnum } from './types/port-types'

export class PortFactory {
  /**
   * Create primitive ports
   */
  static createStringPort(config: Omit<StringPortConfig, 'type'>): StringPort {
    return new StringPort({
      ...config,
      type: PortTypeEnum.String,
    })
  }

  static createNumberPort(config: Omit<NumberPortConfig, 'type'>): NumberPort {
    return new NumberPort({
      ...config,
      type: PortTypeEnum.Number,
    })
  }

  static createBooleanPort(config: Omit<BooleanPortConfig, 'type'>): BooleanPort {
    return new BooleanPort({
      ...config,
      type: PortTypeEnum.Boolean,
    })
  }

  /**
   * Create array port
   */
  static createArrayPort<T extends PortType>(
    elementType: T,
    config: Omit<ArrayPortConfig<T>, 'arrayType'>,
  ): ArrayPort<T> {
    const arrayType: ArrayType<T> = {
      type: PortTypeEnum.Array,
      elementType,
    }

    return new ArrayPort({
      ...config,
      arrayType,
    })
  }

  /**
   * Universal port creator with type inference
   */
  static create<T extends PortType>(
    type: T extends PortTypeEnum.String ? PortTypeEnum.String :
      T extends PortTypeEnum.Number ? PortTypeEnum.Number :
        T extends PortTypeEnum.Boolean ? PortTypeEnum.Boolean :
          never,
    config: Omit<
      T extends PortTypeEnum.String ? StringPortConfig :
        T extends PortTypeEnum.Number ? NumberPortConfig :
          T extends PortTypeEnum.Boolean ? BooleanPortConfig :
            never,
      'type'
    >
  ): IPort<T>

  static create<T extends PortType>(
    type: ArrayType<T>,
    config: Omit<ArrayPortConfig<T>, 'arrayType'>
  ): ArrayPort<T>

  static create(
    type: PortType | ArrayType<any>,
    config: any,
  ): IPort<any> {
    if (typeof type === 'string') {
      // Primitive types
      switch (type) {
        case PortTypeEnum.String:
          return this.createStringPort(config)
        case PortTypeEnum.Number:
          return this.createNumberPort(config)
        case PortTypeEnum.Boolean:
          return this.createBooleanPort(config)
        default:
          throw new Error(`Unsupported primitive type: ${type}`)
      }
    } else if (type.type === PortTypeEnum.Array) {
      // Array type
      return this.createArrayPort(type.elementType, config)
    }

    throw new Error(`Unsupported port type: ${JSON.stringify(type)}`)
  }
}
