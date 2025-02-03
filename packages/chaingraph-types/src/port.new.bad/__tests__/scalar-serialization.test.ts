import type { PortConfig } from '../config/types'
import { describe, expect, it } from 'vitest'
import { PortType } from '../config/constants'
import { PortValueSerializer } from '../serialization/serializer'

describe('scalar port serialization', () => {
  const serializer = new PortValueSerializer()

  describe('string port', () => {
    const stringPortConfig: PortConfig = {
      type: PortType.String,
      validation: {
        minLength: 1,
        maxLength: 100,
      },
    } as const

    it('should serialize string value', () => {
      const value = 'test string'
      const serialized = serializer.serialize(stringPortConfig, value)
      expect(serialized).toBe(value)
    })

    it('should deserialize string value', () => {
      const value = 'test string'
      const deserialized = serializer.deserialize(stringPortConfig, value)
      expect(deserialized).toBe(value)
    })

    it('should handle empty string', () => {
      const value = ''
      const serialized = serializer.serialize(stringPortConfig, value)
      const deserialized = serializer.deserialize(stringPortConfig, serialized)
      expect(deserialized).toBe(value)
    })
  })

  describe('number port', () => {
    const numberPortConfig: PortConfig = {
      type: PortType.Number,
      validation: {
        min: 0,
        max: 100,
        integer: true,
      },
    } as const

    it('should serialize integer value', () => {
      const value = 42
      const serialized = serializer.serialize(numberPortConfig, value)
      expect(serialized).toBe(value)
    })

    it('should serialize float value', () => {
      const value = 3.14
      const serialized = serializer.serialize(numberPortConfig, value)
      expect(serialized).toBe(value)
    })

    it('should deserialize number value', () => {
      const value = 42
      const deserialized = serializer.deserialize(numberPortConfig, value)
      expect(deserialized).toBe(value)
    })

    it('should handle zero', () => {
      const value = 0
      const serialized = serializer.serialize(numberPortConfig, value)
      const deserialized = serializer.deserialize(numberPortConfig, serialized)
      expect(deserialized).toBe(value)
    })

    it('should handle negative numbers', () => {
      const value = -42
      const serialized = serializer.serialize(numberPortConfig, value)
      const deserialized = serializer.deserialize(numberPortConfig, serialized)
      expect(deserialized).toBe(value)
    })
  })

  describe('boolean port', () => {
    const booleanPortConfig: PortConfig = {
      type: PortType.Boolean,
    } as const

    it('should serialize true value', () => {
      const value = true
      const serialized = serializer.serialize(booleanPortConfig, value)
      expect(serialized).toBe(value)
    })

    it('should serialize false value', () => {
      const value = false
      const serialized = serializer.serialize(booleanPortConfig, value)
      expect(serialized).toBe(value)
    })

    it('should deserialize boolean value', () => {
      const value = true
      const deserialized = serializer.deserialize(booleanPortConfig, value)
      expect(deserialized).toBe(value)
    })

    it('should handle round-trip serialization', () => {
      const value = false
      const serialized = serializer.serialize(booleanPortConfig, value)
      const deserialized = serializer.deserialize(booleanPortConfig, serialized)
      expect(deserialized).toBe(value)
    })
  })

  describe('error handling', () => {
    it('should throw error for unknown port type', () => {
      const invalidConfig = {
        type: 'invalid' as PortType,
      }
      expect(() => serializer.serialize(invalidConfig as PortConfig, 'value')).toThrow()
      expect(() => serializer.deserialize(invalidConfig as PortConfig, 'value')).toThrow()
    })

    it('should handle type mismatches gracefully', () => {
      const stringConfig: PortConfig = { type: PortType.String } as const
      const numberConfig: PortConfig = { type: PortType.Number } as const
      const booleanConfig: PortConfig = { type: PortType.Boolean } as const

      // String port with non-string values
      const serializedNumber = serializer.serialize(stringConfig, 42 as any)
      const serializedBoolean = serializer.serialize(stringConfig, true as any)
      expect(typeof serializedNumber).toBe('number')
      expect(typeof serializedBoolean).toBe('boolean')

      // Number port with non-number values
      const serializedString = serializer.serialize(numberConfig, 'test' as any)
      expect(typeof serializedString).toBe('string')

      // Boolean port with non-boolean values
      const serializedNumber2 = serializer.serialize(booleanConfig, 1 as any)
      expect(typeof serializedNumber2).toBe('number')
    })
  })
})
