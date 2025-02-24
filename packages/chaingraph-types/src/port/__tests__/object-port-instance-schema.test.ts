/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { NumberPortConfig, StringPortConfig } from '../base'
import { describe, expect, it } from 'vitest'
import { createObjectValue } from '../../port'

import { createObjectPortConfig, createObjectSchema, ObjectPort } from '../instances'

describe('objectPort dynamic schema', () => {
  describe('add field to the schema', () => {
    it('should add/remove scalar field to the schema', () => {
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
      expect(port.getValue()).toEqual({ name: 'Alice', age: 25 })

      // Add a new scalar field to the schema
      port.addField('address', { type: 'string', defaultValue: '123 Main St' } as StringPortConfig)

      expect(port.getConfig().schema.properties).toHaveProperty('address')
      expect(port.getConfig().schema.properties).toEqual({
        name: { type: 'string', minLength: 2 },
        age: { type: 'number', min: 18 },
        address: { key: 'address', type: 'string', defaultValue: '123 Main St' },
      })
      expect(port.getValue()).toEqual({ name: 'Alice', age: 25, address: '123 Main St' })

      // Remove the scalar field from the schema
      port.removeField('address')

      expect(port.getConfig().schema.properties).not.toHaveProperty('address')
      expect(port.getConfig().schema.properties).toEqual({
        name: { type: 'string', minLength: 2 },
        age: { type: 'number', min: 18 },
      })
      expect(port.getValue()).toEqual({ name: 'Alice', age: 25 })
    })

    it('should add a new object field to the schema', () => {
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
      // check if the value is correct
      expect(port.getValue()).toEqual({ name: 'Alice', age: 25 })

      // Add a new object field to the schema
      port.addField('address', {
        type: 'object',
        schema: createObjectSchema({
          street: { type: 'string', defaultValue: '123 Main St' } as StringPortConfig,
          city: { type: 'string', defaultValue: 'Springfield' } as StringPortConfig,
        }),
        defaultValue: createObjectValue({
          street: '123 Main St',
          city: 'Springfield',
        }),
      })

      expect(port.getConfig().schema.properties).toHaveProperty('address')
      expect(port.getConfig().schema.properties).toEqual({
        name: { type: 'string', minLength: 2 },
        age: { type: 'number', min: 18 },
        address: {
          type: 'object',
          key: 'address',
          schema: {
            properties: {
              street: { type: 'string', defaultValue: '123 Main St' },
              city: { type: 'string', defaultValue: 'Springfield' },
            },
          },
          defaultValue: {
            street: '123 Main St',
            city: 'Springfield',
          },
        },
      })
      expect(port.getValue()).toEqual({
        name: 'Alice',
        age: 25,
        address: {
          street: '123 Main St',
          city: 'Springfield',
        },
      })

      // Remove the object field from the schema
      port.removeField('address')

      expect(port.getConfig().schema.properties).not.toHaveProperty('address')
      expect(port.getConfig().schema.properties).toEqual({
        name: { type: 'string', minLength: 2 },
        age: { type: 'number', min: 18 },
      })
      expect(port.getValue()).toEqual({ name: 'Alice', age: 25 })
    })
  })
})
