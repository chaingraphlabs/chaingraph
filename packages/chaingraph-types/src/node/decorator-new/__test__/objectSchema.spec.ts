/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import { isObjectPortConfig } from '@badaitech/chaingraph-types/port/base'
import { describe, expect, it } from 'vitest'
import { getObjectSchema, ObjectSchema } from '../object-schema.decorator'
import { Port } from '../port.decorator'
import 'reflect-metadata'

@ObjectSchema()
class InnerObjectSchema {
  // Every property must be decorated with @Port so that explicit type information is provided.
  // (In this example we assume that your existing @Port decorator stores { type: string } etc.)
  // For demonstration the config is minimal.
  @Port({ type: 'string' })
  foo: string = 'defaultFoo'

  @Port({ type: 'number' })
  bar: number = 0
}

@ObjectSchema()
class OuterObjectSchema {
  @Port({ type: 'string' })
  hello: string = 'hello'

  @Port({ type: 'string' })
  world: string = 'world'

  // Case 1: explicit schema (using resolve or providing a plain object)
  @Port({
    type: 'object',
    schema: {
      type: 'InnerObjectSchema',
      properties: {
        foo: { type: 'string' },
        bar: { type: 'number' },
      },
      isObjectSchema: true,
    },
  })
  innerExplicit: InnerObjectSchema = new InnerObjectSchema()

  // Case 2: class with @ObjectSchema decorator
  @Port({ type: 'object', schema: InnerObjectSchema })
  innerClass: InnerObjectSchema = new InnerObjectSchema()
}

describe('advanced ObjectSchema system', () => {
  it('should resolve the inner schema correctly', () => {
    const innerSchema = getObjectSchema(InnerObjectSchema)
    expect(innerSchema).toBeDefined()
    expect(innerSchema?.type).toEqual('InnerObjectSchema')
    expect(innerSchema?.isObjectSchema).toBe(true)
    expect(innerSchema?.properties).toEqual({
      foo: { type: 'string', key: 'foo' },
      bar: { type: 'number', key: 'bar' },
    })
  })

  it('should resolve the outer schema with all three object schema cases', () => {
    const outerSchema = getObjectSchema(OuterObjectSchema)
    expect(outerSchema).toBeDefined()
    expect(outerSchema?.type).toEqual('OuterObjectSchema')

    expect(outerSchema?.properties.hello).toEqual({ type: 'string', key: 'hello' })
    expect(outerSchema?.properties.world).toEqual({ type: 'string', key: 'world' })

    // For explicit schema, the config should be exactly what was provided.
    expect(outerSchema?.properties.innerExplicit).toEqual({
      type: 'object',
      schema: {
        type: 'InnerObjectSchema',
        properties: {
          foo: { type: 'string' },
          bar: { type: 'number' },
        },
        isObjectSchema: true,
      },
      key: 'innerExplicit',
    })

    // For class-supplied schema, it should resolve to the metadata for InnerObjectSchema.
    const expectedInnerSchema = getObjectSchema(InnerObjectSchema)
    if (isObjectPortConfig(outerSchema?.properties.innerClass)) {
      expect(outerSchema?.properties.innerClass.schema).toEqual(expectedInnerSchema)
    } else {
      throw new Error('Expected object port config')
    }
  })
})
