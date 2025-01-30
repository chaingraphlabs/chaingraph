import type { ConfigFromPortType } from '../config/types'
import { describe, expect, it } from 'vitest'
import { PortType } from '../config/constants'
import { NumberPort } from '../ports/number.port'

describe('number port', () => {
  describe('basic functionality', () => {
    it('should create number port with minimal config', () => {
      const config: ConfigFromPortType<PortType.Number> = {
        type: PortType.Number,
      }

      const port = new NumberPort(config)
      expect(port.config).toEqual(config)
      expect(port.hasValue()).toBe(false)
    })

    it('should handle default value', () => {
      const config: ConfigFromPortType<PortType.Number> = {
        type: PortType.Number,
        defaultValue: 42,
      }

      const port = new NumberPort(config)
      expect(port.hasValue()).toBe(true)
      expect(port.getValue()).toBe(42)
    })

    it('should set and get value', () => {
      const port = new NumberPort({ type: PortType.Number })
      port.setValue(123)
      expect(port.getValue()).toBe(123)
    })

    it('should reset value', () => {
      const port = new NumberPort({ type: PortType.Number })
      port.setValue(123)
      port.reset()
      expect(port.hasValue()).toBe(false)
    })
  })

  describe('validation', () => {
    it('should validate min value', () => {
      const port = new NumberPort({
        type: PortType.Number,
        validation: {
          min: 10,
        },
      })

      expect(() => port.setValue(9)).toThrow()
      expect(() => port.setValue(10)).not.toThrow()
      expect(() => port.setValue(11)).not.toThrow()
    })

    it('should validate max value', () => {
      const port = new NumberPort({
        type: PortType.Number,
        validation: {
          max: 100,
        },
      })

      expect(() => port.setValue(101)).toThrow()
      expect(() => port.setValue(100)).not.toThrow()
      expect(() => port.setValue(99)).not.toThrow()
    })

    it('should validate both min and max values', () => {
      const port = new NumberPort({
        type: PortType.Number,
        validation: {
          min: 10,
          max: 20,
        },
      })

      expect(() => port.setValue(9)).toThrow()
      expect(() => port.setValue(21)).toThrow()
      expect(() => port.setValue(15)).not.toThrow()
    })

    it('should validate integer constraint', () => {
      const port = new NumberPort({
        type: PortType.Number,
        validation: {
          integer: true,
        },
      })

      expect(() => port.setValue(1.5)).toThrow()
      expect(() => port.setValue(1)).not.toThrow()
      expect(() => port.setValue(2)).not.toThrow()
    })

    it('should validate all constraints together', () => {
      const port = new NumberPort({
        type: PortType.Number,
        validation: {
          min: 10,
          max: 20,
          integer: true,
        },
      })

      expect(() => port.setValue(9)).toThrow()
      expect(() => port.setValue(21)).toThrow()
      expect(() => port.setValue(15.5)).toThrow()
      expect(() => port.setValue(15)).not.toThrow()
    })
  })

  describe('serialization', () => {
    it('should serialize port without value', () => {
      const config: ConfigFromPortType<PortType.Number> = {
        type: PortType.Number,
        validation: {
          min: 0,
          max: 100,
          integer: true,
        },
      }

      const port = new NumberPort(config)
      const serialized = port.serialize()

      expect(serialized).toEqual({
        config,
        value: undefined,
        metadata: undefined,
      })
    })

    it('should serialize port with value', () => {
      const config: ConfigFromPortType<PortType.Number> = {
        type: PortType.Number,
      }

      const port = new NumberPort(config)
      port.setValue(42)
      const serialized = port.serialize()

      expect(serialized).toEqual({
        config,
        value: 42,
        metadata: undefined,
      })
    })

    it('should deserialize port', () => {
      const config: ConfigFromPortType<PortType.Number> = {
        type: PortType.Number,
        validation: {
          min: 0,
          max: 100,
          integer: true,
        },
      }

      const originalPort = new NumberPort(config)
      originalPort.setValue(42)

      const serialized = originalPort.serialize()
      const deserializedPort = originalPort.deserialize(serialized)

      expect(deserializedPort).toBeInstanceOf(NumberPort)
      expect(deserializedPort.config).toEqual(config)
      expect(deserializedPort.getValue()).toBe(42)
    })

    it('should handle metadata in serialization', () => {
      const port = new NumberPort({ type: PortType.Number })
      port.setValue(42)
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
      const port = new NumberPort({ type: PortType.Number })
      const events: any[] = []

      port.on('value:change', (event, data) => {
        events.push({ event, data })
      })

      port.setValue(1)
      port.setValue(2)

      expect(events).toHaveLength(2)
      expect(events[0].data).toEqual({
        oldValue: undefined,
        newValue: 1,
      })
      expect(events[1].data).toEqual({
        oldValue: 1,
        newValue: 2,
      })
    })

    it('should emit reset events', () => {
      const port = new NumberPort({ type: PortType.Number })
      const events: any[] = []

      port.setValue(42)
      port.on('value:reset', (event, data) => {
        events.push({ event, data })
      })

      port.reset()

      expect(events).toHaveLength(1)
      expect(events[0].data).toEqual({
        oldValue: 42,
      })
    })
  })
})
