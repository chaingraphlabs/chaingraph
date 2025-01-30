import type { ConfigFromPortType, PortConfig } from '../config/types'
import { PortType } from '../config/constants'
import {
  anyPortSchema,
  arrayPortSchema,
  booleanPortSchema,
  enumPortSchema,
  numberPortSchema,
  objectPortSchema,
  portConfigSchema,
  streamPortSchema,
  stringPortSchema,
} from '../schemas'

// Re-export schemas
export {
  anyPortSchema,
  arrayPortSchema,
  booleanPortSchema,
  enumPortSchema,
  numberPortSchema,
  objectPortSchema,
  portConfigSchema,
  streamPortSchema,
  stringPortSchema,
}

// Type guards
export function isPortType(value: unknown, expectedType?: PortType): boolean {
  // Direct type check for port type string
  if (typeof value === 'string' && value.startsWith('port:')) {
    return expectedType ? value === expectedType : true
  }

  // Port config check
  if (typeof value === 'object' && value !== null) {
    const config = value as { type?: unknown }

    // Check if it's a port config with a type
    if ('type' in config && typeof config.type === 'string') {
      return expectedType ? config.type === expectedType : true
    }
  }

  return false
}

export function isPortConfig(value: unknown): value is PortConfig {
  if (typeof value !== 'object' || value === null) {
    return false
  }
  const config = value as Record<string, unknown>
  return isPortType(config.type)
}

function validateDefaultValue(config: Record<string, unknown>): void {
  if ('defaultValue' in config && config.defaultValue !== undefined) {
    const portType = config.type as PortType
    const defaultValue = config.defaultValue

    switch (portType) {
      case PortType.String:
        if (typeof defaultValue !== 'string') {
          throw new TypeError(`Default value must be a string, got ${typeof defaultValue}`)
        }
        break
      case PortType.Number:
        if (typeof defaultValue !== 'number') {
          throw new TypeError(`Default value must be a number, got ${typeof defaultValue}`)
        }
        break
      case PortType.Boolean:
        if (typeof defaultValue !== 'boolean') {
          throw new TypeError(`Default value must be a boolean, got ${typeof defaultValue}`)
        }
        break
      case PortType.Object:
        if (typeof defaultValue !== 'object' || defaultValue === null) {
          throw new Error(`Default value must be an object, got ${typeof defaultValue}`)
        }
        // Validate nested object properties
        if ('schema' in config && typeof config.schema === 'object' && config.schema !== null) {
          const schema = config.schema as Record<string, unknown>
          if ('properties' in schema) {
            const properties = schema.properties as Record<string, unknown>
            const defaultObj = defaultValue as Record<string, unknown>
            for (const [key, prop] of Object.entries(properties)) {
              if (typeof prop === 'object' && prop !== null && 'type' in prop) {
                const propConfig = { type: prop.type, defaultValue: defaultObj[key] }
                validateDefaultValue(propConfig)
              }
            }
          }
        }
        break
      case PortType.Array:
        if (!Array.isArray(defaultValue)) {
          throw new TypeError(`Default value must be an array, got ${typeof defaultValue}`)
        }
        break
    }
  }
}

/**
 * Validate a port configuration
 * @throws {Error} if validation fails
 */
export function validatePortConfig<T extends PortConfig = PortConfig>(config: unknown): T {
  if (typeof config !== 'object' || config === null) {
    throw new Error('Config must be an object')
  }

  const portConfig = config as Record<string, unknown>
  validateDefaultValue(portConfig)

  const result = portConfigSchema.safeParse(config)
  if (!result.success) {
    throw new Error(result.error.message)
  }
  return result.data as T
}

/**
 * Validate a port configuration for a specific type
 * @throws {Error} if validation fails or type doesn't match
 */
export function validatePortConfigType<T extends PortType>(
  config: unknown,
  expectedType: T,
): ConfigFromPortType<T> {
  const result = portConfigSchema.safeParse(config)
  if (!result.success) {
    throw new Error(result.error.message)
  }

  const typedConfig = result.data as PortConfig
  if (typedConfig.type !== expectedType) {
    throw new Error(`Expected port type ${expectedType} but got ${typedConfig.type}`)
  }

  validateDefaultValue(typedConfig)
  return typedConfig as ConfigFromPortType<T>
}
