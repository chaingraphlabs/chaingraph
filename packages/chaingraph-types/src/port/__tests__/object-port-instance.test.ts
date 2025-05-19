/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { ArrayPortConfig, NumberPortConfig, StringPortConfig } from '../base'
import { describe, expect, it } from 'vitest'
import { createObjectValue, PortPluginRegistry } from '../../port'

import { createObjectPortConfig, createObjectSchema, ObjectPort } from '../instances'

describe('objectPort Instance', () => {
  describe('basic Validation', () => {
    it('should validate a correct object port value', () => {
      // Create a simple object schema with two fields: name and age.
      const schema = createObjectSchema({
        name: { type: 'string', minLength: 2 } as StringPortConfig,
        age: { type: 'number', min: 18 } as NumberPortConfig,
      })

      // NOTE: defaultValue is now a plain object: no wrapping with {type, value}
      const config = createObjectPortConfig({
        type: 'object',
        schema,
        defaultValue: createObjectValue({
          name: 'Alice',
          age: 25,
        }),
      })

      const port = new ObjectPort(config)
      const value = port.getValue()

      // Validate that the default value passes validation.
      const errors = PortPluginRegistry.getInstance().getPlugin('object')?.validateValue(value!, config)
      expect(errors).toHaveLength(0)
    })

    it('should report missing and extra fields correctly', () => {
      // Object schema with required fields "name" and "age".
      const schema = createObjectSchema({
        name: { type: 'string', minLength: 2 },
        age: { type: 'number', min: 18, required: true },
      })

      const config = createObjectPortConfig({
        type: 'object',
        schema,
      })

      // Create an object value missing the "age" field and including an extra field.
      const badValue = createObjectValue({
        name: 'Bob',
        extraField: 'unexpected',
      })

      const errors = PortPluginRegistry.getInstance().getPlugin('object')?.validateValue(badValue, config)
      expect(errors).toContain('Missing required field: age')
      // Outdated check, for now we are not validating extra fields because some objects are dynamic
      // expect(errors).toContain('Unexpected field: extraField')
    })
  })

  describe('nested Structures', () => {
    it('should validate a complex object port with nested object fields and infer types', () => {
      // Build the tag schema and config – default values are now plain values.
      const tagSchema = createObjectSchema({
        lol: { type: 'string' } as StringPortConfig,
        kek: { type: 'string' } as StringPortConfig,
      })

      const tagConfig = createObjectPortConfig<typeof tagSchema>({
        type: 'object',
        schema: tagSchema,
        defaultValue: {
          lol: 'lol',
          kek: 'kek',
        },
      })

      // Build user schema and config with nested objects and an array of tags.
      const userSchema = createObjectSchema({
        name: { type: 'string', minLength: 2 },
        age: { type: 'number', min: 21 },
        address: {
          type: 'object',
          schema: createObjectSchema({
            street: { type: 'string' },
            city: { type: 'string' },
            state: { type: 'string' },
            tags: {
              type: 'array',
              itemConfig: tagConfig,
            } as ArrayPortConfig<typeof tagConfig>,
          }),
        },
      })

      const userConfig = createObjectPortConfig({
        type: 'object',
        schema: userSchema,
        // defaultValue is now a plain object tree without wrapping each value
        defaultValue: {
          name: 'Alice',
          age: 30,
          address: {
            street: '123 Main St',
            city: 'Springfield',
            state: 'IL',
            tags: [
              {
                lol: 'lol',
                kek: 'kek',
              },
              {
                lol: 'lol2',
                kek: 'kek2',
              },
            ],
          },
        },
      })

      const userPort = new ObjectPort(userConfig)

      // Access nested field values directly.
      expect(userPort.getValue()?.name).toBe('Alice')
      expect(userPort.getValue()?.address.state).toBe('IL')
    })

    it('should validate a complex object port with nested object fields', () => {
      // Create a nested schema where the "address" field is itself an object.
      const addressSchema = createObjectSchema({
        street: { type: 'string' },
        city: { type: 'string', minLength: 3 },
      })

      const schema = createObjectSchema({
        name: { type: 'string', minLength: 2 } as StringPortConfig,
        age: { type: 'number', min: 18 } as NumberPortConfig,
        address: createObjectPortConfig({
          type: 'object',
          schema: addressSchema,
        }),
      })

      const config = createObjectPortConfig<typeof schema>({
        type: 'object',
        schema,
        defaultValue: {
          name: 'Charlie',
          age: 30,
          address: {
            street: '123 Main St',
            city: 'New York',
          },
        },
      })

      const port = new ObjectPort<typeof schema>(config)
      const errors = PortPluginRegistry.getInstance().getPlugin('object')?.validateValue(port.getValue()!, config)
      expect(errors).toHaveLength(0)

      expect(port.getValue()?.address.city).toBe('New York')
      expect(port.getValue()?.address.street).toBe('123 Main St')

      // Now introduce an error inside the nested object: too-short city name.
      const badNestedValue = createObjectValue({
        name: 'Charlie',
        age: 30,
        address: {
          street: '123 Main St',
          city: 'NY', // too short
        },
      })

      const nestedErrors = PortPluginRegistry.getInstance().getPlugin('object')?.validateValue(badNestedValue, config)
      expect(nestedErrors?.some(msg => msg.includes('at least 3 characters'))).toBe(true)
    })
  })

  describe('serialization and Deserialization', () => {
    it('should serialize and deserialize a simple object port instance correctly', () => {
      const schema = createObjectSchema({
        name: { type: 'string', minLength: 2 } as StringPortConfig,
        score: { type: 'number', min: 0, max: 100 } as NumberPortConfig,
      })
      const config = createObjectPortConfig({
        type: 'object',
        schema,
        defaultValue: createObjectValue({
          name: 'Dana',
          score: 85,
        }),
      })

      const port = new ObjectPort(config)
      const originalValue = port.getValue()

      // Serialize the plain object value.
      const serialized = PortPluginRegistry.getInstance().getPlugin('object')?.serializeValue(originalValue!, config)
      // Full roundtrip via JSON.
      const jsonString = JSON.stringify(serialized)
      const parsed = JSON.parse(jsonString)

      const deserializedValue = PortPluginRegistry.getInstance().getPlugin('object')?.deserializeValue(parsed, config)
      expect(deserializedValue).toEqual(originalValue)
    })

    it('should serialize and deserialize a complex nested object port with arrays', () => {
      // Define an array configuration for strings.
      const arraySchema: ArrayPortConfig<StringPortConfig> = {
        type: 'array',
        itemConfig: { type: 'string', minLength: 1 },
        minLength: 1,
        maxLength: 5,
      }

      // Create a nested object schema including an array.
      const nestedSchema = createObjectSchema({
        title: { type: 'string', minLength: 3 } as StringPortConfig,
        tags: arraySchema,
      })

      const schema = createObjectSchema({
        id: { type: 'number', min: 1 } as NumberPortConfig,
        content: createObjectPortConfig({
          type: 'object',
          schema: nestedSchema,
        }),
      })

      const config = createObjectPortConfig({
        type: 'object',
        schema,
        defaultValue: createObjectValue({
          id: 101,
          content: {
            title: 'Test Article',
            tags: ['news', 'tech'],
          },
        }),
      })

      const port = new ObjectPort(config)
      const originalValue = port.getValue()

      const serialized = PortPluginRegistry.getInstance().getPlugin('object')?.serializeValue(originalValue!, config)
      const jsonString = JSON.stringify(serialized)
      const parsed = JSON.parse(jsonString)
      const deserializedValue = PortPluginRegistry.getInstance().getPlugin('object')?.deserializeValue(parsed, config)
      expect(deserializedValue).toEqual(originalValue)
    })
  })
})
