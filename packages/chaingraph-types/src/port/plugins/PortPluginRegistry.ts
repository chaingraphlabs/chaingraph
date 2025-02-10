/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type {
  ConfigTypeMap,
  IPortConfig,
  IPortPlugin,
  IPortValue,
  PortType,
  ValueTypeMap,
} from '../../port/base'

import { z } from 'zod'
import {
  AnyPortPlugin,
  ArrayPortPlugin,
  basePortConfigSchema,
  BooleanPortPlugin,
  buildUnion,
  EnumPortPlugin,
  NumberPortPlugin,
  ObjectPortPlugin,
  PortError,
  PortErrorType,
  StreamPortPlugin,
  StringPortPlugin,
} from '../../port'

const defaultValueSchema = z.string()

/**
 * Registry for port plugins
 */
export class PortPluginRegistry {
  // singleton instance
  private static instance: PortPluginRegistry

  private plugins = new Map<PortType, IPortPlugin<any>>()

  // singleton instance getter
  static getInstance(): PortPluginRegistry {
    if (!PortPluginRegistry.instance) {
      PortPluginRegistry.instance = new PortPluginRegistry()
    }
    return PortPluginRegistry.instance
  }

  /**
   * Register a plugin for a specific port type
   */
  register<T extends PortType>(plugin: IPortPlugin<T>): void {
    if (!plugin || !plugin.typeIdentifier) {
      console.warn('Plugin does not have a type identifier', plugin)
      return
    }
    // if (this.plugins.has(plugin.typeIdentifier)) {
    //   throw new PortError(
    //     PortErrorType.RegistryError,
    //     `Plugin for type "${plugin.typeIdentifier}" is already registered`,
    //   )
    // }
    this.plugins.set(plugin.typeIdentifier, plugin)
  }

  /**
   * Get a plugin for a specific port type
   */
  getPlugin<T extends PortType>(type: T): IPortPlugin<T> | undefined {
    const registeredPlugin = this.plugins.get(type) as IPortPlugin<T> | undefined
    if (!registeredPlugin) {
      // check from all plugins
      const plugin = this.getAllPlugins().find(p => p && p.typeIdentifier === type)
      if (plugin) {
        this.register(plugin)
        return plugin
      } else {
        return undefined
      }
    }

    return registeredPlugin
  }

  /**
   * Get all registered plugins
   */
  getAllPlugins(): IPortPlugin<any>[] {
    // return Array.from(this.plugins.values())
    return [
      StringPortPlugin,
      NumberPortPlugin,
      ArrayPortPlugin,
      ObjectPortPlugin,
      EnumPortPlugin,
      StreamPortPlugin,
      AnyPortPlugin,
      BooleanPortPlugin,
    ]
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
    return buildUnion(schemas, basePortConfigSchema)
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
  serializeValue<T extends PortType>(value: ValueTypeMap[T], config: ConfigTypeMap[T]): unknown {
    const plugin = this.getPlugin(value.type as T)
    if (!plugin) {
      throw new PortError(
        PortErrorType.SerializationError,
        `No plugin found for type "${value.type}"`,
      )
    }
    return plugin.serializeValue(value, config)
  }

  /**
   * Deserialize a port value
   */
  deserializeValue<T extends PortType>(type: T, data: unknown, config: ConfigTypeMap[T]): ValueTypeMap[T] {
    const plugin = this.getPlugin(type)
    if (!plugin) {
      throw new PortError(
        PortErrorType.SerializationError,
        `No plugin found for type "${type}"`,
      )
    }
    return plugin.deserializeValue(data, config)
  }

  /**
   * Serialize a port configuration
   */
  serializeConfig<T extends PortType>(config: ConfigTypeMap[T]): unknown {
    const plugin = this.getPlugin(config.type as T)
    if (!plugin) {
      throw new PortError(
        PortErrorType.SerializationError,
        `No plugin found for type "${config.type}"`,
      )
    }
    return plugin.serializeConfig(config)
  }

  cloneConfig<T extends PortType>(config: ConfigTypeMap[T]): ConfigTypeMap[T] {
    const plugin = this.getPlugin(config.type as T)
    if (!plugin) {
      throw new PortError(
        PortErrorType.SerializationError,
        `No plugin found for type "${config.type}"`,
      )
    }
    const serialized = this.serializeConfig(config)
    return this.deserializeConfig(config.type, serialized) as ConfigTypeMap[T]
  }

  /**
   * Deserialize a port configuration
   */
  deserializeConfig<T extends PortType>(type: T, data: unknown): ConfigTypeMap[T] {
    const plugin = this.getPlugin(type)
    if (!plugin) {
      throw new PortError(
        PortErrorType.SerializationError,
        `No plugin found for type "${type}"`,
      )
    }
    return plugin.deserializeConfig(data)
  }
}

/**
 * Global port registry instance
 */
export const portRegistry = PortPluginRegistry.getInstance()
