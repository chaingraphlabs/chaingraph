import { registerTestPorts } from '@chaingraph/types/port.new/registry/register-ports'
import { beforeAll, describe, expect, it } from 'vitest'
import { PortDirection, PortType } from '../config/constants'
import { AnyPort } from '../ports/any.port'
import { PortFactory } from '../registry/port-factory'

describe('any port', () => {
  beforeAll(() => {
    // Register the port type before running tests
    registerTestPorts(
      PortType.Array, // For array port itself
      PortType.String, // For string array tests
      PortType.Number, // For number array tests
      PortType.Boolean, // For boolean array tests
      PortType.Object, // For object array tests
      PortType.Any, // For any port tests
    )
  })

  describe('basic functionality', () => {
    it('should create any port with minimal config', () => {
      const config = {
        type: PortType.Any as const,
      }

      const port = new AnyPort(config)
      expect(port.config).toEqual(config)
      expect(port.hasValue()).toBe(false)
    })

    it('should handle default value', () => {
      const config = {
        type: PortType.Any as const,
        defaultValue: 'test',
      }

      const port = new AnyPort(config)
      expect(port.hasValue()).toBe(true)
      expect(port.getValue()).toBe('test')
    })

    it('should set and get value', () => {
      const port = new AnyPort({
        type: PortType.Any as const,
      })

      port.setValue(42)
      expect(port.getValue()).toBe(42)

      port.setValue('string')
      expect(port.getValue()).toBe('string')

      port.setValue({ key: 'value' })
      expect(port.getValue()).toEqual({ key: 'value' })
    })
  })

  describe('internal type handling', () => {
    it('should validate against string internal type', () => {
      const config = {
        type: PortType.Any as const,
        internalType: {
          type: PortType.String as const,
          validation: {
            minLength: 3,
            maxLength: 10,
          },
        },
      }

      const port = new AnyPort(config)

      // Valid string
      port.setValue('valid')
      expect(port.getValue()).toBe('valid')

      // Invalid string (too short)
      expect(() => port.setValue('ab')).toThrow()

      // Invalid type
      expect(() => port.setValue(42)).toThrow()
    })

    it('should validate against number internal type', () => {
      const config = {
        type: PortType.Any as const,
        internalType: {
          type: PortType.Number as const,
          validation: {
            min: 0,
            max: 100,
          },
        },
      }

      const port = new AnyPort(config)

      // Valid number
      port.setValue(42)
      expect(port.getValue()).toBe(42)

      // Invalid number (out of range)
      expect(() => port.setValue(101)).toThrow()

      // Invalid type
      expect(() => port.setValue('string')).toThrow()
    })
  })

  describe('factory registration', () => {
    it('should create any port through factory', () => {
      const config = {
        type: PortType.Any as const,
        internalType: {
          type: PortType.String as const,
          validation: {
            minLength: 3,
          },
        },
      }

      const port = PortFactory.create(config)
      expect(port).toBeInstanceOf(AnyPort)

      port.setValue('test')
      expect(port.getValue()).toBe('test')

      expect(() => port.setValue('ab')).toThrow()
    })
  })

  describe('common port properties', () => {
    it('should handle optional properties', () => {
      const port = new AnyPort({
        type: PortType.Any as const,
        id: 'test-any',
        title: 'Test Any',
        description: 'A test any port',
        direction: PortDirection.Input,
        optional: true,
        metadata: {
          custom: 'value',
        },
      })

      expect(port.config.id).toBe('test-any')
      expect(port.config.title).toBe('Test Any')
      expect(port.config.description).toBe('A test any port')
      expect(port.config.direction).toBe(PortDirection.Input)
      expect(port.config.optional).toBe(true)
      expect(port.config.metadata).toEqual({ custom: 'value' })
    })
  })
})
