import type { NumberPortConfig, NumberPortValue } from '../base/types'
import { describe, expect, it } from 'vitest'
import { NumberPortPlugin, validateNumberValue } from '../plugins/NumberPortPlugin'

/**
 * Helper to create a number port value
 */
function createNumberValue(value: number): NumberPortValue {
  return {
    type: 'number',
    value,
  }
}

/**
 * Helper to create a number port config
 */
function createNumberConfig(options: Partial<Omit<NumberPortConfig, 'type'>> = {}): NumberPortConfig {
  return {
    type: 'number',
    ...options,
  }
}

describe('number port plugin', () => {
  describe('validation', () => {
    it('should validate number range constraints', () => {
      const config = createNumberConfig({
        min: 0,
        max: 10,
      })

      // Test value too small
      expect(validateNumberValue(createNumberValue(-1), config)).toContain(
        'Value must be greater than or equal to 0',
      )

      // Test value too large
      expect(validateNumberValue(createNumberValue(11), config)).toContain(
        'Value must be less than or equal to 10',
      )

      // Test valid value
      expect(validateNumberValue(createNumberValue(5), config)).toHaveLength(0)
    })

    it('should validate step constraints', () => {
      const config = createNumberConfig({
        min: 0,
        step: 2,
      })

      // Test invalid step
      expect(validateNumberValue(createNumberValue(3), config)).toContain(
        'Value must be aligned with step 2',
      )

      // Test valid step
      expect(validateNumberValue(createNumberValue(4), config)).toHaveLength(0)
    })

    it('should validate integer constraint', () => {
      const config = createNumberConfig({
        integer: true,
      })

      // Test non-integer value
      expect(validateNumberValue(createNumberValue(3.5), config)).toContain(
        'Value must be an integer',
      )

      // Test integer value
      expect(validateNumberValue(createNumberValue(3), config)).toHaveLength(0)
    })

    it('should validate value structure', () => {
      const config = createNumberConfig()

      // Test invalid value structure
      expect(validateNumberValue({ invalid: 'structure' }, config)).toContain(
        'Invalid number value structure',
      )

      // Test missing value field
      expect(validateNumberValue({ type: 'number' }, config)).toContain(
        'Invalid number value structure',
      )

      // Test wrong type field
      expect(validateNumberValue({ type: 'string', value: 123 }, config)).toContain(
        'Invalid number value structure',
      )

      // Test wrong value type
      expect(validateNumberValue({ type: 'number', value: '123' }, config)).toContain(
        'Invalid number value structure',
      )

      // Test valid structure
      expect(validateNumberValue(createNumberValue(123), config)).toHaveLength(0)
    })
  })

  describe('serialization', () => {
    it('should serialize number values', () => {
      const value = createNumberValue(42)
      const serialized = NumberPortPlugin.serializeValue(value)
      expect(serialized).toEqual({
        type: 'number',
        value: 42,
      })
    })

    it('should throw on invalid number structure', () => {
      const invalidValue = {
        type: 'number',
        // Missing value field
      }

      expect(() => NumberPortPlugin.serializeValue(invalidValue as any)).toThrow(
        'Invalid number value structure',
      )
    })

    it('should throw on wrong type', () => {
      const invalidValue = {
        type: 'string',
        value: 123,
      }

      expect(() => NumberPortPlugin.serializeValue(invalidValue as any)).toThrow(
        'Invalid number value structure',
      )
    })
  })

  describe('deserialization', () => {
    it('should deserialize number values', () => {
      const data = {
        type: 'number',
        value: 42,
      }

      const deserialized = NumberPortPlugin.deserializeValue(data)
      expect(deserialized).toEqual(createNumberValue(42))
    })

    it('should throw on invalid number structure', () => {
      const invalidData = {
        type: 'number',
        // Missing value field
      }

      expect(() => NumberPortPlugin.deserializeValue(invalidData)).toThrow(
        'Invalid number value for deserialization',
      )
    })

    it('should throw on wrong type', () => {
      const invalidData = {
        type: 'string',
        value: 123,
      }

      expect(() => NumberPortPlugin.deserializeValue(invalidData)).toThrow(
        'Invalid number value for deserialization',
      )
    })
  })

  describe('schema validation', () => {
    it('should validate min/max relationship', () => {
      const result = NumberPortPlugin.configSchema.safeParse({
        type: 'number',
        min: 10,
        max: 5,
      })

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.errors[0].message).toContain(
          'min (10) must be less than or equal to max (5)',
        )
      }
    })

    it('should validate step compatibility with range', () => {
      const result = NumberPortPlugin.configSchema.safeParse({
        type: 'number',
        min: 0,
        max: 10,
        step: 3,
      })

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.errors[0].message).toContain(
          'step (3) must divide range (10) evenly',
        )
      }
    })

    it('should validate step is positive', () => {
      const result = NumberPortPlugin.configSchema.safeParse({
        type: 'number',
        step: -1,
      })

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.errors[0].code).toBe('too_small')
      }
    })
  })

  describe('config serialization', () => {
    it('should serialize config with all fields', () => {
      const config = createNumberConfig({
        name: 'test',
        id: 'test-id',
        min: 0,
        max: 10,
        step: 2,
        integer: true,
        metadata: { custom: 'value' },
      })

      const serialized = NumberPortPlugin.serializeConfig(config)
      expect(serialized).toStrictEqual({
        type: 'number',
        name: 'test',
        id: 'test-id',
        min: 0,
        max: 10,
        step: 2,
        integer: true,
        metadata: { custom: 'value' },
      })
    })

    it('should serialize minimal config', () => {
      const config = createNumberConfig()
      const serialized = NumberPortPlugin.serializeConfig(config)
      expect(serialized).toStrictEqual({
        type: 'number',
      })
    })

    it('should deserialize config with all fields', () => {
      const data = {
        type: 'number',
        name: 'test',
        id: 'test-id',
        min: 0,
        max: 10,
        step: 2,
        integer: true,
        metadata: { custom: 'value' },
      }

      const deserialized = NumberPortPlugin.deserializeConfig(data)
      expect(deserialized).toStrictEqual(data)
    })

    it('should deserialize minimal config', () => {
      const data = {
        type: 'number',
      }

      const deserialized = NumberPortPlugin.deserializeConfig(data)
      expect(deserialized).toStrictEqual(data)
    })

    it('should throw on invalid config deserialization input', () => {
      expect(() => NumberPortPlugin.deserializeConfig({
        type: 'number',
        min: 'not-a-number',
      })).toThrow()

      expect(() => NumberPortPlugin.deserializeConfig({
        type: 'string',
      })).toThrow()

      expect(() => NumberPortPlugin.deserializeConfig({
        type: 'number',
        unknownField: true,
      })).not.toThrow() // passthrough allows extra fields
    })

    it('should maintain metadata types during serialization roundtrip', () => {
      const config = createNumberConfig({
        metadata: {
          number: 42,
          string: 'test',
          boolean: true,
          array: [1, 2, 3],
          object: { nested: 'value' },
        },
      })

      const serialized = NumberPortPlugin.serializeConfig(config)
      const deserialized = NumberPortPlugin.deserializeConfig(serialized)

      expect(deserialized).toStrictEqual(config)
      expect(deserialized.metadata).toStrictEqual(config.metadata)
    })
  })
})
