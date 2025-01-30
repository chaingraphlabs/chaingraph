import type { ConfigFromPortType, PortConfig } from '../config/types'
import type { BasePortConstructor, BasePortSerializer, BasePortValidator } from '../registry/port-factory'
import { z } from 'zod'
import { Port } from '../base/port.base'
import { PortDirection, PortType } from '../config/constants'
import { PortFactory } from '../registry/port-factory'

/**
 * Boolean port implementation
 */
export class BooleanPort extends Port<ConfigFromPortType<PortType.Boolean>, boolean> {
  constructor(config: ConfigFromPortType<PortType.Boolean>) {
    super(config)
  }

  getConfigSchema(): z.ZodType<ConfigFromPortType<PortType.Boolean>> {
    return z.object({
      type: z.literal(PortType.Boolean),
      defaultValue: z.boolean().optional(),
      id: z.string().optional(),
      title: z.string().optional(),
      description: z.string().optional(),
      direction: z.nativeEnum(PortDirection).optional(),
      optional: z.boolean().optional(),
      metadata: z.record(z.unknown()).optional(),
    })
  }

  getValueSchema(): z.ZodType<boolean> {
    return z.boolean()
  }

  setValue(value: boolean): void {
    if (typeof value !== 'boolean') {
      throw new TypeError('Value must be a boolean')
    }
    super.setValue(value)
  }

  toString(): string {
    return `BooleanPort(${this.hasValue() ? this.getValue().toString() : 'undefined'})`
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
    return typeof value === 'boolean'
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
