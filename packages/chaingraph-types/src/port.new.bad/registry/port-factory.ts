import type { z } from 'zod'
import type { IPort } from '../base/port.interface'
import type { PortType } from '../config/constants'
import type { PortConfig } from '../config/types'
import type { ValueTypeFromPortType } from '../config/value-types'

/**
 * Base port registration interfaces
 */
export interface BasePortValidator {
  getSchema: (config: PortConfig) => z.ZodType
  validate: (value: unknown, config: PortConfig) => boolean
}

export interface BasePortSerializer {
  serialize: (value: unknown, config: PortConfig) => unknown
  deserialize: (value: unknown, config: PortConfig) => unknown
}

export interface BasePortConstructor {
  new (config: PortConfig): IPort<PortConfig, unknown>
}

/**
 * Port registration data
 */
export interface PortRegistration {
  constructor: BasePortConstructor
  validator: BasePortValidator
  serializer: BasePortSerializer
}

/**
 * Factory for creating and managing port instances
 */
export class PortFactory {
  private static readonly registry = new Map<PortType, PortRegistration>()

  /**
   * Register port type with its constructor, validator, and serializer
   */
  public static register(type: PortType, registration: PortRegistration): void {
    this.registry.set(type, registration)
  }

  /**
   * Create port instance
   */
  public static create<T extends PortConfig>(config: T): IPort<T, ValueTypeFromPortType<T['type']>> {
    const entry = this.registry.get(config.type)
    if (!entry) {
      throw new Error(`No port registration found for type '${config.type}'`)
    }
    return new entry.constructor(config) as IPort<T, ValueTypeFromPortType<T['type']>>
  }

  /**
   * Get validator for port type
   */
  public static getValidator(type: PortType): BasePortValidator {
    const entry = this.registry.get(type)
    if (!entry) {
      throw new Error(`No validator found for type '${type}'`)
    }
    return entry.validator
  }

  /**
   * Get serializer for port type
   */
  public static getSerializer(type: PortType): BasePortSerializer {
    const entry = this.registry.get(type)
    if (!entry) {
      throw new Error(`No serializer found for type '${type}'`)
    }
    return entry.serializer
  }

  /**
   * Check if port type is registered
   */
  public static isRegistered(type: PortType): boolean {
    return this.registry.has(type)
  }

  /**
   * Get schema for port type
   */
  public static getSchema(config: PortConfig): z.ZodType {
    return this.getValidator(config.type).getSchema(config)
  }

  /**
   * Validate value for port type
   */
  public static validate(value: unknown, config: PortConfig): boolean {
    return this.getValidator(config.type).validate(value, config)
  }

  /**
   * Serialize value for port type
   */
  public static serialize(value: unknown, config: PortConfig): unknown {
    return this.getSerializer(config.type).serialize(value, config)
  }

  /**
   * Deserialize value for port type
   */
  public static deserialize(value: unknown, config: PortConfig): unknown {
    return this.getSerializer(config.type).deserialize(value, config)
  }

  /**
   * Clear all registrations (useful for testing)
   */
  public static clear(): void {
    this.registry.clear()
  }
}
