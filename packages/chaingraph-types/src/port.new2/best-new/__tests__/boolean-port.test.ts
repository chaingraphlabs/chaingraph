import type { BooleanPortConfig } from '../base/types'
import { beforeEach, describe, expect, it } from 'vitest'
import { BooleanPortPlugin, createBooleanConfig, createBooleanValue } from '../plugins/BooleanPortPlugin'
import { portRegistry } from '../registry/PortRegistry'

describe('boolean port plugin', () => {
  beforeEach(() => {
    portRegistry.clear()
    portRegistry.register(BooleanPortPlugin)
  })

  describe('config validation', () => {
    it('should validate valid config', () => {
      const result = BooleanPortPlugin.configSchema.safeParse({
        type: 'boolean',
        name: 'test',
        defaultValue: { type: 'boolean', value: true },
      })
      expect(result.success).toBe(true)
    })

    it('should allow optional fields to be omitted', () => {
      const result = BooleanPortPlugin.configSchema.safeParse({
        type: 'boolean',
      })
      expect(result.success).toBe(true)
    })

    it('should reject invalid type', () => {
      const result = BooleanPortPlugin.configSchema.safeParse({
        type: 'string',
      })
      expect(result.success).toBe(false)
    })

    it('should reject invalid defaultValue type', () => {
      const result = BooleanPortPlugin.configSchema.safeParse({
        type: 'boolean',
        defaultValue: 'true',
      })
      expect(result.success).toBe(false)
    })
  })

  describe('value validation', () => {
    it('should validate valid value', () => {
      const result = BooleanPortPlugin.valueSchema.safeParse({
        type: 'boolean',
        value: true,
      })
      expect(result.success).toBe(true)
    })

    it('should reject invalid value type', () => {
      const result = BooleanPortPlugin.valueSchema.safeParse({
        type: 'boolean',
        value: 'true',
      })
      expect(result.success).toBe(false)
    })

    it('should validate using validate method', () => {
      const config: BooleanPortConfig = {
        type: 'boolean' as const,
      }

      const validValue = createBooleanValue(true)
      const invalidValue = { type: 'boolean', value: 'true' }

      // Get plugin and assert it exists and has the correct type
      const plugin = portRegistry.getPlugin('boolean')

      expect(plugin!.validateValue!(validValue, config)).toHaveLength(0)
      expect(plugin!.validateValue!(invalidValue as any, config)).toHaveLength(1)
    })
  })

  describe('value serialization', () => {
    it('should serialize boolean value', () => {
      const value = createBooleanValue(true)
      expect(BooleanPortPlugin.serializeValue(value)).toStrictEqual({
        type: 'boolean',
        value: true,
      })
    })

    it('should throw on invalid serialization input', () => {
      expect(() => BooleanPortPlugin.serializeValue({
        type: 'boolean',
        value: 'true',
      } as any)).toThrow()
    })

    it('should deserialize to boolean value', () => {
      expect(BooleanPortPlugin.deserializeValue({
        type: 'boolean',
        value: true,
      })).toEqual({
        type: 'boolean',
        value: true,
      })
    })

    it('should throw on invalid deserialization input', () => {
      expect(() => BooleanPortPlugin.deserializeValue({
        type: 'boolean',
        value: 'true',
      })).toThrow()
    })
  })

  describe('config serialization', () => {
    it('should serialize config with all fields', () => {
      const config = createBooleanConfig({
        name: 'test',
        id: 'test-id',
        defaultValue: true,
        metadata: { custom: 'value' },
      })

      const serialized = BooleanPortPlugin.serializeConfig(config)
      expect(serialized).toStrictEqual({
        type: 'boolean',
        name: 'test',
        id: 'test-id',
        defaultValue: true,
        metadata: { custom: 'value' },
      })
    })

    it('should serialize minimal config', () => {
      const config = createBooleanConfig()
      const serialized = BooleanPortPlugin.serializeConfig(config)
      expect(serialized).toStrictEqual({
        type: 'boolean',
      })
    })

    it('should deserialize config with all fields', () => {
      const data = {
        type: 'boolean',
        name: 'test',
        id: 'test-id',
        defaultValue: { type: 'boolean', value: true },
        metadata: { custom: 'value' },
      }

      const deserialized = BooleanPortPlugin.deserializeConfig(data)
      expect(deserialized).toStrictEqual(data)
    })

    it('should deserialize minimal config', () => {
      const data = {
        type: 'boolean',
      }

      const deserialized = BooleanPortPlugin.deserializeConfig(data)
      expect(deserialized).toStrictEqual(data)
    })

    it('should throw on invalid config deserialization input', () => {
      expect(() => BooleanPortPlugin.deserializeConfig({
        type: 'boolean',
        defaultValue: 'not-a-boolean',
      })).toThrow()

      expect(() => BooleanPortPlugin.deserializeConfig({
        type: 'string',
      })).toThrow()

      expect(() => BooleanPortPlugin.deserializeConfig({
        type: 'boolean',
        unknownField: true,
      })).not.toThrow() // passthrough allows extra fields
    })

    it('should maintain metadata types during serialization roundtrip', () => {
      const config = createBooleanConfig({
        metadata: {
          number: 42,
          string: 'test',
          boolean: true,
          array: [1, 2, 3],
          object: { nested: 'value' },
        },
      })

      const serialized = BooleanPortPlugin.serializeConfig(config)
      const deserialized = BooleanPortPlugin.deserializeConfig(serialized)

      expect(deserialized).toStrictEqual(config)
      expect(deserialized.metadata).toStrictEqual(config.metadata)
    })
  })

  describe('integration', () => {
    it('should validate full port object', () => {
      const port = {
        config: {
          type: 'boolean' as const,
          name: 'test',
          defaultValue: { type: 'boolean', value: true },
        },
        value: {
          type: 'boolean' as const,
          value: true,
        },
      }

      const configResult = portRegistry.getConfigUnionSchema().safeParse(port.config)
      const valueResult = portRegistry.getValueUnionSchema().safeParse(port.value)

      expect(configResult.success).toBe(true)
      expect(valueResult.success).toBe(true)
    })

    it('should reject mismatched type identifiers', () => {
      const port = {
        config: {
          type: 'boolean',
        },
        value: {
          type: 'string',
          value: 'true',
        },
      }

      const configResult = portRegistry.getConfigUnionSchema().safeParse(port.config)
      const valueResult = portRegistry.getValueUnionSchema().safeParse(port.value)

      expect(configResult.success).toBe(true)
      expect(valueResult.success).toBe(false)
    })

    it('should handle config serialization through registry', () => {
      const config = createBooleanConfig({
        name: 'test',
        defaultValue: { type: 'boolean', value: true },
      })

      const serialized = portRegistry.serializeConfig(config)
      const deserialized = portRegistry.deserializeConfig('boolean', serialized)

      expect(deserialized).toStrictEqual(config)
    })
  })
})
