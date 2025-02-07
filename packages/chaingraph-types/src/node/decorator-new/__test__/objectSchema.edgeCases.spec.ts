/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import { describe, expect, it } from 'vitest'
import { getObjectSchema, ObjectSchema, resolveObjectSchema } from '../object-schema.decorator'
import { Port } from '../port.decorator'
import 'reflect-metadata'

/**
 * This file introduces additional edge case tests for object and array schema normalization.
 * It covers situations such as:
 *   - Missing required "schema" in object ports.
 *   - Empty object schemas.
 *   - Nested arrays with empty or borderline configurations.
 *   - Passing non-decorated classes as schemas.
 */

// Test case 1: Ensure that declaring an object port without providing a schema throws an error.
describe('edge case: Missing schema for object port', () => {
  // We define a class where a property is declared with type "object" but without a "schema".
  let error: Error | null = null

  try {
    // Attempt to define a dummy class that triggers error in decorator.
    class MissingSchemaNode {
      // @ts-expect-error – this is intentional to test the error.
      @Port({ type: 'object' })
      public faultyProp: any
    }
  } catch (err) {
    error = err as Error
  }

  it('should throw an error if "schema" is not provided for an object port', () => {
    expect(error).toBeInstanceOf(Error)
    expect(error?.message).toContain('must provide a "schema"')
  })
})

// Test case 2: Check normalization of an empty object schema (class decorated with @ObjectSchema but having no decorated properties)
describe('edge case: Empty object schema', () => {
  @ObjectSchema()
  class EmptySchema {}

  it('should return an object schema with empty properties', () => {
    const schema = getObjectSchema(EmptySchema)
    expect(schema).toBeDefined()
    expect(schema?.type).toEqual('EmptySchema')
    expect(schema?.isObjectSchema).toBe(true)
    // There should be no properties in the schema
    expect(Object.keys(schema?.properties || {})).toHaveLength(0)
  })
})

// Test case 3: Nested arrays and objects with borderline configurations.
// Here we define a class with a property that is an array of objects,
// but the inner object has an empty object schema.
describe('edge case: Array of objects with empty object schema', () => {
  @ObjectSchema()
  class EmptyInnerSchema {}

  @ObjectSchema()
  class TestNodeWithEmptyArray {
    @Port({
      type: 'array',
      itemConfig: { type: 'object', schema: EmptyInnerSchema },
    })
    public emptyObjectArray: any[] = []
  }

  it('should normalize itemConfig.schema to a plain object schema even if inner schema is empty', () => {
    const schema = getObjectSchema(TestNodeWithEmptyArray)
    // Expected schema for emptyObjectArray – the schema of the array item must be normalized.
    const expectedInner = getObjectSchema(EmptyInnerSchema)
    expect(schema?.properties.emptyObjectArray).toEqual({
      type: 'array',
      itemConfig: {
        type: 'object',
        schema: expectedInner,
      },
      key: 'emptyObjectArray',
    })
  })
})

// Test case 4: Deeply nested arrays and objects with varying levels of emptiness.
// This test verifies that multiple layers of normalization produce the expected structure.
describe('edge case: Deeply nested arrays and objects', () => {
  @ObjectSchema()
  class InnerSchema {
    @Port({ type: 'string' })
    public a: string = 'defaultA'
  }

  @ObjectSchema()
  class MiddleSchema {
    @Port({
      type: 'array',
      itemConfig: { type: 'object', schema: InnerSchema },
    })
    public innerArray: any[] = []
  }

  @ObjectSchema()
  class OuterSchema {
    @Port({
      type: 'object',
      schema: MiddleSchema,
    })
    public middle: MiddleSchema = new MiddleSchema()
  }

  it('should recursively normalize nested array and object schemas', () => {
    const outer = getObjectSchema(OuterSchema)
    expect(outer).toBeDefined()
    expect(outer?.type).toEqual('OuterSchema')

    // For the property "middle", the normalized schema should equal the resolved schema of MiddleSchema.
    const middleExpected = getObjectSchema(MiddleSchema)
    expect(outer?.properties.middle).toEqual({
      type: 'object',
      schema: middleExpected,
      key: 'middle',
    })

    // For the inner array property within MiddleSchema, check as well.
    const middleSchema = getObjectSchema(MiddleSchema)
    const innerExpected = getObjectSchema(InnerSchema)
    expect(middleSchema?.properties.innerArray).toEqual({
      type: 'array',
      itemConfig: {
        type: 'object',
        schema: innerExpected,
      },
      key: 'innerArray',
    })
  })
})

// Test case 5: When passing non-decorated classes as schema,
// ensure that an appropriate error is thrown.
describe('edge case: Non-decorated class as schema', () => {
  class NotDecorated {
    public x: number = 1
  }

  it('should throw error when resolving schema from a non-decorated class', () => {
    expect(() => {
      // Directly call resolveObjectSchema with a non-decorated class.
      // We have to import resolveObjectSchema from the object-schema.decorator.
      resolveObjectSchema(NotDecorated)
    }).toThrowError(/is not decorated with @ObjectSchema/)
  })
})
