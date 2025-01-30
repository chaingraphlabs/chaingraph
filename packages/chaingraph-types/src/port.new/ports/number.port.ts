import type { IPort, SerializedPortData } from '../base/port.interface'
import type { ConfigFromPortType, PortConfig } from '../config/types'
import type { BasePortConstructor, BasePortSerializer, BasePortValidator } from '../registry/port-factory'
import { z } from 'zod'
import { Port } from '../base/port.base'
import { PortDirection, PortType } from '../config/constants'
import { PortFactory } from '../registry/port-factory'

/**
 * Number port implementation
 */
export class NumberPort extends Port<ConfigFromPortType<PortType.Number>, number> {
  constructor(config: ConfigFromPortType<PortType.Number>) {
    super(config)
  }

  getConfigSchema(): z.ZodType<ConfigFromPortType<PortType.Number>> {
    return z.object({
      type: z.literal(PortType.Number),
      validation: z.object({
        min: z.number().optional(),
        max: z.number().optional(),
        integer: z.boolean().optional(),
      }).optional(),
      defaultValue: z.number().optional(),
      id: z.string().optional(),
      title: z.string().optional(),
      description: z.string().optional(),
      direction: z.nativeEnum(PortDirection).optional(),
      optional: z.boolean().optional(),
      metadata: z.record(z.unknown()).optional(),
    }) as z.ZodType<ConfigFromPortType<PortType.Number>>
  }

  getValueSchema(): z.ZodType<number> {
    let schema = z.number()

    if (this.config.validation) {
      const { min, max, integer } = this.config.validation
      if (typeof min === 'number') {
        schema = schema.min(min)
      }
      if (typeof max === 'number') {
        schema = schema.max(max)
      }
      if (integer) {
        schema = schema.int()
      }
    }

    return schema
  }

  setValue(value: number): void {
    if (typeof value !== 'number' || Number.isNaN(value)) {
      throw new TypeError('Value must be a valid number')
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
    return `NumberPort(${this.hasValue() ? this.getValue().toString() : 'undefined'})`
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
    if (typeof value !== 'number' || Number.isNaN(value)) {
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
    if (typeof value !== 'number' || Number.isNaN(value)) {
      throw new TypeError('Value must be a valid number')
    }
    return value
  },
  deserialize: (value: unknown, config: PortConfig) => {
    if (config.type !== PortType.Number) {
      throw new TypeError('Invalid config type')
    }
    if (typeof value !== 'number' || Number.isNaN(value)) {
      throw new TypeError('Value must be a valid number')
    }
    return value
  },
}

/**
 * Register number port
 */
PortFactory.register(PortType.Number, {
  constructor: NumberPort as unknown as BasePortConstructor,
  validator: numberPortValidator,
  serializer: numberPortSerializer,
})
