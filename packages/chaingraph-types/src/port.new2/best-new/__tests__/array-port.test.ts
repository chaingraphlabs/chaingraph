import { beforeEach, describe, expect, it } from 'vitest'
import { ArrayPortPlugin, validateArrayValue } from '../plugins/ArrayPortPlugin'
import { NumberPortPlugin } from '../plugins/NumberPortPlugin'
import { StringPortPlugin } from '../plugins/StringPortPlugin'
import { portRegistry } from '../registry/PortRegistry'

describe('array port plugin', () => {
  beforeEach(() => {
    portRegistry.clear()
    // Register required plugins
    portRegistry.register(StringPortPlugin)
    portRegistry.register(NumberPortPlugin)
    portRegistry.register(ArrayPortPlugin)
  })

  describe('config validation', () => {
    it('should validate valid config', () => {
      const result = ArrayPortPlugin.configSchema.safeParse({
        type: 'array',
        itemConfig: {
          type: 'string',
          minLength: 1,
        },
        minLength: 0,
        maxLength: 10,
      })
      expect(result.success).toBe(true)
    })

    it('should reject invalid min/max length combination', () => {
      const result = ArrayPortPlugin.configSchema.safeParse({
        type: 'array',
        itemConfig: { type: 'string' },
        minLength: 10,
        maxLength: 5,
      })
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.errors[0].message).toContain('minLength (10) must be less than or equal to maxLength (5)')
      }
    })

    it('should validate nested array config', () => {
      const result = ArrayPortPlugin.configSchema.safeParse({
        type: 'array',
        itemConfig: {
          type: 'array',
          itemConfig: { type: 'string' },
        },
      })
      expect(result.success).toBe(true)
    })
  })

  describe('value validation', () => {
    it('should validate string array', () => {
      const config = {
        type: 'array' as const,
        itemConfig: {
          type: 'string' as const,
          minLength: 2,
        },
      }

      const validValue = {
        type: 'array' as const,
        value: [
          { type: 'string', value: 'abc' },
          { type: 'string', value: 'def' },
        ],
      }

      const invalidValue = {
        type: 'array' as const,
        value: [
          { type: 'string', value: 'a' }, // Too short
          { type: 'number', value: 123 }, // Wrong type
        ],
      }

      const validResult = ArrayPortPlugin.valueSchema.safeParse(validValue)
      expect(validResult.success).toBe(true)

      const validationErrors = validateArrayValue(invalidValue.value, config)
      expect(validationErrors.length).toBeGreaterThan(0)
      expect(validationErrors.some(err => err.includes('must be at least 2 characters'))).toBe(true)
      expect(validationErrors.some(err => err.includes('does not match config type'))).toBe(true)
    })

    it('should validate nested array', () => {
      const config = {
        type: 'array' as const,
        itemConfig: {
          type: 'array' as const,
          itemConfig: {
            type: 'number' as const,
            min: 0,
            max: 10,
          },
        },
      }

      const validValue = {
        type: 'array' as const,
        value: [
          {
            type: 'array',
            value: [
              { type: 'number', value: 1 },
              { type: 'number', value: 2 },
            ],
          },
          {
            type: 'array',
            value: [
              { type: 'number', value: 3 },
              { type: 'number', value: 4 },
            ],
          },
        ],
      }

      const invalidValue = {
        type: 'array' as const,
        value: [
          {
            type: 'array',
            value: [
              { type: 'number', value: -1 }, // Less than min
              { type: 'string', value: 'abc' }, // Wrong type
            ],
          },
        ],
      }

      const validResult = validateArrayValue(validValue.value, config)
      expect(validResult).toHaveLength(0)

      const invalidResult = validateArrayValue(invalidValue.value, config)
      expect(invalidResult.length).toBeGreaterThan(0)
      expect(invalidResult.some(err => err.includes('less than'))).toBe(true)
      expect(invalidResult.some(err => err.includes('does not match config type'))).toBe(true)
    })
  })

  describe('serialization', () => {
    it('should serialize array value', () => {
      const value = {
        type: 'array' as const,
        value: [
          { type: 'string', value: 'abc' },
          { type: 'string', value: 'def' },
        ],
      }
      expect(ArrayPortPlugin.serializeValue!(value)).toEqual(['abc', 'def'])
    })

    it('should deserialize to array value', () => {
      expect(ArrayPortPlugin.deserializeValue!(['abc', 'def'])).toEqual({
        type: 'array',
        value: ['abc', 'def'],
      })
    })

    it('should throw on invalid deserialization input', () => {
      expect(() => ArrayPortPlugin.deserializeValue!('not an array')).toThrow(TypeError)
    })
  })

  describe('integration', () => {
    it('should validate complex nested structure', () => {
      // Array of arrays of numbers
      const config = {
        type: 'array' as const,
        itemConfig: {
          type: 'array' as const,
          itemConfig: {
            type: 'number' as const,
            min: 0,
            max: 100,
          },
          minLength: 2,
        },
        minLength: 1,
      }

      const validValue = {
        type: 'array' as const,
        value: [
          {
            type: 'array',
            value: [
              { type: 'number', value: 1 },
              { type: 'number', value: 2 },
            ],
          },
          {
            type: 'array',
            value: [
              { type: 'number', value: 3 },
              { type: 'number', value: 4 },
            ],
          },
        ],
      }

      const result = validateArrayValue(validValue.value, config)
      expect(result).toHaveLength(0)
    })

    it('should reject invalid nested structure', () => {
      // Array of arrays of strings
      const config = {
        type: 'array' as const,
        itemConfig: {
          type: 'array' as const,
          itemConfig: {
            type: 'string' as const,
            minLength: 3,
          },
        },
      }

      const invalidValue = {
        type: 'array' as const,
        value: [
          {
            type: 'array',
            value: [
              { type: 'string', value: 'ab' }, // Too short
              { type: 'number', value: 123 }, // Wrong type
            ],
          },
        ],
      }

      const result = validateArrayValue(invalidValue.value, config)
      expect(result.length).toBeGreaterThan(0)
      expect(result.some(err => err.includes('must be at least 3 characters'))).toBe(true)
      expect(result.some(err => err.includes('does not match config type'))).toBe(true)
    })
  })
})
