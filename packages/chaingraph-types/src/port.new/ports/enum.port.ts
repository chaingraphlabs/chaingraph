import type { ConfigFromPortType, PortConfig } from '../config/types'
import type { BasePortConstructor, BasePortSerializer, BasePortValidator } from '../registry/port-factory'
import { z } from 'zod'
import { Port } from '../base/port.base'
import { PortType } from '../config/constants'
import { PortFactory } from '../registry/port-factory'
import { enumPortSchema } from '../schemas/config'

/**
 * Enum port implementation
 */
export class EnumPort extends Port<ConfigFromPortType<PortType.Enum>, string> {
  constructor(config: ConfigFromPortType<PortType.Enum>) {
    super(config)
  }

  getConfigSchema(): z.ZodType<ConfigFromPortType<PortType.Enum>> {
    return enumPortSchema as z.ZodType<ConfigFromPortType<PortType.Enum>>
  }

  getValueSchema(): z.ZodType<string> {
    // Value must be one of the option ids
    const validIds = this.config.options.map(option => option.id).filter((id): id is string => id !== undefined)
    return z.string().refine(
      value => validIds.includes(value),
      `Value must be one of the valid option ids: ${validIds.join(', ')}`,
    )
  }

  setValue(value: string): void {
    // Validate that the value is a valid option id
    const validIds = this.config.options.map(option => option.id).filter((id): id is string => id !== undefined)
    if (!validIds.includes(value)) {
      throw new TypeError(`Invalid option id. Must be one of: ${validIds.join(', ')}`)
    }

    super.setValue(value)
  }

  /**
   * Get the selected option configuration
   */
  getSelectedOption(): PortConfig | undefined {
    if (!this.hasValue()) {
      return undefined
    }
    return this.config.options.find(option => option.id === this.getValue())
  }

  toString(): string {
    if (!this.hasValue()) {
      return 'EnumPort(undefined)'
    }
    const selectedOption = this.getSelectedOption()
    return `EnumPort(${selectedOption?.title || selectedOption?.id || this.getValue()})`
  }
}

/**
 * Enum port validator
 */
const enumPortValidator: BasePortValidator = {
  getSchema: (config: PortConfig) => {
    if (config.type !== PortType.Enum) {
      throw new TypeError('Invalid config type')
    }
    const port = new EnumPort(config)
    return port.getValueSchema()
  },
  validate: (value: unknown, config: PortConfig) => {
    if (config.type !== PortType.Enum) {
      return false
    }
    const port = new EnumPort(config)
    try {
      port.setValue(value as string)
      return true
    } catch {
      return false
    }
  },
}

/**
 * Enum port serializer
 */
const enumPortSerializer: BasePortSerializer = {
  serialize: (value: unknown, config: PortConfig) => {
    if (config.type !== PortType.Enum) {
      throw new TypeError('Invalid config type')
    }
    return value
  },
  deserialize: (value: unknown, config: PortConfig) => {
    if (config.type !== PortType.Enum) {
      throw new TypeError('Invalid config type')
    }
    return value
  },
}

/**
 * Register enum port in the factory
 */
export function registerEnumPort(): void {
  PortFactory.register(PortType.Enum, {
    constructor: EnumPort as unknown as BasePortConstructor,
    validator: enumPortValidator,
    serializer: enumPortSerializer,
  })
}
