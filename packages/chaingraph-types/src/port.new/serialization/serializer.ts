import type { PortConfig } from '../config/types'
import { ERROR_MESSAGES, PortType } from '../config/constants'

/**
 * Serialized data structure
 */
export interface SerializedData {
  __type: string
  __version: number
  __data: unknown
}

/**
 * Base interface for serializable classes
 */
export interface Serializable {
  serialize: () => SerializedData
}

/**
 * Constructor interface for serializable classes
 */
export interface SerializableConstructor {
  new (...args: any[]): Serializable
  deserialize: (data: SerializedData) => Serializable
}

/**
 * Registry for managing serializable classes
 */
export class SerializationRegistry {
  private static instance: SerializationRegistry
  private classMap = new Map<string, SerializableConstructor>()
  private migrationMap = new Map<string, Array<(data: unknown) => unknown>>()

  private constructor() {}

  public static getInstance(): SerializationRegistry {
    if (!SerializationRegistry.instance) {
      SerializationRegistry.instance = new SerializationRegistry()
    }
    return SerializationRegistry.instance
  }

  /**
   * Register a serializable class
   */
  public registerClass(type: string, constructor: SerializableConstructor): void {
    this.classMap.set(type, constructor)
  }

  /**
   * Register a migration function for version updates
   */
  public registerMigration(type: string, fromVersion: number, migration: (data: unknown) => unknown): void {
    const migrations = this.migrationMap.get(type) || []
    migrations[fromVersion] = migration
    this.migrationMap.set(type, migrations)
  }

  /**
   * Deserialize data into a class instance
   */
  public deserialize(data: SerializedData): Serializable {
    const constructor = this.classMap.get(data.__type)
    if (!constructor) {
      throw new SerializationError(
        `${ERROR_MESSAGES.UNKNOWN_SERIALIZABLE_TYPE} ${data.__type}`,
      )
    }

    // Apply migrations if needed
    const migrations = this.migrationMap.get(data.__type)
    if (migrations && data.__version < migrations.length) {
      for (let v = data.__version; v < migrations.length; v++) {
        const migration = migrations[v]
        if (migration) {
          data.__data = migration(data.__data)
        }
      }
    }

    return constructor.deserialize(data)
  }
}

/**
 * Port value serializer class
 */
export class PortValueSerializer {
  private registry = SerializationRegistry.getInstance()

  /**
   * Serialize a port value based on its configuration
   */
  public serialize(config: PortConfig, value: unknown): unknown {
    switch (config.type) {
      case PortType.String:
      case PortType.Number:
      case PortType.Boolean:
        return value

      case PortType.Array:
        return Array.isArray(value)
          ? value.map(item => this.serialize(config.elementConfig, item))
          : value

      case PortType.Object:
        if (typeof value === 'object' && value !== null) {
          const result: Record<string, unknown> = {}
          for (const [key, propConfig] of Object.entries(config.schema.properties)) {
            const propValue = (value as Record<string, unknown>)[key]
            if (propValue !== undefined) {
              result[key] = this.serialize(propConfig, propValue)
            }
          }
          return result
        }
        return value

      case PortType.Enum:
        return value

      case PortType.Stream:
        if (this.isSerializable(value)) {
          return value.serialize()
        }
        return value

      case PortType.Any:
        if (this.isSerializable(value)) {
          return value.serialize()
        }
        return value

      default:
        throw new SerializationError(
          `${ERROR_MESSAGES.UNKNOWN_PORT_TYPE} ${(config as PortConfig).type}`,
        )
    }
  }

  /**
   * Deserialize a value based on port configuration
   */
  public deserialize(
    config: PortConfig,
    serializedValue: unknown,
  ): unknown {
    try {
      switch (config.type) {
        case PortType.String:
        case PortType.Number:
        case PortType.Boolean:
          return serializedValue

        case PortType.Array:
          if (Array.isArray(serializedValue)) {
            return serializedValue.map(item =>
              this.deserialize(config.elementConfig, item),
            )
          }
          return serializedValue

        case PortType.Object:
          if (typeof serializedValue === 'object' && serializedValue !== null) {
            const result: Record<string, unknown> = {}
            for (const [key, propConfig] of Object.entries(config.schema.properties)) {
              const propValue = (serializedValue as Record<string, unknown>)[key]
              if (propValue !== undefined) {
                result[key] = this.deserialize(propConfig, propValue)
              }
            }
            return result
          }
          return serializedValue

        case PortType.Enum:
          return serializedValue

        case PortType.Stream:
        case PortType.Any:
          if (this.isSerializedData(serializedValue)) {
            return this.registry.deserialize(serializedValue)
          }
          return serializedValue

        default:
          throw new SerializationError(
            `${ERROR_MESSAGES.UNKNOWN_PORT_TYPE} ${(config as PortConfig).type}`,
          )
      }
    } catch (error) {
      throw new SerializationError(
        ERROR_MESSAGES.DESERIALIZATION_FAILED,
        error instanceof Error ? error : undefined,
      )
    }
  }

  private isSerializedData(value: unknown): value is SerializedData {
    return (
      typeof value === 'object'
      && value !== null
      && '__type' in value
      && '__version' in value
      && '__data' in value
    )
  }

  private isSerializable(value: unknown): value is Serializable {
    return (
      typeof value === 'object'
      && value !== null
      && 'serialize' in value
      && typeof (value as Serializable).serialize === 'function'
    )
  }
}

/**
 * Error class for serialization issues
 */
export class SerializationError extends Error {
  constructor(
    message: string,
    public readonly originalError?: Error,
  ) {
    super(message)
    this.name = 'SerializationError'
  }
}
