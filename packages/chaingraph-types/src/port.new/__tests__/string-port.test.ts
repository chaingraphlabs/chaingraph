import type { ConfigFromPortType } from '../config/types'
import { describe, expect, it } from 'vitest'
import { PortType } from '../config/constants'
import { StringPort } from '../ports/string.port'

describe('string port', () => {
  describe('basic functionality', () => {
    it('should create string port with minimal config', () => {
      const config: ConfigFromPortType<PortType.String> = {
        type: PortType.String,
      }

      const port = new StringPort(config)
      expect(port.config).toEqual(config)
      expect(port.hasValue()).toBe(false)
    })

    it('should handle default value', () => {
      const config: ConfigFromPortType<PortType.String> = {
        type: PortType.String,
        defaultValue: 'default',
      }

      const port = new StringPort(config)
      expect(port.hasValue()).toBe(true)
      expect(port.getValue()).toBe('default')
    })

    it('should set and get value', () => {
      const port = new StringPort({ type: PortType.String })
      port.setValue('test')
      expect(port.getValue()).toBe('test')
    })

    it('should reset value', () => {
      const port = new StringPort({ type: PortType.String })
      port.setValue('test')
      port.reset()
      expect(port.hasValue()).toBe(false)
    })
  })

  describe('validation', () => {
    it('should validate minLength', () => {
      const port = new StringPort({
        type: PortType.String,
        validation: {
          minLength: 3,
        },
      })

      expect(() => port.setValue('ab')).toThrow()
      expect(() => port.setValue('abc')).not.toThrow()
    })

    it('should validate maxLength', () => {
      const port = new StringPort({
        type: PortType.String,
        validation: {
          maxLength: 5,
        },
      })

      expect(() => port.setValue('123456')).toThrow()
      expect(() => port.setValue('12345')).not.toThrow()
    })

    it('should validate both minLength and maxLength', () => {
      const port = new StringPort({
        type: PortType.String,
        validation: {
          minLength: 2,
          maxLength: 4,
        },
      })

      expect(() => port.setValue('a')).toThrow()
      expect(() => port.setValue('12345')).toThrow()
      expect(() => port.setValue('123')).not.toThrow()
    })
  })

  describe('serialization', () => {
    it('should serialize port without value', () => {
      const config: ConfigFromPortType<PortType.String> = {
        type: PortType.String,
        validation: {
          minLength: 1,
          maxLength: 10,
        },
      }

      const port = new StringPort(config)
      const serialized = port.serialize()
      const serializedJson = JSON.stringify(serialized)
      const deserialized = JSON.parse(serializedJson)

      expect(deserialized).toEqual({
        config,
        value: undefined,
        metadata: undefined,
      })
    })

    it('should serialize port with value', () => {
      const config: ConfigFromPortType<PortType.String> = {
        type: PortType.String,
      }

      const port = new StringPort(config)
      port.setValue('test')
      const serialized = port.serialize()
      const serializedJson = JSON.stringify(serialized)
      const deserialized = JSON.parse(serializedJson)

      expect(deserialized).toEqual({
        config,
        value: 'test',
        metadata: undefined,
      })
    })

    it('should deserialize port', () => {
      const config: ConfigFromPortType<PortType.String> = {
        type: PortType.String,
        validation: {
          minLength: 1,
          maxLength: 10,
        },
      }

      const originalPort = new StringPort(config)
      originalPort.setValue('test')

      const serialized = originalPort.serialize()
      const serializedJson = JSON.stringify(serialized)
      const deserialized = JSON.parse(serializedJson)

      const deserializedPort = originalPort.deserialize(deserialized)

      expect(deserializedPort).toBeInstanceOf(StringPort)
      expect(deserializedPort.config).toEqual(config)
      expect(deserializedPort.getValue()).toBe('test')
    })

    it('should handle metadata in serialization', () => {
      const port = new StringPort({ type: PortType.String })
      port.setValue('test')
      port.setMetadata('key1', 'value1')
      port.setMetadata('key2', { nested: true })

      const serialized = port.serialize()
      const serializedJson = JSON.stringify(serialized)
      const deserialized = JSON.parse(serializedJson)

      const deserializedPort = port.deserialize(deserialized)

      expect(deserializedPort.getMetadata('key1')).toBe('value1')
      expect(deserializedPort.getMetadata('key2')).toEqual({ nested: true })
    })
  })

  describe('events', () => {
    it('should emit value change events', () => {
      const port = new StringPort({ type: PortType.String })
      const events: any[] = []

      port.on('value:change', (event, data) => {
        events.push({ event, data })
      })

      port.setValue('test1')
      port.setValue('test2')

      expect(events).toHaveLength(2)
      expect(events[0].data).toEqual({
        oldValue: undefined,
        newValue: 'test1',
      })
      expect(events[1].data).toEqual({
        oldValue: 'test1',
        newValue: 'test2',
      })
    })

    it('should emit reset events', () => {
      const port = new StringPort({ type: PortType.String })
      const events: any[] = []

      port.setValue('test')
      port.on('value:reset', (event, data) => {
        events.push({ event, data })
      })

      port.reset()

      expect(events).toHaveLength(1)
      expect(events[0].data).toEqual({
        oldValue: 'test',
      })
    })
  })
})
