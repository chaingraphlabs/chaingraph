import type { ConfigFromPortType, PortConfig } from '../config/types'
import type { BasePortConstructor, BasePortSerializer, BasePortValidator } from '../registry/port-factory'
import { z } from 'zod'
import { Port } from '../base/port.base'
import { PortType } from '../config/constants'
import { PortFactory } from '../registry/port-factory'
import { applyLengthValidation, hasLengthValidation, stringPortSchema } from '../schemas'

/**
 * String port implementation
 */
export class StringPort extends Port<ConfigFromPortType<PortType.String>, string> {
  constructor(config: ConfigFromPortType<PortType.String>) {
    // Validate string-specific configuration
    const result = stringPortSchema.safeParse(config)
    if (!result.success) {
      throw new TypeError(`Invalid string port configuration: ${result.error.message}`)
    }

    super(config)
  }

  getConfigSchema(): z.ZodType<ConfigFromPortType<PortType.String>> {
    return stringPortSchema as z.ZodType<ConfigFromPortType<PortType.String>>
  }

  getValueSchema(): z.ZodType<string> {
    let schema = z.string()

    if (hasLengthValidation(this.config)) {
      schema = applyLengthValidation(schema, this.config.validation)
    }

    return schema
  }

  setValue(value: string): void {
    if (typeof value !== 'string') {
      throw new TypeError('Value must be a string')
    }

    const schema = this.getValueSchema()
    try {
      schema.parse(value)
    } catch (error) {
      throw new TypeError(`Invalid string value: ${error instanceof Error ? error.message : 'unknown error'}`)
    }

    super.setValue(value)
  }

  toString(): string {
    return `StringPort(${this.hasValue() ? `"${this.getValue()}"` : 'undefined'})`
  }
}

/**
 * String port validator
 */
const stringPortValidator: BasePortValidator = {
  getSchema: (config: PortConfig) => {
    if (config.type !== PortType.String) {
      throw new TypeError('Invalid config type')
    }
    const port = new StringPort(config)
    return port.getValueSchema()
  },
  validate: (value: unknown, config: PortConfig) => {
    if (config.type !== PortType.String) {
      return false
    }
    if (typeof value !== 'string') {
      return false
    }
    const port = new StringPort(config)
    try {
      port.setValue(value)
      return true
    } catch {
      return false
    }
  },
}

/**
 * String port serializer
 */
const stringPortSerializer: BasePortSerializer = {
  serialize: (value: unknown, config: PortConfig) => {
    if (config.type !== PortType.String) {
      throw new TypeError('Invalid config type')
    }
    if (typeof value !== 'string') {
      throw new TypeError('Value must be a string')
    }
    return value
  },
  deserialize: (value: unknown, config: PortConfig) => {
    if (config.type !== PortType.String) {
      throw new TypeError('Invalid config type')
    }
    if (typeof value !== 'string') {
      throw new TypeError('Value must be a string')
    }
    return value
  },
}

/**
 * Register string port in the factory
 */
export function registerStringPort(): void {
  PortFactory.register(PortType.String, {
    constructor: StringPort as unknown as BasePortConstructor,
    validator: stringPortValidator,
    serializer: stringPortSerializer,
  })
}
