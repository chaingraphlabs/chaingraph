import type { ArrayPortConfig, ArrayPortValue, NumberPortValue, StringPortValue } from '../base/types'
import { beforeEach, describe, expect, it } from 'vitest'
import { MultiChannel } from '../channel/multi-channel'
// Note: For the ObjectPort and its helpers, we import from the instances folder.
import { createObjectPortConfig, createObjectSchema } from '../instances/ObjectPort'
import { createObjectValue, ObjectPortPlugin } from '../plugins'
import { ArrayPortPlugin } from '../plugins/ArrayPortPlugin'
import { createNumberValue, NumberPortPlugin } from '../plugins/NumberPortPlugin'
import { createStreamValue, StreamPortPlugin } from '../plugins/StreamPortPlugin'
import { createStringValue, StringPortPlugin } from '../plugins/StringPortPlugin'
import { portRegistry } from '../registry/PortRegistry'

describe('streamPort Instance', () => {
  beforeEach(() => {
    // Reset the registry and register all needed plugins.
    portRegistry.clear()
    portRegistry.register(NumberPortPlugin)
    portRegistry.register(StringPortPlugin)
    portRegistry.register(ObjectPortPlugin)
    portRegistry.register(ArrayPortPlugin)
    portRegistry.register(StreamPortPlugin)
  })

  // Helper function to drain values from a MultiChannel using async iteration.
  async function drainChannel<T>(channel: MultiChannel<T>): Promise<T[]> {
    const results: T[] = []
    for await (const item of channel) {
      results.push(item)
    }
    return results
  }

  describe('basic Streaming and Subscription', () => {
    it('should stream number values', async () => {
      const channel = new MultiChannel<NumberPortValue>()
      // Send a couple of number port values.
      channel.send(createNumberValue(42))
      channel.send(createNumberValue(100))
      channel.close()

      const streamValue = createStreamValue(channel)

      // Collect values using async iteration.
      const received = await drainChannel(streamValue.value)
      expect(received).toEqual([
        createNumberValue(42),
        createNumberValue(100),
      ])
    })

    it('should stream string values', async () => {
      const channel = new MultiChannel<StringPortValue>()
      channel.send(createStringValue('hello'))
      channel.send(createStringValue('world'))
      channel.close()

      const streamValue = createStreamValue(channel)
      const received = await drainChannel(streamValue.value)
      expect(received).toEqual([
        createStringValue('hello'),
        createStringValue('world'),
      ])
    })

    it('should stream object values', async () => {
      // Create an object port value.
      const objSchema = createObjectSchema({
        name: { type: 'string', minLength: 2 },
        age: { type: 'number', min: 0 },
      })
      const objConfig = createObjectPortConfig({
        type: 'object',
        schema: objSchema,
      })

      // Create two different object port values.
      const objValue1 = createObjectValue({
        name: { type: 'string', value: 'Alice' },
        age: { type: 'number', value: 30 },
      })
      const objValue2 = createObjectValue({
        name: { type: 'string', value: 'Bob' },
        age: { type: 'number', value: 40 },
      })

      const channel = new MultiChannel<typeof objValue1>()
      channel.send(objValue1)
      channel.send(objValue2)
      channel.close()

      const streamValue = createStreamValue(channel)
      const received = await drainChannel(streamValue.value)
      expect(received).toEqual([objValue1, objValue2])
    })

    it('should stream arrays of objects', async () => {
      // Here we simulate an array port value whose items are objects.
      // Define a simple item object schema.
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

      // Create two array values:
      const arrValue1: ArrayPortValue = {
        type: 'array',
        value: [
          // Each element is an object port value.
          createObjectValue({
            id: { type: 'number', value: 1 },
            title: { type: 'string', value: 'First' },
          }),
          createObjectValue({
            id: { type: 'number', value: 2 },
            title: { type: 'string', value: 'Second' },
          }),
        ],
      }
      const arrValue2: ArrayPortValue = {
        type: 'array',
        value: [
          createObjectValue({
            id: { type: 'number', value: 3 },
            title: { type: 'string', value: 'Third' },
          }),
        ],
      }

      // For this test, we register the ArrayPortPlugin already.
      const channel = new MultiChannel<typeof arrValue1>()
      channel.send(arrValue1)
      channel.send(arrValue2)
      channel.close()

      const streamValue = createStreamValue(channel)
      const received = await drainChannel(streamValue.value)
      expect(received).toEqual([arrValue1, arrValue2])
    })
  })

  describe('serialization and Deserialization', () => {
    it('should correctly serialize and deserialize the stream port value containing various element types', async () => {
      // Create a stream channel and push a mix of elements.
      const channel = new MultiChannel<any>()
      // We'll send a number, a string, an object, and an array of objects.
      channel.send(createNumberValue(123))
      channel.send(createStringValue('test string'))

      // Create an object value.
      const objSchema = createObjectSchema({
        key: { type: 'string', minLength: 2 },
        value: { type: 'number', min: 0 },
      })
      const objValue = createObjectValue({
        key: { type: 'string', value: 'abc' },
        value: { type: 'number', value: 456 },
      })
      channel.send(objValue)

      // Create an array value of objects.
      const itemSchema = createObjectSchema({
        prop: { type: 'string', minLength: 1 },
      })
      const arrayValue = {
        type: 'array',
        value: [
          createObjectValue<typeof itemSchema>({ prop: { type: 'string', value: 'one' } }),
          createObjectValue<typeof itemSchema>({ prop: { type: 'string', value: 'two' } }),
        ],
      }
      channel.send(arrayValue)

      channel.close()

      // Create the stream port value.
      const originalStreamValue = createStreamValue(channel)

      // Serialize the stream port value.
      const serialized = StreamPortPlugin.serializeValue(originalStreamValue) as any
      // Simulate full roundtrip using JSON stringification.
      const jsonString = JSON.stringify(serialized)
      const parsed = JSON.parse(jsonString)
      const deserializedStreamValue = StreamPortPlugin.deserializeValue(parsed)

      // Since MultiChannel does not compare by reference, we collect the buffers.
      const originalBuffer = originalStreamValue.value.getBuffer()
      const deserializedBuffer = deserializedStreamValue.value.getBuffer()

      expect(deserializedStreamValue.type).toBe('stream')
      expect(deserializedBuffer).toEqual(originalBuffer)
    })
  })
})
