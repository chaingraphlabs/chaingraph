import { ERROR_MESSAGES } from '../config/constants'

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

export { PortValueSerializer } from './port-value-serializer'
