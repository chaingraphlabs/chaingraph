import type {
  ArrayPortConfig,
  ArrayPortValue,
  IPortValue,
  NumberPortValue,
  StringPortValue,
} from '../base/types'
import { describe, expect, it } from 'vitest'
import { ArrayPortPlugin, validateArrayValue } from '../plugins/ArrayPortPlugin'

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
 * Helper to create a number port value
 */
function createNumberValue(value: number): NumberPortValue {
  return {
    type: 'number',
    value,
  }
}

/**
 * Helper to create an array port value
 */
function createArrayValue(items: IPortValue[]): ArrayPortValue {
  return {
    type: 'array',
    value: items,
  }
}

describe('arrayPortPlugin', () => {
  describe('validation', () => {
    it('should validate array length constraints', () => {
      const config: ArrayPortConfig = {
        type: 'array',
        minLength: 2,
        maxLength: 4,
        itemConfig: { type: 'string' },
      }

      // Test empty array
      const emptyArray = createArrayValue([])
      expect(validateArrayValue(emptyArray, config)).toContain(
        'Array must have at least 2 items',
      )

      // Test array with one item
      const oneItemArray = createArrayValue([createStringValue('test')])
      expect(validateArrayValue(oneItemArray, config)).toContain(
        'Array must have at least 2 items',
      )

      // Test valid array
      const validArray = createArrayValue([
        createStringValue('test1'),
        createStringValue('test2'),
      ])
      expect(validateArrayValue(validArray, config)).toHaveLength(0)

      // Test array too long
      const longArray = createArrayValue([
        createStringValue('test1'),
        createStringValue('test2'),
        createStringValue('test3'),
        createStringValue('test4'),
        createStringValue('test5'),
      ])
      expect(validateArrayValue(longArray, config)).toContain(
        'Array must have at most 4 items',
      )
    })

    it('should validate array item structure', () => {
      const config: ArrayPortConfig = {
        type: 'array',
        itemConfig: { type: 'string' },
      }

      // Test invalid item structure
      const invalidValue = {
        type: 'array',
        value: [{ invalid: 'structure' }],
      }
      expect(validateArrayValue(invalidValue, config)).toContain(
        'Invalid item structure at index 0',
      )

      // Test valid structure
      const validValue = createArrayValue([createStringValue('test')])
      expect(validateArrayValue(validValue, config)).toHaveLength(0)
    })
  })

  describe('serialization', () => {
    it('should serialize array values', () => {
      const value = createArrayValue([
        createStringValue('test'),
        createNumberValue(42),
      ])

      const serialized = ArrayPortPlugin.serializeValue(value)
      expect(serialized).toEqual({
        type: 'array',
        value: [
          { type: 'string', value: 'test' },
          { type: 'number', value: 42 },
        ],
      })
    })

    it('should throw on invalid array structure', () => {
      const invalidValue = {
        type: 'array',
        value: [{ invalid: 'structure' }],
      }

      expect(() => ArrayPortPlugin.serializeValue(invalidValue as any)).toThrow()
    })
  })

  describe('deserialization', () => {
    it('should deserialize array values', () => {
      const data = {
        type: 'array',
        value: [
          { type: 'string', value: 'test' },
          { type: 'number', value: 42 },
        ],
      }

      const deserialized = ArrayPortPlugin.deserializeValue(data)
      expect(deserialized).toEqual(
        createArrayValue([
          createStringValue('test'),
          createNumberValue(42),
        ]),
      )
    })

    it('should throw on invalid array structure', () => {
      const invalidData = {
        type: 'array',
        value: [{ invalid: 'structure' }],
      }

      expect(() => ArrayPortPlugin.deserializeValue(invalidData)).toThrow()
    })
  })
})
