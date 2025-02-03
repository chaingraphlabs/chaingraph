import type { StringPortConfig, StringPortValue } from '../base/types'
import { describe, expect, it } from 'vitest'
import { StringPortPlugin, validateStringValue } from '../plugins/StringPortPlugin'

/**
 * Helper to create a string port value
 */
function createStringValue(value: string): StringPortValue {
  return {
    type: 'string',
    value,
  }
}

/**
 * Helper to create a string port config
 */
function createStringConfig(options: Partial<Omit<StringPortConfig, 'type'>> = {}): StringPortConfig {
  return {
    type: 'string',
    ...options,
  }
}

describe('string port plugin', () => {
  describe('validation', () => {
    it('should validate string length constraints', () => {
      const config = createStringConfig({
        minLength: 3,
        maxLength: 5,
      })

      // Test string too short
      expect(validateStringValue(createStringValue('ab'), config)).toContain(
        'String must be at least 3 characters long',
      )

      // Test string too long
      expect(validateStringValue(createStringValue('abcdef'), config)).toContain(
        'String must be at most 5 characters long',
      )

      // Test valid string
      expect(validateStringValue(createStringValue('abcd'), config)).toHaveLength(0)
    })

    it('should validate regex patterns', () => {
      const config = createStringConfig({
        pattern: '^[a-z]+$',
      })

      // Test invalid pattern
      const invalidConfig = createStringConfig({
        pattern: '[', // Invalid regex
      })
      const errors = validateStringValue(createStringValue('test'), invalidConfig)
      expect(errors[0]).toMatch(/Invalid pattern: Invalid regular expression:.*/)

      // Test non-matching string
      expect(validateStringValue(createStringValue('123'), config)).toContain(
        'String must match pattern: ^[a-z]+$',
      )

      // Test matching string
      expect(validateStringValue(createStringValue('abc'), config)).toHaveLength(0)
    })

    it('should validate value structure', () => {
      const config = createStringConfig()

      // Test invalid value structure
      expect(validateStringValue({ invalid: 'structure' }, config)).toContain(
        'Invalid string value structure',
      )

      // Test missing value field
      expect(validateStringValue({ type: 'string' }, config)).toContain(
        'Invalid string value structure',
      )

      // Test wrong type field
      expect(validateStringValue({ type: 'number', value: '123' }, config)).toContain(
        'Invalid string value structure',
      )

      // Test wrong value type
      expect(validateStringValue({ type: 'string', value: 123 }, config)).toContain(
        'Invalid string value structure',
      )

      // Test valid structure
      expect(validateStringValue(createStringValue('test'), config)).toHaveLength(0)
    })
  })

  describe('serialization', () => {
    it('should serialize string values', () => {
      const value = createStringValue('test')
      const serialized = StringPortPlugin.serializeValue(value)
      expect(serialized).toEqual({
        type: 'string',
        value: 'test',
      })
    })

    it('should throw on invalid string structure', () => {
      const invalidValue = {
        type: 'string',
        // Missing value field
      }

      expect(() => StringPortPlugin.serializeValue(invalidValue as any)).toThrow(
        'Invalid string value structure',
      )
    })

    it('should throw on wrong type', () => {
      const invalidValue = {
        type: 'number',
        value: '123',
      }

      expect(() => StringPortPlugin.serializeValue(invalidValue as any)).toThrow(
        'Invalid string value structure',
      )
    })
  })

  describe('deserialization', () => {
    it('should deserialize string values', () => {
      const data = {
        type: 'string',
        value: 'test',
      }

      const deserialized = StringPortPlugin.deserializeValue(data)
      expect(deserialized).toEqual(createStringValue('test'))
    })

    it('should throw on invalid string structure', () => {
      const invalidData = {
        type: 'string',
        // Missing value field
      }

      expect(() => StringPortPlugin.deserializeValue(invalidData)).toThrow(
        'Invalid string value for deserialization',
      )
    })

    it('should throw on wrong type', () => {
      const invalidData = {
        type: 'number',
        value: '123',
      }

      expect(() => StringPortPlugin.deserializeValue(invalidData)).toThrow(
        'Invalid string value for deserialization',
      )
    })
  })

  describe('schema validation', () => {
    it('should validate config schema', () => {
      const result = StringPortPlugin.configSchema.safeParse({
        type: 'string',
        minLength: 5,
        maxLength: 3,
      })

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.errors[0].message).toContain(
          'minLength (5) must be less than or equal to maxLength (3)',
        )
      }
    })

    it('should validate value schema', () => {
      const result = StringPortPlugin.valueSchema.safeParse({
        type: 'string',
        value: 42, // Wrong type for value
      })

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.errors[0].code).toBe('invalid_type')
      }
    })
  })

  describe('config serialization', () => {
    it('should serialize config with all fields', () => {
      const config = createStringConfig({
        name: 'test',
        id: 'test-id',
        minLength: 3,
        maxLength: 10,
        pattern: '^[a-z]+$',
        metadata: { custom: 'value' },
      })

      const serialized = StringPortPlugin.serializeConfig(config)
      expect(serialized).toStrictEqual({
        type: 'string',
        name: 'test',
        id: 'test-id',
        minLength: 3,
        maxLength: 10,
        pattern: '^[a-z]+$',
        metadata: { custom: 'value' },
      })
    })

    it('should serialize minimal config', () => {
      const config = createStringConfig()
      const serialized = StringPortPlugin.serializeConfig(config)
      expect(serialized).toStrictEqual({
        type: 'string',
      })
    })

    it('should deserialize config with all fields', () => {
      const data = {
        type: 'string',
        name: 'test',
        id: 'test-id',
        minLength: 3,
        maxLength: 10,
        pattern: '^[a-z]+$',
        metadata: { custom: 'value' },
      }

      const deserialized = StringPortPlugin.deserializeConfig(data)
      expect(deserialized).toStrictEqual(data)
    })

    it('should deserialize minimal config', () => {
      const data = {
        type: 'string',
      }

      const deserialized = StringPortPlugin.deserializeConfig(data)
      expect(deserialized).toStrictEqual(data)
    })

    it('should throw on invalid config deserialization input', () => {
      expect(() => StringPortPlugin.deserializeConfig({
        type: 'string',
        minLength: 'not-a-number',
      })).toThrow()

      expect(() => StringPortPlugin.deserializeConfig({
        type: 'number',
      })).toThrow()

      expect(() => StringPortPlugin.deserializeConfig({
        type: 'string',
        unknownField: true,
      })).not.toThrow() // passthrough allows extra fields
    })

    it('should maintain metadata types during serialization roundtrip', () => {
      const config = createStringConfig({
        metadata: {
          number: 42,
          string: 'test',
          boolean: true,
          array: [1, 2, 3],
          object: { nested: 'value' },
        },
      })

      const serialized = StringPortPlugin.serializeConfig(config)
      const deserialized = StringPortPlugin.deserializeConfig(serialized)

      expect(deserialized).toStrictEqual(config)
      expect(deserialized.metadata).toStrictEqual(config.metadata)
    })
  })
})
