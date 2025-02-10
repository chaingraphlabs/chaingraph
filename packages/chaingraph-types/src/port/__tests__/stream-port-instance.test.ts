/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { ArrayPortConfig, ArrayPortValue, IPortConfig } from '../base'
import { describe, expect, it } from 'vitest'
import { MultiChannel } from '../../utils/multi-channel'

import { createObjectPortConfig, createObjectSchema } from '../instances'
import { AnyPortPlugin } from '../plugins/AnyPortPlugin'
import { ArrayPortPlugin } from '../plugins/ArrayPortPlugin'
import { createObjectValue, ObjectPortPlugin } from '../plugins/ObjectPortPlugin'
import { createStreamValue, StreamPortPlugin } from '../plugins/StreamPortPlugin'
import { portRegistry } from '../registry'

portRegistry.register(StreamPortPlugin)
portRegistry.register(ArrayPortPlugin)
portRegistry.register(ObjectPortPlugin)
portRegistry.register(AnyPortPlugin)

describe('streamPort Instance (plain value storage)', () => {
  // Helper to drain values via async iteration.
  async function drainChannel<T>(channel: MultiChannel<T>): Promise<T[]> {
    const results: T[] = []
    for await (const item of channel) {
      results.push(item)
    }
    return results
  }

  describe('basic Streaming and Subscription', () => {
    it('should stream number values', async () => {
      const channel = new MultiChannel<number>()
      // Send plain numbers.
      channel.send(42)
      channel.send(100)
      channel.close()

      const streamValue = createStreamValue(channel)
      const received = await drainChannel(streamValue)
      // Expect plain numbers.
      expect(received).toEqual([42, 100])
    })

    it('should stream string values', async () => {
      const channel = new MultiChannel<string>()
      // Send plain string values.
      channel.send('hello')
      channel.send('world')
      channel.close()

      const streamValue = createStreamValue(channel)
      const received = await drainChannel(streamValue)
      expect(received).toEqual(['hello', 'world'])
    })

    it('should stream object values', async () => {
      // Create an object port value using plain objects.
      const objSchema = createObjectSchema({
        name: { type: 'string', minLength: 2 },
        age: { type: 'number', min: 0 },
      })
      const objConfig = createObjectPortConfig({
        type: 'object',
        schema: objSchema,
      })

      // Instead of wrapped objects, we use plain (unwrapped) objects.
      const objValue1 = createObjectValue({
        name: 'Alice',
        age: 30,
      })
      const objValue2 = createObjectValue({
        name: 'Bob',
        age: 40,
      })

      const channel = new MultiChannel<typeof objValue1>()
      channel.send(objValue1)
      channel.send(objValue2)
      channel.close()

      const streamValue = createStreamValue(channel)
      const received = await drainChannel(streamValue)
      expect(received).toEqual([objValue1, objValue2])
    })

    it('should stream arrays of objects', async () => {
      // Define an item object schema.
      const itemObjSchema = createObjectSchema({
        id: { type: 'number', min: 1 },
        title: { type: 'string', minLength: 3 },
      })
      // Build an array port config that uses an object port config as itemConfig.
      const arrayConfig: ArrayPortConfig = {
        type: 'array',
        itemConfig: createObjectPortConfig({
          type: 'object',
          schema: itemObjSchema,
        }),
        minLength: 1,
        maxLength: 5,
      }

      // Create two plain array values – note that the array port value is now a plain array.
      const arrValue1: ArrayPortValue = [
        createObjectValue({
          id: 1,
          title: 'First',
        }),
        createObjectValue({
          id: 2,
          title: 'Second',
        }),
      ]
      const arrValue2: ArrayPortValue = [
        createObjectValue({
          id: 3,
          title: 'Third',
        }),
      ]

      const channel = new MultiChannel<ArrayPortValue>()
      channel.send(arrValue1)
      channel.send(arrValue2)
      channel.close()

      const streamValue = createStreamValue(channel)
      const received = await drainChannel(streamValue)
      expect(received).toEqual([arrValue1, arrValue2])
    })
  })

  describe('serialization and Deserialization', () => {
    it('should correctly serialize and deserialize a stream port value containing various element types', async () => {
      // Create a channel and push a mix of plain elements: a number, a string, an object, and an array.
      const channel = new MultiChannel<any>()
      channel.send(123)
      channel.send('test string')

      // Create a plain object value.
      const objSchema = createObjectSchema({
        key: { type: 'string', minLength: 2 },
        value: { type: 'number', min: 0 },
      })
      const objValue = createObjectValue({
        key: 'abc',
        value: 456,
      })
      channel.send(objValue)

      // Create an array value whose items are plain objects.
      const itemSchema = createObjectSchema({
        prop: { type: 'string', minLength: 1 },
      })
      const arrayValue = [
        createObjectValue({ prop: 'one' }),
        createObjectValue({ prop: 'two' }),
      ]
      channel.send(arrayValue)

      channel.close()

      const originalStreamValue = createStreamValue(channel)
      // Serialize the stream port value.
      const serialized = StreamPortPlugin.serializeValue(originalStreamValue, {
        type: 'stream',
        itemConfig: { type: 'any' } as IPortConfig, // You may adjust the itemConfig as needed.
      })
      // Simulate a roundtrip via JSON.
      const jsonString = JSON.stringify(serialized)
      const parsed = JSON.parse(jsonString)
      const deserializedStreamValue = StreamPortPlugin.deserializeValue(parsed, {
        type: 'stream',
        itemConfig: { type: 'any' } as IPortConfig,
      })

      // Compare the buffers from the original and deserialized stream values.
      const originalBuffer = originalStreamValue.getBuffer()
      const deserializedBuffer = deserializedStreamValue.getBuffer()

      expect(deserializedBuffer).toEqual(originalBuffer)
    })
  })
})
