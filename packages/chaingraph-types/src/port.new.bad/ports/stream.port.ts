import type { ConfigFromPortType, PortConfig } from '../config/types'
import type { BasePortConstructor, BasePortSerializer, BasePortValidator } from '../registry/port-factory'
import { z } from 'zod'
import { Port } from '../base/port.base'
import { MultiChannel } from '../channel/multi-channel'
import { PortType } from '../config/constants'
import { PortFactory } from '../registry/port-factory'
import { streamPortSchema } from '../schemas'

/**
 * Stream port implementation
 */
export class StreamPort<T = unknown> extends Port<ConfigFromPortType<PortType.Stream>, MultiChannel<T>> {
  constructor(config: ConfigFromPortType<PortType.Stream>) {
    // Validate stream-specific configuration
    const result = streamPortSchema.safeParse(config)
    if (!result.success) {
      throw new TypeError(`Invalid stream port configuration: ${result.error.message}`)
    }

    // Additional validation for valueType through PortFactory
    try {
      PortFactory.getSchema(config.valueType)
    } catch (error) {
      throw new TypeError(`Invalid valueType: ${error instanceof Error ? error.message : 'unknown error'}`)
    }

    super({
      ...config,
      defaultValue: undefined,
    })
  }

  getConfigSchema(): z.ZodType<ConfigFromPortType<PortType.Stream>> {
    return streamPortSchema as z.ZodType<ConfigFromPortType<PortType.Stream>>
  }

  getValueSchema(): z.ZodType<MultiChannel<T>> {
    return z.instanceof(MultiChannel) as z.ZodType<MultiChannel<T>>
  }

  setValue(value: MultiChannel<T>): void {
    if (!(value instanceof MultiChannel)) {
      throw new TypeError('Value must be a MultiChannel instance')
    }

    // Validate each value in the channel's buffer
    const buffer = value.getBuffer()
    buffer.forEach((item, index) => {
      if (!PortFactory.validate(item, this.config.valueType)) {
        throw new TypeError(`Invalid stream value at index ${index}`)
      }
    })

    super.setValue(value)
  }

  toString(): string {
    return `StreamPort(${this.hasValue() ? 'active' : 'inactive'})`
  }
}

/**
 * Stream port validator
 */
const streamPortValidator: BasePortValidator = {
  getSchema: (config: PortConfig) => {
    if (config.type !== PortType.Stream) {
      throw new TypeError('Invalid config type')
    }
    const port = new StreamPort(config as ConfigFromPortType<PortType.Stream>)
    return port.getValueSchema()
  },
  validate: (value: unknown, config: PortConfig) => {
    if (config.type !== PortType.Stream) {
      return false
    }
    const port = new StreamPort(config as ConfigFromPortType<PortType.Stream>)
    try {
      port.setValue(value as MultiChannel<unknown>)
      return true
    } catch {
      return false
    }
  },
}

/**
 * Stream port serializer
 */
const streamPortSerializer: BasePortSerializer = {
  serialize: (value: unknown, config: PortConfig) => {
    if (config.type !== PortType.Stream) {
      throw new TypeError('Invalid config type')
    }
    const port = new StreamPort(config as ConfigFromPortType<PortType.Stream>)
    port.setValue(value as MultiChannel<unknown>)
    return port.serialize().value
  },
  deserialize: (value: unknown, config: PortConfig) => {
    if (config.type !== PortType.Stream) {
      throw new TypeError('Invalid config type')
    }
    const port = new StreamPort(config as ConfigFromPortType<PortType.Stream>)
    return port.deserialize({ config, value }).getValue()
  },
}

/**
 * Register stream port in the factory
 */
export function registerStreamPort(): void {
  PortFactory.register(PortType.Stream, {
    constructor: StreamPort as unknown as BasePortConstructor,
    validator: streamPortValidator,
    serializer: streamPortSerializer,
  })
}
