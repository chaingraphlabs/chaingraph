/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import { describe, expect, it } from 'vitest'
import {
  createStringConfig,
  createStringValue,
  StringPortPlugin,
  validateStringValue,
} from '../plugins'

describe('string port plugin (plain values)', () => {
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

      // Test invalid regex pattern in config
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

      // Test invalid value structure – now simply not a string.
      expect(validateStringValue({ invalid: 'structure' } as any, config)).toContain(
        'Invalid string value structure',
      )

      // Test wrong type field – for instance a number.
      expect(validateStringValue(123 as any, config)).toContain(
        'Invalid string value structure',
      )

      // Test valid structure
      expect(validateStringValue(createStringValue('test'), config)).toHaveLength(0)
    })
  })

  describe('serialization', () => {
    it('should serialize string values', () => {
      const value = createStringValue('test')
      // Expect the serialization to yield a plain string.
      const serialized = StringPortPlugin.serializeValue(value, {} as any)
      expect(serialized).toEqual('test')
    })

    it('should serialize object values as json', () => {
      const objectValue = { not: 'a string' }
      const serialized = StringPortPlugin.serializeValue(objectValue as any, {} as any)
      expect(serialized).toEqual(JSON.stringify(objectValue))
    })

    it('should serialize numbers as strings', () => {
      const invalidValue = 123
      const serizlized = StringPortPlugin.serializeValue(invalidValue as any, {} as any)
      expect(serizlized).toEqual('123')
    })
  })

  describe('deserialization', () => {
    it('should deserialize string values', () => {
      // Here data is expected to be a plain string.
      const data = 'test'
      const deserialized = StringPortPlugin.deserializeValue(data, {} as any)
      expect(deserialized).toEqual(createStringValue('test'))
    })

    it('should throw on invalid string structure', () => {
      // Passing an object instead of a plain string.
      const invalidData = { not: 'a string' }
      expect(() => StringPortPlugin.deserializeValue(invalidData as any, {} as any)).toThrow(
        'Invalid string value for deserialization',
      )
    })

    it('should deserialize numbers as strings', () => {
      // Passing a number instead of a string.
      const invalidData = 123
      const deserialized = StringPortPlugin.deserializeValue(invalidData as any, {} as any)
      expect(deserialized).toEqual(createStringValue('123'))
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
      const result = StringPortPlugin.valueSchema.safeParse(123)
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
      expect(() =>
        StringPortPlugin.deserializeConfig({
          type: 'string',
          minLength: 'not-a-number',
        }),
      ).toThrow()

      expect(() =>
        StringPortPlugin.deserializeConfig({
          type: 'number',
        }),
      ).toThrow()

      // Extra fields are allowed via passthrough.
      expect(() =>
        StringPortPlugin.deserializeConfig({
          type: 'string',
          unknownField: true,
        }),
      ).not.toThrow()
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
