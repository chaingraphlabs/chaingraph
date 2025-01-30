import type { ConfigFromPortType } from '../config/types'
import { describe, expect, it } from 'vitest'
import { PortType } from '../config/constants'
import { BooleanPort } from '../ports/boolean.port'

describe('boolean port', () => {
  describe('basic functionality', () => {
    it('should create boolean port with minimal config', () => {
      const config: ConfigFromPortType<PortType.Boolean> = {
        type: PortType.Boolean,
      }

      const port = new BooleanPort(config)
      expect(port.config).toEqual(config)
      expect(port.hasValue()).toBe(false)
    })

    it('should handle default value', () => {
      const config: ConfigFromPortType<PortType.Boolean> = {
        type: PortType.Boolean,
        defaultValue: true,
      }

      const port = new BooleanPort(config)
      expect(port.hasValue()).toBe(true)
      expect(port.getValue()).toBe(true)
    })

    it('should set and get value', () => {
      const port = new BooleanPort({ type: PortType.Boolean })
      port.setValue(true)
      expect(port.getValue()).toBe(true)
      port.setValue(false)
      expect(port.getValue()).toBe(false)
    })

    it('should reset value', () => {
      const port = new BooleanPort({ type: PortType.Boolean })
      port.setValue(true)
      port.reset()
      expect(port.hasValue()).toBe(false)
    })

    it('should validate boolean values', () => {
      const port = new BooleanPort({ type: PortType.Boolean })

      expect(() => port.setValue(true)).not.toThrow()
      expect(() => port.setValue(false)).not.toThrow()
      // @ts-expect-error Testing invalid value
      expect(() => port.setValue('true')).toThrow()
      // @ts-expect-error Testing invalid value
      expect(() => port.setValue(1)).toThrow()
    })
  })

  describe('serialization', () => {
    it('should serialize port without value', () => {
      const config: ConfigFromPortType<PortType.Boolean> = {
        type: PortType.Boolean,
      }

      const port = new BooleanPort(config)
      const serialized = port.serialize()

      expect(serialized).toEqual({
        config,
        value: undefined,
        metadata: undefined,
      })
    })

    it('should serialize port with value', () => {
      const config: ConfigFromPortType<PortType.Boolean> = {
        type: PortType.Boolean,
      }

      const port = new BooleanPort(config)
      port.setValue(true)
      const serialized = port.serialize()

      expect(serialized).toEqual({
        config,
        value: true,
        metadata: undefined,
      })
    })

    it('should deserialize port', () => {
      const config: ConfigFromPortType<PortType.Boolean> = {
        type: PortType.Boolean,
      }

      const originalPort = new BooleanPort(config)
      originalPort.setValue(true)

      const serialized = originalPort.serialize()
      const deserializedPort = originalPort.deserialize(serialized)

      expect(deserializedPort).toBeInstanceOf(BooleanPort)
      expect(deserializedPort.config).toEqual(config)
      expect(deserializedPort.getValue()).toBe(true)
    })

    it('should handle metadata in serialization', () => {
      const port = new BooleanPort({ type: PortType.Boolean })
      port.setValue(true)
      port.setMetadata('key1', 'value1')
      port.setMetadata('key2', { nested: true })

      const serialized = port.serialize()
      const deserializedPort = port.deserialize(serialized)

      expect(deserializedPort.getMetadata('key1')).toBe('value1')
      expect(deserializedPort.getMetadata('key2')).toEqual({ nested: true })
    })
  })

  describe('events', () => {
    it('should emit value change events', () => {
      const port = new BooleanPort({ type: PortType.Boolean })
      const events: any[] = []

      port.on('value:change', (event, data) => {
        events.push({ event, data })
      })

      port.setValue(true)
      port.setValue(false)

      expect(events).toHaveLength(2)
      expect(events[0].data).toEqual({
        oldValue: undefined,
        newValue: true,
      })
      expect(events[1].data).toEqual({
        oldValue: true,
        newValue: false,
      })
    })

    it('should emit reset events', () => {
      const port = new BooleanPort({ type: PortType.Boolean })
      const events: any[] = []

      port.setValue(true)
      port.on('value:reset', (event, data) => {
        events.push({ event, data })
      })

      port.reset()

      expect(events).toHaveLength(1)
      expect(events[0].data).toEqual({
        oldValue: true,
      })
    })
  })
})
