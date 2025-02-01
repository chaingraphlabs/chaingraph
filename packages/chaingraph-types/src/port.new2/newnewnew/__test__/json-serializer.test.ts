import type { JSONValue } from '../json'
import {
  recursiveSerialize,
  safeJSONValueSchema,
} from '@chaingraph/types/port.new2/newnewnew/safe-json-serializer'
import { describe, expect, it } from 'vitest'

// A custom class that implements JSONSerializable
class CustomSerializable implements Record<string, unknown> {
  private value: number
  constructor(value: number) {
    this.value = value
  }

  [x: string]: unknown

  serialize(): JSONValue {
    // For example, return an object with a custom key.
    return { custom: this.value }
  }

  deserialize(_input: JSONValue): CustomSerializable {
    // Not needed for this test.
    return this
  }
}

describe('recursiveSerialize', () => {
  it('should return primitives unchanged', () => {
    expect(recursiveSerialize('hello')).toEqual('hello')
    expect(recursiveSerialize(123)).toEqual(123)
    expect(recursiveSerialize(true)).toEqual(true)
    expect(recursiveSerialize(null)).toEqual(null)
  })

  it('should recursively serialize arrays', () => {
    const input = [1, 'two', null, [3, 4]]
    expect(recursiveSerialize(input)).toEqual([1, 'two', null, [3, 4]])
  })

  it('should recursively serialize plain objects', () => {
    const input = { a: 1, b: 'two', c: { d: 3 } }
    expect(recursiveSerialize(input)).toEqual({ a: 1, b: 'two', c: { d: 3 } })
  })

  it('should serialize objects that implement JSONSerializable', () => {
    const custom = new CustomSerializable(42)
    const input = { foo: custom, bar: 'test' }
    const expected = { foo: { custom: 42 }, bar: 'test' }
    expect(recursiveSerialize(input)).toEqual(expected)
  })

  it('safeJSONValueSchema should validate and transform input', () => {
    const custom = new CustomSerializable(99)
    const input = { x: custom, y: [custom, 'hello'] }
    const result = safeJSONValueSchema.parse(input)
    expect(result).toEqual({
      x: { custom: 99 },
      y: [{ custom: 99 }, 'hello'],
    })
  })
})
