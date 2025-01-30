import type { IEventPort, SerializedPortData } from '../base/port.interface'
import type { ConfigFromPortType, PortConfig } from '../config/types'
import { z } from 'zod'
import { Port } from '../base/port.base'
import { PortType } from '../config/constants'
import { type BasePortConstructor, type BasePortSerializer, type BasePortValidator, PortFactory } from '../registry/port-factory'
import { arrayConfigSchema } from '../schemas'

/**
 * Array port implementation
 */
export class ArrayPort<T = unknown> extends Port<ConfigFromPortType<PortType.Array>, T[]> {
  constructor(config: ConfigFromPortType<PortType.Array>) {
    super(config)
  }

  getConfigSchema(): z.ZodType<ConfigFromPortType<PortType.Array>> {
    return arrayConfigSchema as z.ZodType<ConfigFromPortType<PortType.Array>>
  }

  getValueSchema(): z.ZodType<T[]> {
    return z.array(PortFactory.getSchema(this.config.elementConfig) as z.ZodType<T>)
  }

  setValue(value: T[]): void {
    if (!Array.isArray(value)) {
      throw new TypeError('Value must be an array')
    }

    // Validate each element
    value.forEach((item, index) => {
      if (!PortFactory.validate(item, this.config.elementConfig)) {
        throw new TypeError(`Invalid array element at index ${index}`)
      }
    })

    super.setValue(value)
  }

  serialize(): SerializedPortData {
    const serialized = super.serialize()

    if (serialized.value) {
      const value = serialized.value as T[]
      serialized.value = value.map(item =>
        PortFactory.serialize(item, this.config.elementConfig),
      )
    }

    return serialized
  }

  override deserialize(data: SerializedPortData): IEventPort<ConfigFromPortType<PortType.Array>, T[]> {
    const port = super.deserialize(data) as IEventPort<ConfigFromPortType<PortType.Array>, T[]>

    if (data.value) {
      const value = data.value as unknown[]
      const deserializedValue = value.map(item =>
        PortFactory.deserialize(item, this.config.elementConfig),
      )
      port.setValue(deserializedValue as T[])
    }

    return port
  }

  toString(): string {
    return `ArrayPort(${this.hasValue() ? JSON.stringify(this.getValue()) : 'undefined'})`
  }
}

/**
 * Array port validator
 */
const arrayPortValidator: BasePortValidator = {
  getSchema: (config: PortConfig) => {
    if (config.type !== PortType.Array) {
      throw new TypeError('Invalid config type')
    }
    const port = new ArrayPort(config as ConfigFromPortType<PortType.Array>)
    return port.getValueSchema()
  },
  validate: (value: unknown, config: PortConfig) => {
    if (config.type !== PortType.Array) {
      return false
    }
    const port = new ArrayPort(config as ConfigFromPortType<PortType.Array>)
    try {
      port.setValue(value as any[])
      return true
    } catch {
      return false
    }
  },
}

/**
 * Array port serializer
 */
const arrayPortSerializer: BasePortSerializer = {
  serialize: (value: unknown, config: PortConfig) => {
    if (config.type !== PortType.Array) {
      throw new TypeError('Invalid config type')
    }
    const port = new ArrayPort(config as ConfigFromPortType<PortType.Array>)
    port.setValue(value as any[])
    return port.serialize().value
  },
  deserialize: (value: unknown, config: PortConfig) => {
    if (config.type !== PortType.Array) {
      throw new TypeError('Invalid config type')
    }
    const port = new ArrayPort(config as ConfigFromPortType<PortType.Array>)
    return port.deserialize({ config, value }).getValue()
  },
}

/**
 * Register array port in the factory
 */
export function registerArrayPort(): void {
  PortFactory.register(PortType.Array, {
    constructor: ArrayPort as unknown as BasePortConstructor,
    validator: arrayPortValidator,
    serializer: arrayPortSerializer,
  })
}
