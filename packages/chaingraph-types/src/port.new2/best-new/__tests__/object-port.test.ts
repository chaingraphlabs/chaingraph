import { beforeAll, describe, expect, it } from 'vitest'
import { createNumberConfig, createNumberValue, NumberPortPlugin } from '../plugins/NumberPortPlugin'
import { createObjectConfig, createObjectValue, ObjectPortPlugin, validateObjectValue } from '../plugins/ObjectPortPlugin'
import { createStringConfig, createStringValue, StringPortPlugin } from '../plugins/StringPortPlugin'
import { portRegistry } from '../registry/PortRegistry'

describe('object port plugin', () => {
  beforeAll(() => {
    // Register required plugins
    portRegistry.register(StringPortPlugin)
    portRegistry.register(NumberPortPlugin)
    portRegistry.register(ObjectPortPlugin)
  })

  describe('validation', () => {
    it('should validate basic object structure', () => {
      const config = createObjectConfig({
        name: createStringConfig({ minLength: 2 }),
        age: createNumberConfig({ min: 0, max: 150 }),
      })

      // Test valid object
      const validValue = createObjectValue({
        name: createStringValue('John'),
        age: createNumberValue(30),
      })
      expect(validateObjectValue(validValue, config)).toHaveLength(0)

      // Test invalid structure
      const invalidValue = { type: 'object', invalid: true }
      expect(validateObjectValue(invalidValue, config)).toContain(
        'Invalid object value structure',
      )
    })

    it('should validate nested object structures', () => {
      const config = createObjectConfig({
        user: createObjectConfig({
          name: createStringConfig({ minLength: 2 }),
          age: createNumberConfig({ min: 0 }),
        }),
        settings: createObjectConfig({
          theme: createStringConfig(),
          fontSize: createNumberConfig({ min: 8, max: 32 }),
        }),
      })

      // Test valid nested object
      const validValue = createObjectValue({
        user: createObjectValue({
          name: createStringValue('Alice'),
          age: createNumberValue(25),
        }),
        settings: createObjectValue({
          theme: createStringValue('dark'),
          fontSize: createNumberValue(16),
        }),
      })
      expect(validateObjectValue(validValue, config)).toHaveLength(0)

      // Test invalid nested structure
      const invalidValue = createObjectValue({
        user: createObjectValue({
          name: createStringValue('A'), // Too short
          age: createNumberValue(-1), // Below min
        }),
        settings: createObjectValue({
          theme: createStringValue('light'),
          fontSize: createNumberValue(40), // Above max
        }),
      })
      const errors = validateObjectValue(invalidValue, config)
      expect(errors).toContainEqual(expect.stringContaining('must be at least 2 characters'))
      expect(errors).toContainEqual(expect.stringContaining('must be greater than or equal to 0'))
      expect(errors).toContainEqual(expect.stringContaining('must be less than or equal to 32'))
    })

    it('should validate missing and extra fields', () => {
      const config = createObjectConfig({
        required1: createStringConfig(),
        required2: createNumberConfig(),
      })

      // Test missing field
      const missingField = createObjectValue({
        required1: createStringValue('test'),
      })
      expect(validateObjectValue(missingField, config)).toContain(
        'Missing required field: required2',
      )

      // Test extra field
      const extraField = createObjectValue({
        required1: createStringValue('test'),
        required2: createNumberValue(42),
        extra: createStringValue('extra'),
      })
      expect(validateObjectValue(extraField, config)).toContain(
        'Unexpected field: extra',
      )
    })

    it('should validate field types', () => {
      const config = createObjectConfig({
        stringField: createStringConfig(),
        numberField: createNumberConfig(),
      })

      // Test wrong field types
      const wrongTypes = createObjectValue({
        stringField: createNumberValue(123), // Should be string
        numberField: createStringValue('456'), // Should be number
      })
      const errors = validateObjectValue(wrongTypes, config)
      expect(errors.length).toBeGreaterThan(0)
      expect(errors.some(e => e.includes('Invalid value for field'))).toBe(true)
    })
  })

  describe('serialization', () => {
    it('should serialize and deserialize object values', () => {
      const original = createObjectValue({
        name: createStringValue('John'),
        age: createNumberValue(30),
        settings: createObjectValue({
          theme: createStringValue('dark'),
          fontSize: createNumberValue(16),
        }),
      })

      // Serialize
      const serialized = ObjectPortPlugin.serializeValue(original)
      expect(serialized).toEqual({
        type: 'object',
        value: {
          name: { type: 'string', value: 'John' },
          age: { type: 'number', value: 30 },
          settings: {
            type: 'object',
            value: {
              theme: { type: 'string', value: 'dark' },
              fontSize: { type: 'number', value: 16 },
            },
          },
        },
      })

      // Deserialize
      const deserialized = ObjectPortPlugin.deserializeValue(serialized)
      expect(deserialized).toEqual(original)
    })

    it('should handle invalid serialization input', () => {
      // Invalid structure
      expect(() => ObjectPortPlugin.serializeValue({
        type: 'object',
        invalid: true,
      } as any)).toThrow('Invalid object value structure')

      // Invalid field type
      expect(() => ObjectPortPlugin.serializeValue({
        type: 'object',
        value: {
          field: { type: 'unknown', value: 'test' },
        },
      } as any)).toThrow('Unknown field type')
    })

    it('should handle invalid deserialization input', () => {
      // Invalid structure
      expect(() => ObjectPortPlugin.deserializeValue({
        type: 'object',
        invalid: true,
      })).toThrow('Invalid object value structure')

      // Invalid field value
      expect(() => ObjectPortPlugin.deserializeValue({
        type: 'object',
        value: {
          field: 'not an object',
        },
      })).toThrow('Invalid field value structure')
    })
  })

  describe('schema validation', () => {
    it('should validate config schema', () => {
      const result = ObjectPortPlugin.configSchema.safeParse({
        type: 'object',
        fields: {
          name: { type: 'string' },
          age: { type: 'number', min: 0 },
        },
      })
      expect(result.success).toBe(true)

      const invalidResult = ObjectPortPlugin.configSchema.safeParse({
        type: 'object',
        fields: {
          invalid: { type: 'unknown' },
        },
      })
      expect(invalidResult.success).toBe(false)
    })

    it('should validate value schema', () => {
      const result = ObjectPortPlugin.valueSchema.safeParse({
        type: 'object',
        value: {
          name: { type: 'string', value: 'test' },
          age: { type: 'number', value: 42 },
        },
      })
      expect(result.success).toBe(true)

      const invalidResult = ObjectPortPlugin.valueSchema.safeParse({
        type: 'object',
        value: {
          invalid: { type: 'unknown', value: 'test' },
        },
      })
      expect(invalidResult.success).toBe(false)
    })
  })

  describe('config serialization', () => {
    it('should serialize config with all fields', () => {
      const config = createObjectConfig(
        {
          name: createStringConfig({ minLength: 2 }),
          age: createNumberConfig({ min: 0, max: 150 }),
          settings: createObjectConfig(
            {
              theme: createStringConfig(),
              fontSize: createNumberConfig({ min: 8, max: 32 }),
            },
          ),
        },
        {
          name: 'test',
          id: 'test-id',
          metadata: { custom: 'value' },
        },
      )

      const serialized = ObjectPortPlugin.serializeConfig(config)
      expect(serialized).toStrictEqual({
        type: 'object',
        name: 'test',
        id: 'test-id',
        fields: {
          name: { type: 'string', minLength: 2 },
          age: { type: 'number', min: 0, max: 150 },
          settings: {
            type: 'object',
            fields: {
              theme: { type: 'string' },
              fontSize: { type: 'number', min: 8, max: 32 },
            },
          },
        },
        metadata: { custom: 'value' },
      })
    })

    it('should serialize minimal config', () => {
      const config = createObjectConfig({
        name: createStringConfig(),
      })
      const serialized = ObjectPortPlugin.serializeConfig(config)
      expect(serialized).toStrictEqual({
        type: 'object',
        fields: {
          name: { type: 'string' },
        },
      })
    })

    it('should deserialize config with all fields', () => {
      const data = {
        type: 'object',
        name: 'test',
        id: 'test-id',
        fields: {
          name: { type: 'string', minLength: 2 },
          age: { type: 'number', min: 0, max: 150 },
          settings: {
            type: 'object',
            fields: {
              theme: { type: 'string' },
              fontSize: { type: 'number', min: 8, max: 32 },
            },
          },
        },
        metadata: { custom: 'value' },
      }

      const deserialized = ObjectPortPlugin.deserializeConfig(data)
      expect(deserialized).toStrictEqual(data)
    })

    it('should deserialize minimal config', () => {
      const data = {
        type: 'object',
        fields: {
          name: { type: 'string' },
        },
      }

      const deserialized = ObjectPortPlugin.deserializeConfig(data)
      expect(deserialized).toStrictEqual(data)
    })

    it('should throw on invalid config deserialization input', () => {
      expect(() => ObjectPortPlugin.deserializeConfig({
        type: 'object',
        fields: {
          invalid: { type: 'unknown' },
        },
      })).toThrow()

      expect(() => ObjectPortPlugin.deserializeConfig({
        type: 'string',
      })).toThrow()

      expect(() => ObjectPortPlugin.deserializeConfig({
        type: 'object',
        fields: {
          name: { type: 'string' },
        },
        unknownField: true,
      })).not.toThrow() // passthrough allows extra fields
    })

    it('should maintain metadata types during serialization roundtrip', () => {
      const config = createObjectConfig(
        {
          name: createStringConfig(),
        },
        {
          metadata: {
            number: 42,
            string: 'test',
            boolean: true,
            array: [1, 2, 3],
            object: { nested: 'value' },
          },
        },
      )

      const serialized = ObjectPortPlugin.serializeConfig(config)
      const deserialized = ObjectPortPlugin.deserializeConfig(serialized)

      expect(deserialized).toStrictEqual(config)
      expect(deserialized.metadata).toStrictEqual(config.metadata)
    })
  })
})
