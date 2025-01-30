import type { z } from 'zod'
import type { ConfigFromPortType, PortConfig } from '../config/types'
import type { BasePortConstructor, BasePortSerializer, BasePortValidator } from '../registry/port-factory'
import { Port } from '../base/port.base'
import { PortType } from '../config/constants'
import { PortFactory } from '../registry/port-factory'
import {
  applyRangeValidation,
  hasRangeValidation,
  numberConfigSchema,
  numberValueSchema,
} from '../schemas'

/**
 * Number port implementation
 */
export class NumberPort extends Port<ConfigFromPortType<PortType.Number>, number> {
  constructor(config: ConfigFromPortType<PortType.Number>) {
    super(config)
  }

  getConfigSchema(): z.ZodType<ConfigFromPortType<PortType.Number>> {
    return numberConfigSchema as z.ZodType<ConfigFromPortType<PortType.Number>>
  }

  getValueSchema(): z.ZodType<number> {
    let schema = numberValueSchema

    if (hasRangeValidation(this.config)) {
      schema = applyRangeValidation(schema, this.config.validation)
    }

    return schema
  }

  setValue(value: number): void {
    if (typeof value !== 'number') {
      throw new TypeError('Value must be a number')
    }

    const schema = this.getValueSchema()
    try {
      schema.parse(value)
    } catch (error) {
      throw new TypeError(`Invalid number value: ${error instanceof Error ? error.message : 'unknown error'}`)
    }

    super.setValue(value)
  }

  toString(): string {
    return `NumberPort(${this.hasValue() ? this.getValue() : 'undefined'})`
  }
}

/**
 * Number port validator
 */
const numberPortValidator: BasePortValidator = {
  getSchema: (config: PortConfig) => {
    if (config.type !== PortType.Number) {
      throw new TypeError('Invalid config type')
    }
    const port = new NumberPort(config)
    return port.getValueSchema()
  },
  validate: (value: unknown, config: PortConfig) => {
    if (config.type !== PortType.Number) {
      return false
    }
    if (typeof value !== 'number') {
      return false
    }
    const port = new NumberPort(config)
    try {
      port.setValue(value)
      return true
    } catch {
      return false
    }
  },
}

/**
 * Number port serializer
 */
const numberPortSerializer: BasePortSerializer = {
  serialize: (value: unknown, config: PortConfig) => {
    if (config.type !== PortType.Number) {
      throw new TypeError('Invalid config type')
    }
    if (typeof value !== 'number') {
      throw new TypeError('Value must be a number')
    }
    return value
  },
  deserialize: (value: unknown, config: PortConfig) => {
    if (config.type !== PortType.Number) {
      throw new TypeError('Invalid config type')
    }
    if (typeof value !== 'number') {
      throw new TypeError('Value must be a number')
    }
    return value
  },
}

/**
 * Register number port in the factory
 */
export function registerNumberPort(): void {
  PortFactory.register(PortType.Number, {
    constructor: NumberPort as unknown as BasePortConstructor,
    validator: numberPortValidator,
    serializer: numberPortSerializer,
  })
}
