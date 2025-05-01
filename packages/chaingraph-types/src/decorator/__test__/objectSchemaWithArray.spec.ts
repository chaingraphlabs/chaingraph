/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import { describe, expect, it } from 'vitest'
import { getObjectSchema, ObjectSchema } from '../object-schema.decorator'
import { Port } from '../port.decorator'
import 'reflect-metadata'

// Define a simple inner object schema for testing.
@ObjectSchema()
class InnerObjectSchema {
  @Port({ type: 'string' })
  foo: string = 'defaultFoo'

  @Port({ type: 'number' })
  bar: number = 0
}

// Define another simple schema for an array of strings.
@ObjectSchema()
class SimpleStringSchema {
  @Port({ type: 'string' })
  value: string = 'default'
}

// Define a MixedSchema that contains several cases:
// • A string array property.
// • An object array property using the explicit form.
// • A nested object property with an explicit plain schema.
// • An array property whose items are arrays of objects.
@ObjectSchema()
class MixedSchema {
  @Port({
    type: 'array',
    itemConfig: { type: 'string' },
  })
  stringArray: string[] = []

  @Port({
    type: 'array',
    itemConfig: { type: 'object', schema: InnerObjectSchema },
  })
  objectArray: InnerObjectSchema[] = []

  @Port({
    type: 'object',
    // Supply an explicit plain object schema for the nested object.
    schema: {
      type: 'NestedObject',
      properties: {
        innerObjects: {
          type: 'array',
          // Explicit syntax: always use type: 'object'
          itemConfig: { type: 'object', schema: InnerObjectSchema },
        },
        singleString: { type: 'string', key: 'singleString' },
      },
      isObjectSchema: true,
    },
  })
  nestedObject: { innerObjects: InnerObjectSchema[], singleString: string } = {
    innerObjects: [],
    singleString: 'test',
  }

  @Port({
    type: 'array',
    itemConfig: {
      type: 'array',
      itemConfig: { type: 'object', schema: InnerObjectSchema },
    },
  })
  arrayOfArrays: InnerObjectSchema[][] = []
}

// Define a deeper nested case: an object property that contains an array of objects,
// with each object containing an array of objects.
@ObjectSchema()
class DeepInner {
  @Port({ type: 'string' })
  a: string = 'a'
}

@ObjectSchema()
class Intermediate {
  @Port({
    type: 'array',
    itemConfig: { type: 'object', schema: DeepInner },
  })
  list: DeepInner[] = []
}

@ObjectSchema()
class DeepOuter {
  @Port({
    type: 'object',
    // Using the class decorated with @ObjectSchema for resolution.
    schema: Intermediate,
  })
  intermediate: Intermediate = new Intermediate()
}

describe('nested Object and Array Schemas (explicit syntax only)', () => {
  it('should resolve a simple inner object schema', () => {
    const innerSchema = getObjectSchema(InnerObjectSchema)
    expect(innerSchema).toBeDefined()
    expect(innerSchema?.type).toEqual('InnerObjectSchema')
    expect(innerSchema?.isObjectSchema).toBe(true)
    expect(innerSchema?.properties).toEqual({
      foo: { type: 'string', key: 'foo', order: 1 },
      bar: { type: 'number', key: 'bar', order: 2 },
    })
  })

  it('should resolve MixedSchema with various nested cases', () => {
    const schema = getObjectSchema(MixedSchema)
    expect(schema).toBeDefined()
    expect(schema?.type).toEqual('MixedSchema')

    // Array of strings.
    expect(schema?.properties.stringArray).toEqual({
      type: 'array',
      itemConfig: { type: 'string' },
      key: 'stringArray',
      order: 1,
    })

    // Array of objects.
    const expectedInner = getObjectSchema(InnerObjectSchema)
    expect(schema?.properties.objectArray).toEqual({
      type: 'array',
      itemConfig: {
        type: 'object',
        schema: expectedInner,
      },
      key: 'objectArray',
      order: 2,
    })

    // Nested object property.
    expect(schema?.properties.nestedObject).toEqual({
      type: 'object',
      order: 3,
      schema: {
        type: 'NestedObject',
        properties: {
          innerObjects: {
            type: 'array',
            itemConfig: {
              type: 'object',
              schema: expectedInner,
            },
          },
          singleString: { type: 'string', key: 'singleString' },
        },
        isObjectSchema: true,
      },
      key: 'nestedObject',
    })

    // Array of arrays.
    expect(schema?.properties.arrayOfArrays).toEqual({
      type: 'array',
      order: 4,
      itemConfig: {
        type: 'array',
        itemConfig: {
          type: 'object',
          schema: expectedInner,
        },
      },
      key: 'arrayOfArrays',
    })
  })

  it('should resolve deep nested schemas (object within array within object)', () => {
    const deepOuterSchema = getObjectSchema(DeepOuter)
    expect(deepOuterSchema).toBeDefined()
    expect(deepOuterSchema?.type).toEqual('DeepOuter')
    expect(deepOuterSchema?.properties.intermediate).toEqual({
      type: 'object',
      order: 1,
      schema: getObjectSchema(Intermediate),
      key: 'intermediate',
    })

    const intermediateSchema = getObjectSchema(Intermediate)
    expect(intermediateSchema).toBeDefined()
    expect(intermediateSchema?.properties.list).toEqual({
      type: 'array',
      order: 1,
      itemConfig: {
        type: 'object',
        schema: getObjectSchema(DeepInner),
      },
      key: 'list',
    })
  })

  // Additional test: combining arrays in an object and arrays in an array.
  @ObjectSchema()
  class Complex {
    @Port({
      type: 'object',
      schema: {
        type: 'ComplexNested',
        properties: {
          strings: {
            type: 'array',
            itemConfig: { type: 'string' },
          },
          objects: {
            type: 'array',
            itemConfig: { type: 'object', schema: InnerObjectSchema },
          },
        },
        isObjectSchema: true,
      },
    })
    nested: {
      strings: string[]
      objects: InnerObjectSchema[]
    } = { strings: [], objects: [] }

    @Port({
      type: 'array',
      itemConfig: {
        type: 'array',
        itemConfig: { type: 'number' },
      },
    })
    matrix: number[][] = []
  }

  it('should resolve the schema for a complex nested case', () => {
    const complexSchema = getObjectSchema(Complex)
    expect(complexSchema).toBeDefined()
    expect(complexSchema?.type).toEqual('Complex')
    // "nested" property check.
    expect(complexSchema?.properties.nested).toEqual({
      type: 'object',
      order: 1,
      schema: {
        type: 'ComplexNested',
        properties: {
          strings: {
            type: 'array',
            itemConfig: { type: 'string' },
          },
          objects: {
            type: 'array',
            itemConfig: {
              type: 'object',
              schema: getObjectSchema(InnerObjectSchema),
            },
          },
        },
        isObjectSchema: true,
      },
      key: 'nested',
    })
    // "matrix" property check.
    expect(complexSchema?.properties.matrix).toEqual({
      type: 'array',
      order: 2,
      itemConfig: {
        type: 'array',
        itemConfig: { type: 'number' },
      },
      key: 'matrix',
    })
  })
})
