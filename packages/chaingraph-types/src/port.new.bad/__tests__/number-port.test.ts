import type { PortEventHandler } from '../base/port.interface'
import { describe, expect, it } from 'vitest'
import { PortDirection, PortType } from '../config/constants'
import { NumberPort } from '../ports/number.port'

describe('number port', () => {
  describe('basic functionality', () => {
    it('should create number port with minimal config', () => {
      const port = new NumberPort({
        type: PortType.Number,
      })
      expect(port).toBeInstanceOf(NumberPort)
    })

    it('should handle default value', () => {
      const port = new NumberPort({
        type: PortType.Number,
        defaultValue: 42,
      })
      expect(port.getValue()).toBe(42)
    })

    it('should set and get value', () => {
      const port = new NumberPort({
        type: PortType.Number,
      })
      port.setValue(42)
      expect(port.getValue()).toBe(42)
    })

    it('should reset value', () => {
      const port = new NumberPort({
        type: PortType.Number,
        defaultValue: 42,
      })
      port.setValue(100)
      port.reset()
      expect(port.getValue()).toBe(42)
    })
  })

  describe('validation', () => {
    it('should validate min value', () => {
      const port = new NumberPort({
        type: PortType.Number,
        validation: {
          min: 0,
        },
      })

      expect(() => port.setValue(10)).not.toThrow()
      expect(() => port.setValue(-1)).toThrow()
    })

    it('should validate max value', () => {
      const port = new NumberPort({
        type: PortType.Number,
        validation: {
          max: 100,
        },
      })

      expect(() => port.setValue(50)).not.toThrow()
      expect(() => port.setValue(101)).toThrow()
    })

    it('should validate both min and max values', () => {
      const port = new NumberPort({
        type: PortType.Number,
        validation: {
          min: 0,
          max: 100,
        },
      })

      expect(() => port.setValue(50)).not.toThrow()
      expect(() => port.setValue(-1)).toThrow()
      expect(() => port.setValue(101)).toThrow()
    })

    it('should validate integer values', () => {
      const port = new NumberPort({
        type: PortType.Number,
        validation: {
          integer: true,
        },
      })

      expect(() => port.setValue(42)).not.toThrow()
      expect(() => port.setValue(42.5)).toThrow()
    })

    it('should validate combined integer and range', () => {
      const port = new NumberPort({
        type: PortType.Number,
        validation: {
          min: 0,
          max: 100,
          integer: true,
        },
      })

      expect(() => port.setValue(42)).not.toThrow()
      expect(() => port.setValue(42.5)).toThrow()
      expect(() => port.setValue(-1)).toThrow()
      expect(() => port.setValue(101)).toThrow()
    })
  })

  describe('serialization', () => {
    it('should serialize port without value', () => {
      const port = new NumberPort({
        type: PortType.Number,
        id: 'test-id',
        title: 'Test Port',
        description: 'A test port',
        direction: PortDirection.Input,
        validation: {
          min: 0,
          max: 100,
          integer: true,
        },
      })

      const serialized = port.serialize()
      expect(serialized.config).toEqual({
        type: PortType.Number,
        id: 'test-id',
        title: 'Test Port',
        description: 'A test port',
        direction: PortDirection.Input,
        validation: {
          min: 0,
          max: 100,
          integer: true,
        },
      })
      expect(serialized.value).toBeUndefined()
    })

    it('should serialize port with value', () => {
      const port = new NumberPort({
        type: PortType.Number,
        validation: {
          min: 0,
          max: 100,
        },
      })
      port.setValue(42)

      const serialized = port.serialize()
      expect(serialized.value).toBe(42)
    })

    it('should deserialize port', () => {
      const original = new NumberPort({
        type: PortType.Number,
        id: 'test-id',
        validation: {
          min: 0,
          max: 100,
        },
      })
      original.setValue(42)

      const serialized = original.serialize()
      const deserialized = original.deserialize(serialized)

      expect(deserialized.config).toEqual(original.config)
      expect(deserialized.getValue()).toBe(original.getValue())
    })

    it('should handle metadata in serialization', () => {
      const port = new NumberPort({
        type: PortType.Number,
        metadata: {
          custom: 'value',
        },
      })

      const serialized = port.serialize()
      const deserialized = port.deserialize(serialized)

      expect(deserialized.getMetadata('custom')).toBe('value')
    })
  })

  describe('events', () => {
    it('should emit value change events', () => {
      const port = new NumberPort({
        type: PortType.Number,
      })

      const changes: Array<{ oldValue: number | undefined, newValue: number }> = []
      const handler: PortEventHandler = (_event, data) => {
        changes.push(data as { oldValue: number | undefined, newValue: number })
      }
      port.on('value:change', handler)

      port.setValue(42)
      port.setValue(100)

      expect(changes).toEqual([
        { oldValue: undefined, newValue: 42 },
        { oldValue: 42, newValue: 100 },
      ])
    })

    it('should emit reset events', () => {
      const port = new NumberPort({
        type: PortType.Number,
        defaultValue: 42,
      })

      let resetCalled = false
      const handler: PortEventHandler = () => {
        resetCalled = true
      }
      port.on('value:reset', handler)

      port.setValue(100)
      port.reset()

      expect(resetCalled).toBe(true)
      expect(port.getValue()).toBe(42)
    })
  })
})
