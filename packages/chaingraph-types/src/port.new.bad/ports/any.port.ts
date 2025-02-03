import type { ConfigFromPortType, PortConfig } from '../config/types'
import type { BasePortConstructor, BasePortSerializer, BasePortValidator } from '../registry/port-factory'
import { z } from 'zod'
import { Port } from '../base/port.base'
import { PortType } from '../config/constants'
import { PortFactory } from '../registry/port-factory'
import { anyPortSchema } from '../schemas/config'

/**
 * Any port implementation
 */
export class AnyPort extends Port<ConfigFromPortType<PortType.Any>, unknown> {
  constructor(config: ConfigFromPortType<PortType.Any>) {
    super(config)
  }

  getConfigSchema(): z.ZodType<ConfigFromPortType<PortType.Any>> {
    return anyPortSchema as z.ZodType<ConfigFromPortType<PortType.Any>>
  }

  getValueSchema(): z.ZodType<unknown> {
    // If we have an internal type, use its schema for validation
    if (this.config.internalType) {
      const port = PortFactory.create(this.config.internalType)
      return port.getValueSchema()
    }
    // Otherwise accept any value
    return z.unknown()
  }

  setValue(value: unknown): void {
    // If we have an internal type, validate against it
    if (this.config.internalType) {
      const port = PortFactory.create(this.config.internalType)
      try {
        port.setValue(value)
      } catch (error) {
        throw new TypeError(`Invalid value for internal type: ${error instanceof Error ? error.message : 'unknown error'}`)
      }
    }

    super.setValue(value)
  }

  toString(): string {
    return `AnyPort(${this.hasValue() ? JSON.stringify(this.getValue()) : 'undefined'})`
  }
}

/**
 * Any port validator
 */
const anyPortValidator: BasePortValidator = {
  getSchema: (config: PortConfig) => {
    if (config.type !== PortType.Any) {
      throw new TypeError('Invalid config type')
    }
    const port = new AnyPort(config)
    return port.getValueSchema()
  },
  validate: (value: unknown, config: PortConfig) => {
    if (config.type !== PortType.Any) {
      return false
    }
    const port = new AnyPort(config)
    try {
      port.setValue(value)
      return true
    } catch {
      return false
    }
  },
}

/**
 * Any port serializer
 */
const anyPortSerializer: BasePortSerializer = {
  serialize: (value: unknown, config: PortConfig) => {
    if (config.type !== PortType.Any) {
      throw new TypeError('Invalid config type')
    }
    // If we have an internal type, use its serializer
    if (config.internalType) {
      const serializer = PortFactory.getSerializer(config.internalType.type)
      return serializer.serialize(value, config.internalType)
    }
    return value
  },
  deserialize: (value: unknown, config: PortConfig) => {
    if (config.type !== PortType.Any) {
      throw new TypeError('Invalid config type')
    }
    // If we have an internal type, use its deserializer
    if (config.internalType) {
      const serializer = PortFactory.getSerializer(config.internalType.type)
      return serializer.deserialize(value, config.internalType)
    }
    return value
  },
}

/**
 * Register any port in the factory
 */
export function registerAnyPort(): void {
  PortFactory.register(PortType.Any, {
    constructor: AnyPort as unknown as BasePortConstructor,
    validator: anyPortValidator,
    serializer: anyPortSerializer,
  })
}
