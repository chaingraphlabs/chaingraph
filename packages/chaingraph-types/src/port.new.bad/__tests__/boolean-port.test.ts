import type { PortEventHandler } from '../base/port.interface'
import { describe, expect, it } from 'vitest'
import { PortDirection, PortType } from '../config/constants'
import { BooleanPort } from '../ports/boolean.port'

describe('boolean port', () => {
  describe('basic functionality', () => {
    it('should create boolean port with minimal config', () => {
      const port = new BooleanPort({
        type: PortType.Boolean,
      })
      expect(port).toBeInstanceOf(BooleanPort)
    })

    it('should handle default value', () => {
      const port = new BooleanPort({
        type: PortType.Boolean,
        defaultValue: true,
      })
      expect(port.getValue()).toBe(true)
    })

    it('should set and get value', () => {
      const port = new BooleanPort({
        type: PortType.Boolean,
      })
      port.setValue(true)
      expect(port.getValue()).toBe(true)
    })

    it('should reset value', () => {
      const port = new BooleanPort({
        type: PortType.Boolean,
        defaultValue: true,
      })
      port.setValue(false)
      port.reset()
      expect(port.getValue()).toBe(true)
    })
  })

  describe('validation', () => {
    it('should accept boolean values', () => {
      const port = new BooleanPort({
        type: PortType.Boolean,
      })

      expect(() => port.setValue(true)).not.toThrow()
      expect(() => port.setValue(false)).not.toThrow()
    })

    it('should reject non-boolean values', () => {
      const port = new BooleanPort({
        type: PortType.Boolean,
      })

      // @ts-expect-error Testing runtime validation
      expect(() => port.setValue(1)).toThrow()
      // @ts-expect-error Testing runtime validation
      expect(() => port.setValue('true')).toThrow()
      // @ts-expect-error Testing runtime validation
      expect(() => port.setValue(null)).toThrow()
      // @ts-expect-error Testing runtime validation
      expect(() => port.setValue(undefined)).toThrow()
    })
  })

  describe('serialization', () => {
    it('should serialize port without value', () => {
      const port = new BooleanPort({
        type: PortType.Boolean,
        id: 'test-id',
        title: 'Test Port',
        description: 'A test port',
        direction: PortDirection.Input,
      })

      const serialized = port.serialize()
      expect(serialized.config).toEqual({
        type: PortType.Boolean,
        id: 'test-id',
        title: 'Test Port',
        description: 'A test port',
        direction: PortDirection.Input,
      })
      expect(serialized.value).toBeUndefined()
    })

    it('should serialize port with value', () => {
      const port = new BooleanPort({
        type: PortType.Boolean,
      })
      port.setValue(true)

      const serialized = port.serialize()
      expect(serialized.value).toBe(true)
    })

    it('should deserialize port', () => {
      const original = new BooleanPort({
        type: PortType.Boolean,
        id: 'test-id',
      })
      original.setValue(true)

      const serialized = original.serialize()
      const deserialized = original.deserialize(serialized)

      expect(deserialized.config).toEqual(original.config)
      expect(deserialized.getValue()).toBe(original.getValue())
    })

    it('should handle metadata in serialization', () => {
      const port = new BooleanPort({
        type: PortType.Boolean,
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
      const port = new BooleanPort({
        type: PortType.Boolean,
      })

      const changes: Array<{ oldValue: boolean | undefined, newValue: boolean }> = []
      const handler: PortEventHandler = (_event, data) => {
        changes.push(data as { oldValue: boolean | undefined, newValue: boolean })
      }
      port.on('value:change', handler)

      port.setValue(true)
      port.setValue(false)

      expect(changes).toEqual([
        { oldValue: undefined, newValue: true },
        { oldValue: true, newValue: false },
      ])
    })

    it('should emit reset events', () => {
      const port = new BooleanPort({
        type: PortType.Boolean,
        defaultValue: true,
      })

      let resetCalled = false
      const handler: PortEventHandler = () => {
        resetCalled = true
      }
      port.on('value:reset', handler)

      port.setValue(false)
      port.reset()

      expect(resetCalled).toBe(true)
      expect(port.getValue()).toBe(true)
    })
  })
})
