import type {
  ArrayPortConfig,
  ArrayPortValue,
  IPortValue,
  NumberPortValue,
  StringPortValue,
} from '../base/types'
import { beforeAll, describe, expect, it } from 'vitest'
import { ArrayPortPlugin, validateArrayValue } from '../plugins/ArrayPortPlugin'
import { NumberPortPlugin } from '../plugins/NumberPortPlugin'
import { StringPortPlugin } from '../plugins/StringPortPlugin'
import { portRegistry } from '../registry/PortPluginRegistry'

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
  } as ArrayPortValue<any>
}

describe('arrayPortPlugin', () => {
  beforeAll(() => {
    // Register required plugins
    portRegistry.register(StringPortPlugin)
    portRegistry.register(NumberPortPlugin)
    portRegistry.register(ArrayPortPlugin)
  })

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

  describe('schema validation', () => {
    it('should validate config schema', () => {
      const result = ArrayPortPlugin.configSchema.safeParse({
        type: 'array',
        itemConfig: { type: 'string' },
        minLength: 1,
        maxLength: 5,
      })
      expect(result.success).toBe(true)

      const invalidResult = ArrayPortPlugin.configSchema.safeParse({
        type: 'array',
        itemConfig: { type: 'unknown' },
      })
      expect(invalidResult.success).toBe(false)

      const invalidLengthResult = ArrayPortPlugin.configSchema.safeParse({
        type: 'array',
        itemConfig: { type: 'string' },
        minLength: 5,
        maxLength: 3,
      })
      expect(invalidLengthResult.success).toBe(false)
    })

    it('should validate value schema', () => {
      const result = ArrayPortPlugin.valueSchema.safeParse({
        type: 'array',
        value: [
          { type: 'string', value: 'test' },
          { type: 'number', value: 42 },
        ],
      })
      expect(result.success).toBe(true)

      const invalidResult = ArrayPortPlugin.valueSchema.safeParse({
        type: 'array',
        value: [{ type: 'unknown', value: 'test' }],
      })
      expect(invalidResult.success).toBe(false)
    })
  })

  describe('config serialization', () => {
    it('should serialize config with all fields', () => {
      const config: ArrayPortConfig = {
        type: 'array',
        name: 'test',
        id: 'test-id',
        itemConfig: {
          type: 'string',
          minLength: 2,
          maxLength: 10,
          pattern: '^[a-z]+$',
        },
        minLength: 1,
        maxLength: 5,
        metadata: { custom: 'value' },
      }

      const serialized = ArrayPortPlugin.serializeConfig(config)
      expect(serialized).toStrictEqual({
        type: 'array',
        name: 'test',
        id: 'test-id',
        itemConfig: {
          type: 'string',
          minLength: 2,
          maxLength: 10,
          pattern: '^[a-z]+$',
        },
        minLength: 1,
        maxLength: 5,
        metadata: { custom: 'value' },
      })
    })

    it('should serialize minimal config', () => {
      const config: ArrayPortConfig = {
        type: 'array',
        itemConfig: { type: 'string' },
      }
      const serialized = ArrayPortPlugin.serializeConfig(config)
      expect(serialized).toStrictEqual({
        type: 'array',
        itemConfig: { type: 'string' },
      })
    })

    it('should deserialize config with all fields', () => {
      const data = {
        type: 'array',
        name: 'test',
        id: 'test-id',
        itemConfig: {
          type: 'string',
          minLength: 2,
          maxLength: 10,
          pattern: '^[a-z]+$',
        },
        minLength: 1,
        maxLength: 5,
        metadata: { custom: 'value' },
      }

      const deserialized = ArrayPortPlugin.deserializeConfig(data)
      expect(deserialized).toStrictEqual(data)
    })

    it('should deserialize minimal config', () => {
      const data = {
        type: 'array',
        itemConfig: { type: 'string' },
      }

      const deserialized = ArrayPortPlugin.deserializeConfig(data)
      expect(deserialized).toStrictEqual(data)
    })

    it('should throw on invalid config deserialization input', () => {
      expect(() => ArrayPortPlugin.deserializeConfig({
        type: 'array',
        itemConfig: { type: 'unknown' },
      })).toThrow()

      expect(() => ArrayPortPlugin.deserializeConfig({
        type: 'string',
      })).toThrow()

      expect(() => ArrayPortPlugin.deserializeConfig({
        type: 'array',
        itemConfig: { type: 'string' },
        unknownField: true,
      })).not.toThrow() // passthrough allows extra fields
    })

    it('should maintain metadata types during serialization roundtrip', () => {
      const config: ArrayPortConfig = {
        type: 'array',
        itemConfig: { type: 'string' },
        metadata: {
          number: 42,
          string: 'test',
          boolean: true,
          array: [1, 2, 3],
          object: { nested: 'value' },
        },
      }

      const serialized = ArrayPortPlugin.serializeConfig(config)
      const deserialized = ArrayPortPlugin.deserializeConfig(serialized)

      expect(deserialized).toStrictEqual(config)
      expect(deserialized.metadata).toStrictEqual(config.metadata)
    })
  })
})
