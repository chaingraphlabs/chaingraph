import type { SerializedPortData } from '../base/port.interface'
import type { ConfigFromPortType } from '../config/types'
import { z } from 'zod'
import { Port } from '../base/port.base'
import { PortType } from '../config/constants'
import { arrayPortSchema } from '../config/schemas'

/**
 * Array port implementation
 */
export class ArrayPort<T = unknown> extends Port<ConfigFromPortType<PortType.Array>, T[]> {
  constructor(config: ConfigFromPortType<PortType.Array>) {
    super(config)
  }

  getConfigSchema(): z.ZodType<ConfigFromPortType<PortType.Array>> {
    return arrayPortSchema as z.ZodType<ConfigFromPortType<PortType.Array>>
  }

  getValueSchema(): z.ZodType<T[]> {
    return z.array(this.getElementSchema())
  }

  private getElementSchema(): z.ZodType {
    const { elementConfig } = this.config

    // Handle nested arrays recursively
    if (elementConfig.type === PortType.Array) {
      const nestedPort = new ArrayPort(elementConfig)
      return nestedPort.getValueSchema()
    }

    // Create schema based on element type
    switch (elementConfig.type) {
      case PortType.String:
        return z.string()
      case PortType.Number:
        return z.number()
      case PortType.Boolean:
        return z.boolean()
      case PortType.Object:
        return z.record(z.unknown())
      default:
        return z.unknown()
    }
  }

  setValue(value: T[]): void {
    if (!Array.isArray(value)) {
      throw new TypeError('Value must be an array')
    }

    // Validate each element
    const elementSchema = this.getElementSchema()
    value.forEach((item, index) => {
      try {
        elementSchema.parse(item)
      } catch (error) {
        throw new TypeError(`Invalid array element at index ${index}`)
      }
    })

    super.setValue(value)
  }

  serialize(): SerializedPortData {
    const serialized = super.serialize()

    // Handle nested array serialization
    if (serialized.value && this.config.elementConfig.type === PortType.Array) {
      serialized.value = (serialized.value as T[]).map((item) => {
        const nestedPort = new ArrayPort(this.config.elementConfig as ConfigFromPortType<PortType.Array>)
        return nestedPort.serialize().value
      })
    }

    return serialized
  }

  deserialize(data: SerializedPortData): ArrayPort<T> {
    const port = super.deserialize(data) as ArrayPort<T>

    // Handle nested array deserialization
    if (data.value && this.config.elementConfig.type === PortType.Array) {
      const value = (data.value as unknown[]).map((item) => {
        const nestedPort = new ArrayPort(this.config.elementConfig as ConfigFromPortType<PortType.Array>)
        return nestedPort.deserialize({ config: this.config, value: item }).getValue()
      })
      port.setValue(value as T[])
    }

    return port
  }

  toString(): string {
    return `ArrayPort(${this.hasValue() ? JSON.stringify(this.getValue()) : 'undefined'})`
  }
}
