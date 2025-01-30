import type { ConfigFromPortType, PortConfig } from '../config/types'
import type { BasePortConstructor, BasePortSerializer, BasePortValidator } from '../registry/port-factory'
import { z } from 'zod'
import { Port } from '../base/port.base'
import { PortType } from '../config/constants'
import { PortFactory } from '../registry/port-factory'
import { booleanPortSchema } from '../schemas'

/**
 * Boolean port implementation
 */
export class BooleanPort extends Port<ConfigFromPortType<PortType.Boolean>, boolean> {
  constructor(config: ConfigFromPortType<PortType.Boolean>) {
    // Validate boolean-specific configuration
    const result = booleanPortSchema.safeParse(config)
    if (!result.success) {
      throw new TypeError(`Invalid boolean port configuration: ${result.error.message}`)
    }

    super(config)
  }

  getConfigSchema(): z.ZodType<ConfigFromPortType<PortType.Boolean>> {
    return booleanPortSchema as z.ZodType<ConfigFromPortType<PortType.Boolean>>
  }

  getValueSchema(): z.ZodType<boolean> {
    return z.boolean()
  }

  setValue(value: boolean): void {
    if (typeof value !== 'boolean') {
      throw new TypeError('Value must be a boolean')
    }

    const schema = this.getValueSchema()
    try {
      schema.parse(value)
    } catch (error) {
      throw new TypeError(`Invalid boolean value: ${error instanceof Error ? error.message : 'unknown error'}`)
    }

    super.setValue(value)
  }

  toString(): string {
    return `BooleanPort(${this.hasValue() ? this.getValue() : 'undefined'})`
  }
}

/**
 * Boolean port validator
 */
const booleanPortValidator: BasePortValidator = {
  getSchema: (config: PortConfig) => {
    if (config.type !== PortType.Boolean) {
      throw new TypeError('Invalid config type')
    }
    const port = new BooleanPort(config)
    return port.getValueSchema()
  },
  validate: (value: unknown, config: PortConfig) => {
    if (config.type !== PortType.Boolean) {
      return false
    }
    if (typeof value !== 'boolean') {
      return false
    }
    const port = new BooleanPort(config)
    try {
      port.setValue(value)
      return true
    } catch {
      return false
    }
  },
}

/**
 * Boolean port serializer
 */
const booleanPortSerializer: BasePortSerializer = {
  serialize: (value: unknown, config: PortConfig) => {
    if (config.type !== PortType.Boolean) {
      throw new TypeError('Invalid config type')
    }
    if (typeof value !== 'boolean') {
      throw new TypeError('Value must be a boolean')
    }
    return value
  },
  deserialize: (value: unknown, config: PortConfig) => {
    if (config.type !== PortType.Boolean) {
      throw new TypeError('Invalid config type')
    }
    if (typeof value !== 'boolean') {
      throw new TypeError('Value must be a boolean')
    }
    return value
  },
}

/**
 * Register boolean port in the factory
 */
export function registerBooleanPort(): void {
  PortFactory.register(PortType.Boolean, {
    constructor: BooleanPort as unknown as BasePortConstructor,
    validator: booleanPortValidator,
    serializer: booleanPortSerializer,
  })
}
