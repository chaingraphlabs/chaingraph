import type {
  IPortConfig,
  IPortPlugin,
  IPortValue,
  PortType,
  RegistryPlugin,
} from '../base/types'
import { z } from 'zod'
import {
  asRegistryPlugin,
  buildUnion,
  PortError,
  PortErrorType,
} from '../base/types'

// Create default schemas that match the expected types but never validate
const defaultConfigSchema = z.object({
  type: z.literal('string'),
  id: z.string().optional(),
  name: z.string().optional(),
  metadata: z.record(z.unknown()).optional(),
}).transform(() => {
  throw new Error('Default schema should never match')
}) as z.ZodType<IPortConfig>

const defaultValueSchema = z.object({
  type: z.literal('string'),
  value: z.string(),
}).transform(() => {
  throw new Error('Default schema should never match')
}) as z.ZodType<IPortValue>

/**
 * Registry for port plugins
 */
export class PortRegistry {
  private plugins = new Map<PortType, RegistryPlugin>()

  /**
   * Register a plugin for a specific port type
   */
  register<T extends PortType>(plugin: IPortPlugin<T>): void {
    if (this.plugins.has(plugin.typeIdentifier)) {
      throw new PortError(
        PortErrorType.RegistryError,
        `Plugin for type "${plugin.typeIdentifier}" is already registered`,
      )
    }
    this.plugins.set(plugin.typeIdentifier, asRegistryPlugin(plugin))
  }

  /**
   * Get a plugin for a specific port type
   */
  getPlugin(type: PortType): RegistryPlugin | undefined {
    return this.plugins.get(type)
  }

  /**
   * Get all registered plugins
   */
  getAllPlugins(): RegistryPlugin[] {
    return Array.from(this.plugins.values())
  }

  /**
   * Clear all registered plugins (for testing)
   */
  clear(): void {
    this.plugins.clear()
  }

  /**
   * Get a union schema for all registered config types
   */
  getConfigUnionSchema(): z.ZodType<IPortConfig> {
    const schemas = this.getAllPlugins().map(plugin => plugin.configSchema)
    return buildUnion(schemas, defaultConfigSchema)
  }

  /**
   * Get a union schema for all registered value types
   */
  getValueUnionSchema(): z.ZodType<IPortValue> {
    const schemas = this.getAllPlugins().map(plugin => plugin.valueSchema)
    return buildUnion(schemas, defaultValueSchema)
  }

  /**
   * Validate a port configuration
   */
  validateConfig(config: unknown): IPortConfig {
    const result = this.getConfigUnionSchema().safeParse(config)
    if (!result.success) {
      throw new PortError(
        PortErrorType.ValidationError,
        'Invalid port configuration',
        result.error,
      )
    }
    return result.data
  }

  /**
   * Validate a port value
   */
  validateValue(value: unknown): IPortValue {
    const result = this.getValueUnionSchema().safeParse(value)
    if (!result.success) {
      throw new PortError(
        PortErrorType.ValidationError,
        'Invalid port value',
        result.error,
      )
    }
    return result.data
  }

  /**
   * Serialize a port value
   */
  serializeValue<T extends PortType>(value: IPortValue & { type: T }): unknown {
    const plugin = this.getPlugin(value.type)
    if (!plugin) {
      throw new PortError(
        PortErrorType.SerializationError,
        `No plugin found for type "${value.type}"`,
      )
    }
    return plugin.serializeValue(value)
  }

  /**
   * Deserialize a port value
   */
  deserializeValue<T extends PortType>(type: T, data: unknown): IPortValue & { type: T } {
    const plugin = this.getPlugin(type)
    if (!plugin) {
      throw new PortError(
        PortErrorType.SerializationError,
        `No plugin found for type "${type}"`,
      )
    }
    return plugin.deserializeValue(data) as IPortValue & { type: T }
  }
}

/**
 * Global port registry instance
 */
export const portRegistry = new PortRegistry()
