import { beforeEach, describe, expect, it } from 'vitest'
import { z } from 'zod'
import { PortError, PortErrorType } from '../base/types'
import { StringPortPlugin, validateStringValue } from '../plugins/StringPortPlugin'
import { portRegistry } from '../registry/PortRegistry'

describe('port system', () => {
  beforeEach(() => {
    portRegistry.clear()
  })

  describe('port registry', () => {
    it('should register a plugin successfully', () => {
      portRegistry.register(StringPortPlugin)
      expect(portRegistry.getPlugin('string')).toBe(StringPortPlugin)
    })

    it('should prevent duplicate plugin registration', () => {
      portRegistry.register(StringPortPlugin)
      expect(() => portRegistry.register(StringPortPlugin)).toThrow(PortError)
    })

    it('should build union schemas after registration', () => {
      portRegistry.register(StringPortPlugin)

      const configSchema = portRegistry.getConfigUnionSchema()
      const valueSchema = portRegistry.getValueUnionSchema()

      expect(configSchema).toBeDefined()
      expect(valueSchema).toBeDefined()
    })

    it('should throw error when getting schemas with no plugins', () => {
      expect(() => portRegistry.getConfigUnionSchema()).toThrow(PortError)
      expect(() => portRegistry.getValueUnionSchema()).toThrow(PortError)
    })
  })

  describe('string port plugin', () => {
    describe('config validation', () => {
      it('should validate valid config', () => {
        const result = StringPortPlugin.configSchema.safeParse({
          type: 'string',
          name: 'test',
          minLength: 2,
          maxLength: 10,
        })
        expect(result.success).toBe(true)
      })

      it('should reject invalid minLength/maxLength combination', () => {
        const result = StringPortPlugin.configSchema.safeParse({
          type: 'string',
          minLength: 10,
          maxLength: 5,
        })
        expect(result.success).toBe(false)
      })

      it('should allow optional fields to be omitted', () => {
        const result = StringPortPlugin.configSchema.safeParse({
          type: 'string',
        })
        expect(result.success).toBe(true)
      })
    })

    describe('value validation', () => {
      it('should validate valid value', () => {
        const result = StringPortPlugin.valueSchema.safeParse({
          type: 'string',
          value: 'test',
        })
        expect(result.success).toBe(true)
      })

      it('should validate string constraints', () => {
        const config = {
          type: 'string' as const,
          minLength: 2,
          maxLength: 5,
          pattern: '^[a-z]+$',
        }

        const validations = [
          validateStringValue('abc', config),
          validateStringValue('a', config),
          validateStringValue('abcdef', config),
          validateStringValue('123', config),
        ]

        expect(validations[0]).toHaveLength(0) // valid
        expect(validations[1]).toHaveLength(1) // too short
        expect(validations[2]).toHaveLength(1) // too long
        expect(validations[3]).toHaveLength(1) // doesn't match pattern
      })
    })

    describe('serialization', () => {
      it('should serialize string value', () => {
        const value = {
          type: 'string' as const,
          value: 'test',
        }
        expect(StringPortPlugin.serializeValue!(value)).toBe('test')
      })

      it('should deserialize to string value', () => {
        expect(StringPortPlugin.deserializeValue!('test')).toEqual({
          type: 'string',
          value: 'test',
        })
      })

      it('should throw on invalid deserialization input', () => {
        expect(() => StringPortPlugin.deserializeValue!(123)).toThrow(TypeError)
      })
    })
  })

  describe('integration', () => {
    beforeEach(() => {
      portRegistry.register(StringPortPlugin)
    })

    it('should validate full port object', () => {
      const port = {
        config: {
          type: 'string' as const,
          name: 'test',
          minLength: 2,
          maxLength: 10,
        },
        value: {
          type: 'string' as const,
          value: 'valid',
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
          type: 'string',
          name: 'test',
        },
        value: {
          type: 'number', // Mismatched type
          value: 123,
        },
      }

      const configResult = portRegistry.getConfigUnionSchema().safeParse(port.config)
      const valueResult = portRegistry.getValueUnionSchema().safeParse(port.value)

      expect(configResult.success).toBe(true)
      expect(valueResult.success).toBe(false)
    })
  })
})
