import { beforeEach, describe, expect, it } from 'vitest'
import { BooleanPortPlugin, createBooleanValue } from '../plugins/BooleanPortPlugin'
import { portRegistry } from '../registry/PortRegistry'

describe('boolean port plugin', () => {
  describe('config validation', () => {
    it('should validate valid config', () => {
      const result = BooleanPortPlugin.configSchema.safeParse({
        type: 'boolean',
        name: 'test',
        defaultValue: true,
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
      const config = {
        type: 'boolean' as const,
      }

      const validValue = createBooleanValue(true)
      const invalidValue = { type: 'boolean', value: 'true' }

      expect(BooleanPortPlugin.validate(validValue, config)).toHaveLength(0)
      expect(BooleanPortPlugin.validate(invalidValue as any, config)).toHaveLength(1)
    })
  })

  describe('serialization', () => {
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

  describe('integration', () => {
    beforeEach(() => {
      portRegistry.clear()
      portRegistry.register(BooleanPortPlugin)
    })

    it('should validate full port object', () => {
      const port = {
        config: {
          type: 'boolean' as const,
          name: 'test',
          defaultValue: true,
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
  })
})
