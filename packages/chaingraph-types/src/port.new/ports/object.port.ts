import type { SerializedPortData } from '../base/port.interface'
import type { ConfigFromPortType, PortConfig } from '../config/types'
import type { BasePortConstructor, BasePortSerializer, BasePortValidator } from '../registry/port-factory'
import { z } from 'zod'
import { Port } from '../base/port.base'
import { PortType } from '../config/constants'
import { PortFactory } from '../registry/port-factory'
import { objectPortSchema } from '../schemas'

/**
 * Object port implementation
 */
export class ObjectPort<T extends Record<string, unknown> = Record<string, unknown>> extends Port<ConfigFromPortType<PortType.Object>, T> {
  constructor(config: ConfigFromPortType<PortType.Object>) {
    // Validate object-specific configuration
    const result = objectPortSchema.safeParse(config)
    if (!result.success) {
      throw new TypeError(`Invalid object port configuration: ${result.error.message}`)
    }

    // Additional validation for property types through PortFactory
    for (const [key, propertyConfig] of Object.entries(config.schema.properties)) {
      try {
        PortFactory.getSchema(propertyConfig)
      } catch (error) {
        throw new TypeError(`Invalid property config for "${key}": ${error instanceof Error ? error.message : 'unknown error'}`)
      }
    }

    super(config)
  }

  getConfigSchema(): z.ZodType<ConfigFromPortType<PortType.Object>> {
    return objectPortSchema as z.ZodType<ConfigFromPortType<PortType.Object>>
  }

  getValueSchema(): z.ZodType<T> {
    const propertySchemas: Record<string, z.ZodType<unknown>> = {}

    for (const [key, propertyConfig] of Object.entries(this.config.schema.properties)) {
      const schema = PortFactory.getSchema(propertyConfig)
      propertySchemas[key] = schema.optional()
    }

    return z.object(propertySchemas).passthrough() as unknown as z.ZodType<T>
  }

  setValue(value: T): void {
    if (typeof value !== 'object' || value === null || Array.isArray(value)) {
      throw new TypeError('Value must be an object')
    }

    // Validate each property
    for (const [key, propertyValue] of Object.entries(value)) {
      const propertyConfig = this.config.schema.properties[key]
      if (propertyConfig && propertyValue !== undefined && !PortFactory.validate(propertyValue, propertyConfig)) {
        throw new TypeError(`Invalid value for property "${key}"`)
      }
    }

    super.setValue(value)
  }

  serialize(): SerializedPortData {
    const serialized = super.serialize()

    if (serialized.value) {
      const value = serialized.value as T
      const serializedValue: Record<string, unknown> = {}

      for (const [key, propertyValue] of Object.entries(value)) {
        const propertyConfig = this.config.schema.properties[key]
        if (propertyConfig && propertyValue !== undefined) {
          serializedValue[key] = PortFactory.serialize(propertyValue, propertyConfig)
        }
      }

      serialized.value = serializedValue
    }

    return serialized
  }

  deserialize(data: SerializedPortData): ObjectPort<T> {
    const port = super.deserialize(data) as ObjectPort<T>

    if (data.value) {
      const value = data.value as Record<string, unknown>
      const deserializedValue: Record<string, unknown> = {}

      for (const [key, propertyValue] of Object.entries(value)) {
        const propertyConfig = this.config.schema.properties[key]
        if (propertyConfig && propertyValue !== undefined) {
          deserializedValue[key] = PortFactory.deserialize(propertyValue, propertyConfig)
        }
      }

      port.setValue(deserializedValue as T)
    }

    return port
  }

  toString(): string {
    return `ObjectPort(${this.hasValue() ? JSON.stringify(this.getValue()) : 'undefined'})`
  }
}

/**
 * Object port validator
 */
const objectPortValidator: BasePortValidator = {
  getSchema: (config: PortConfig) => {
    if (config.type !== PortType.Object) {
      throw new TypeError('Invalid config type')
    }
    const port = new ObjectPort(config as ConfigFromPortType<PortType.Object>)
    return port.getValueSchema()
  },
  validate: (value: unknown, config: PortConfig) => {
    if (config.type !== PortType.Object) {
      return false
    }
    const port = new ObjectPort(config as ConfigFromPortType<PortType.Object>)
    try {
      port.setValue(value as Record<string, unknown>)
      return true
    } catch {
      return false
    }
  },
}

/**
 * Object port serializer
 */
const objectPortSerializer: BasePortSerializer = {
  serialize: (value: unknown, config: PortConfig) => {
    if (config.type !== PortType.Object) {
      throw new TypeError('Invalid config type')
    }
    const port = new ObjectPort(config as ConfigFromPortType<PortType.Object>)
    port.setValue(value as Record<string, unknown>)
    return port.serialize().value
  },
  deserialize: (value: unknown, config: PortConfig) => {
    if (config.type !== PortType.Object) {
      throw new TypeError('Invalid config type')
    }
    const port = new ObjectPort(config as ConfigFromPortType<PortType.Object>)
    return port.deserialize({ config, value }).getValue()
  },
}

/**
 * Register object port in the factory
 */
export function registerObjectPort(): void {
  PortFactory.register(PortType.Object, {
    constructor: ObjectPort as unknown as BasePortConstructor,
    validator: objectPortValidator,
    serializer: objectPortSerializer,
  })
}
