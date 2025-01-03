import type { Decimal } from 'decimal.js'
import type { IPort } from '../interface'
import type {
  BooleanPortConfig,
  NumberPortConfig,
  StringPortConfig,
} from '../scalar'
import type { PortConfig, PortType } from '../types'
import type { PortCreator, PortTypeMap } from './types'
import { ArrayPort, type ArrayPortConfig } from '../array'
import { ObjectPort, type ObjectPortConfig } from '../object'
import {
  BooleanPort,
  NumberPort,
  StringPort,
} from '../scalar'

export class PortFactory {
  private static registry = new Map<PortType, PortCreator<keyof PortTypeMap>>()

  /**
   * Initialize the factory with default port types
   */
  static initialize(): void {
    // Register scalar ports with proper typing
    this.register('string', (config: PortConfig) => new StringPort(config as StringPortConfig))
    this.register('number', (config: PortConfig) => new NumberPort(config as NumberPortConfig))
    this.register('boolean', (config: PortConfig) => new BooleanPort(config as BooleanPortConfig))

    // Register complex ports
    this.register('array', (config: PortConfig) => new ArrayPort(config as ArrayPortConfig))
    this.register('object', (config: PortConfig) => new ObjectPort(config as ObjectPortConfig))
  }

  /**
   * Register a new port type
   */
  static register<T extends keyof PortTypeMap>(
    type: T,
    creator: PortCreator<T>,
  ): void {
    if (this.registry.has(type)) {
      throw new Error(`Port type '${type}' is already registered`)
    }
    this.registry.set(type, creator as PortCreator<keyof PortTypeMap>)
  }

  /**
   * Create a port instance
   */
  static createPort<T extends keyof PortTypeMap>(
    config: PortConfig & { type: T },
  ): IPort<PortTypeMap[T]> {
    const creator = this.registry.get(config.type)
    if (!creator) {
      throw new Error(`No creator registered for port type '${config.type}'`)
    }

    return creator(config) as IPort<PortTypeMap[T]>
  }

  /**
   * Create a string port
   */
  static createStringPort(
    config: Omit<PortConfig, 'type'>,
  ): IPort<string> {
    return this.createPort({ ...config, type: 'string' })
  }

  /**
   * Create a number port
   */
  static createNumberPort(
    config: Omit<PortConfig, 'type'>,
  ): IPort<Decimal> {
    return this.createPort({ ...config, type: 'number' })
  }

  /**
   * Create a boolean port
   */
  static createBooleanPort(
    config: Omit<PortConfig, 'type'>,
  ): IPort<boolean> {
    return this.createPort({ ...config, type: 'boolean' })
  }

  /**
   * Create an array port
   */
  static createArrayPort<T>(
    config: Omit<PortConfig, 'type'>,
  ): IPort<T[]> {
    return this.createPort({ ...config, type: 'array' })
  }

  /**
   * Create an object port
   */
  static createObjectPort(
    config: Omit<PortConfig, 'type'>,
  ): IPort<Record<string, unknown>> {
    return this.createPort({ ...config, type: 'object' })
  }

  /**
   * Check if a port type is registered
   */
  static hasType(type: PortType): boolean {
    return this.registry.has(type)
  }

  /**
   * Get all registered port types
   */
  static getRegisteredTypes(): PortType[] {
    return Array.from(this.registry.keys())
  }

  /**
   * Clear all registered port types
   */
  static clear(): void {
    this.registry.clear()
  }
}

// Initialize the factory with default port types
PortFactory.initialize()
