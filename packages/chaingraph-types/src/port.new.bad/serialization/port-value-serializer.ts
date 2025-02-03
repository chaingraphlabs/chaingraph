import type { PortConfig } from '@chaingraph/types/port.new'
import type {
  Serializable,
  SerializedData,
} from '@chaingraph/types/port.new/serialization/serializer'
import { ERROR_MESSAGES, PortType } from '@chaingraph/types/port.new'
import {
  SerializationError,
  SerializationRegistry,
} from '@chaingraph/types/port.new/serialization/serializer'

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
