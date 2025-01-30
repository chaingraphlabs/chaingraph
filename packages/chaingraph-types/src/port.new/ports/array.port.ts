import type { SerializedPortData } from '../base/port.interface'
import type { ConfigFromPortType, PortConfig } from '../config/types'
import { z } from 'zod'
import { Port } from '../base/port.base'
import { PortDirection, PortType } from '../config/constants'
import { type BasePortConstructor, type BasePortSerializer, type BasePortValidator, PortFactory } from '../registry/port-factory'

/**
 * Array port implementation
 */
export class ArrayPort<T = unknown> extends Port<ConfigFromPortType<PortType.Array>, T[]> {
  constructor(config: ConfigFromPortType<PortType.Array>) {
    super(config)
  }

  getConfigSchema(): z.ZodType<ConfigFromPortType<PortType.Array>> {
    return z.object({
      type: z.literal(PortType.Array),
      elementConfig: z.lazy(() => PortFactory.getSchema(this.config.elementConfig)),
      defaultValue: z.array(z.unknown()).optional(),
      id: z.string().optional(),
      title: z.string().optional(),
      description: z.string().optional(),
      direction: z.nativeEnum(PortDirection).optional(),
      optional: z.boolean().optional(),
      metadata: z.record(z.unknown()).optional(),
    }) as z.ZodType<ConfigFromPortType<PortType.Array>>
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

  deserialize(data: SerializedPortData): ArrayPort<T> {
    const port = super.deserialize(data) as ArrayPort<T>

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
    const port = new ArrayPort(config as ConfigFromPortType<PortType.Array>)
    return port.getValueSchema()
  },
  validate: (value: unknown, config: PortConfig) => {
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
    const port = new ArrayPort(config as ConfigFromPortType<PortType.Array>)
    port.setValue(value as any[])
    return port.serialize().value
  },
  deserialize: (value: unknown, config: PortConfig) => {
    const port = new ArrayPort(config as ConfigFromPortType<PortType.Array>)
    return port.deserialize({ config, value }).getValue()
  },
}

/**
 * Register array port
 */
PortFactory.register(PortType.Array, {
  constructor: ArrayPort as unknown as BasePortConstructor,
  validator: arrayPortValidator,
  serializer: arrayPortSerializer,
})
