import type { ConfigFromPortType, PortConfig } from '../config/types'
import { z } from 'zod'
import { Port } from '../base/port.base'
import { PortType } from '../config/constants'
import { type BasePortConstructor, type BasePortSerializer, type BasePortValidator, PortFactory } from '../registry/port-factory'
import { arrayPortSchema } from '../schemas'

/**
 * Array port implementation
 */
export class ArrayPort<T = unknown> extends Port<ConfigFromPortType<PortType.Array>, T[]> {
  constructor(config: ConfigFromPortType<PortType.Array>) {
    super(config)

    // Validate array-specific configuration
    const result = arrayPortSchema.safeParse(config)
    if (!result.success) {
      throw new TypeError(`Invalid array port configuration: ${result.error.message}`)
    }

    // Additional validation for elementConfig through PortFactory
    try {
      PortFactory.getSchema(config.elementConfig)
    } catch (error) {
      throw new TypeError(`Invalid elementConfig: ${error instanceof Error ? error.message : 'unknown error'}`)
    }
  }

  getConfigSchema(): z.ZodType<ConfigFromPortType<PortType.Array>> {
    return arrayPortSchema as z.ZodType<ConfigFromPortType<PortType.Array>>
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
