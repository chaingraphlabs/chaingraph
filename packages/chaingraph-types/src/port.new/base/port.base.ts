import type { z } from 'zod'
import type { PortConfig } from '../config/types'
import type { PortValueType } from '../config/value-types'
import type { IEventPort, PortEventHandler, PortEventType, SerializedPortData } from './port.interface'
import { ERROR_MESSAGES } from '../config/constants'
import { portConfigSchema } from '../schemas'
import { PortValueSerializer } from '../serialization/serializer'

/**
 * Abstract base class for all port types
 */
export abstract class Port<TConfig extends PortConfig, TValue = PortValueType<TConfig>>
implements IEventPort<TConfig, TValue> {
  protected _value: TValue | undefined
  protected _eventHandlers: Map<PortEventType, Set<PortEventHandler>> = new Map()
  protected _serializer = new PortValueSerializer()

  constructor(
    public readonly config: TConfig,
  ) {
    this.validateConfig(config)
    if (config.defaultValue !== undefined) {
      this.setValue(config.defaultValue as TValue)
    }
  }

  // Abstract methods that must be implemented by derived classes
  abstract getValueSchema(): z.ZodType<TValue>
  abstract getConfigSchema(): z.ZodType<TConfig>

  // Value management
  get value(): TValue {
    return this.getValue()
  }

  set value(newValue: TValue) {
    this.setValue(newValue)
  }

  getValue(): TValue {
    if (!this.hasValue()) {
      throw new Error(ERROR_MESSAGES.INVALID_VALUE)
    }
    return this._value as TValue
  }

  setValue(value: TValue): void {
    if (!this.validateValue(value)) {
      throw new Error(ERROR_MESSAGES.INVALID_VALUE)
    }
    const oldValue = this._value
    this._value = value
    if (oldValue !== value) {
      this.emit('value:change', { oldValue, newValue: value })
    }
  }

  hasValue(): boolean {
    return this._value !== undefined
  }

  reset(): void {
    const oldValue = this._value
    this._value = undefined
    if (oldValue !== undefined) {
      this.emit('value:reset', { oldValue })
    }
    if (this.config.defaultValue !== undefined) {
      this.setValue(this.config.defaultValue as TValue)
    }
  }

  // Validation
  validate(): boolean {
    return this.validateConfig(this.config) && (!this.hasValue() || this.validateValue(this._value as TValue))
  }

  validateValue(value: unknown): value is TValue {
    try {
      const schema = this.getValueSchema()
      schema.parse(value)
      return true
    } catch {
      return false
    }
  }

  validateConfig(config: unknown): config is TConfig {
    try {
      const schema = this.getConfigSchema()
      schema.parse(config)
      return true
    } catch {
      return false
    }
  }

  // Metadata
  getMetadata<T = unknown>(key: string): T | undefined {
    return this.config.metadata?.[key] as T | undefined
  }

  setMetadata(key: string, value: unknown): void {
    if (!this.config.metadata) {
      this.config.metadata = {}
    }
    const oldValue = this.config.metadata[key]
    this.config.metadata[key] = value
    if (oldValue !== value) {
      this.emit('metadata:change', { key, oldValue, newValue: value })
    }
  }

  // Event handling
  emit(event: PortEventType, data?: unknown): void {
    const handlers = this._eventHandlers.get(event)
    if (handlers) {
      handlers.forEach(handler => handler(event, data))
    }
  }

  on(event: PortEventType, handler: PortEventHandler): void {
    let handlers = this._eventHandlers.get(event)
    if (!handlers) {
      handlers = new Set()
      this._eventHandlers.set(event, handlers)
    }
    handlers.add(handler)
  }

  off(event: PortEventType, handler: PortEventHandler): void {
    const handlers = this._eventHandlers.get(event)
    if (handlers) {
      handlers.delete(handler)
    }
  }

  // Serialization
  serialize(): SerializedPortData {
    const serializedMetadata = this.config.metadata

    const serializedValue = this.hasValue()
      ? this._serializer.serialize(this.config, this.getValue())
      : undefined

    const serializedDefault = this.config.defaultValue !== undefined
      ? this._serializer.serialize(this.config, this.config.defaultValue)
      : undefined

    if (serializedMetadata && serializedDefault !== undefined) {
      serializedMetadata.defaultValue = serializedDefault
    }

    return {
      config: this.config,
      value: serializedValue,
      metadata: serializedMetadata,
    }
  }

  deserialize(data: SerializedPortData): IEventPort<TConfig, TValue> {
    try {
      // First validate the config using the port's specific config schema
      const config = this.getConfigSchema().parse(data.config) as TConfig

      // Then validate using the general port config schema
      portConfigSchema.parse(data.config)

      // Create a new port instance
      const port = new (this.constructor as new (config: TConfig) => Port<TConfig, TValue>)(config)

      if (data.value !== undefined) {
        const deserializedValue = this._serializer.deserialize(this.config, data.value)
        port.setValue(deserializedValue as TValue)
      }

      if (data.metadata) {
        Object.entries(data.metadata).forEach(([key, value]) => {
          if (key === 'defaultValue' && value !== undefined) {
            const defaultValue = this._serializer.deserialize(this.config, value)
            if (defaultValue !== undefined) {
              port.config.defaultValue = defaultValue as TValue
            }
            return
          }
          port.setMetadata(key, value)
        })
      }

      return port
    } catch (error) {
      throw new Error(`${ERROR_MESSAGES.DESERIALIZATION_ERROR}: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  serializeValue(): unknown {
    return this._serializer.serialize(this.config, this.getValue())
  }

  deserializeValue(value: unknown): TValue {
    return this._serializer.deserialize(this.config, value) as TValue
  }

  // Utility
  clone(): IEventPort<TConfig, TValue> {
    const serialized = this.serialize()
    return this.deserialize(serialized)
  }

  toString(): string {
    return `Port(${this.config.type}${this.hasValue() ? `: ${JSON.stringify(this.getValue())}` : ''})`
  }
}
