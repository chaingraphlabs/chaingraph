import type { ConfigFromPortType, PortConfig } from '../config/types'
import type { BasePortConstructor, BasePortSerializer, BasePortValidator } from '../registry/port-factory'
import { z } from 'zod'
import { Port } from '../base/port.base'
import { PortDirection, PortType } from '../config/constants'
import { PortFactory } from '../registry/port-factory'

/**
 * String port implementation
 */
export class StringPort extends Port<ConfigFromPortType<PortType.String>, string> {
  constructor(config: ConfigFromPortType<PortType.String>) {
    super(config)
  }

  getConfigSchema(): z.ZodType<ConfigFromPortType<PortType.String>> {
    return z.object({
      type: z.literal(PortType.String),
      validation: z.object({
        minLength: z.number().int().min(0).optional(),
        maxLength: z.number().int().min(0).optional(),
      }).optional(),
      defaultValue: z.string().optional(),
      id: z.string().optional(),
      title: z.string().optional(),
      description: z.string().optional(),
      direction: z.nativeEnum(PortDirection).optional(),
      optional: z.boolean().optional(),
      metadata: z.record(z.unknown()).optional(),
    }) as z.ZodType<ConfigFromPortType<PortType.String>>
  }

  getValueSchema(): z.ZodType<string> {
    let schema = z.string()

    if (this.config.validation) {
      const { minLength, maxLength } = this.config.validation
      if (typeof minLength === 'number') {
        schema = schema.min(minLength)
      }
      if (typeof maxLength === 'number') {
        schema = schema.max(maxLength)
      }
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
 * Register string port
 */
PortFactory.register(PortType.String, {
  constructor: StringPort as unknown as BasePortConstructor,
  validator: stringPortValidator,
  serializer: stringPortSerializer,
})
