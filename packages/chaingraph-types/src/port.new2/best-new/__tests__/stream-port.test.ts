import type { IPortValue } from '../base/types'
import { beforeAll, describe, expect, it } from 'vitest'
import { MultiChannel } from '../channel/multi-channel'
import { createNumberValue, NumberPortPlugin } from '../plugins/NumberPortPlugin'
import {
  createStreamConfig,
  createStreamValue,
  StreamPortPlugin,
  validateStreamValue,
} from '../plugins/StreamPortPlugin'
import { createStringValue, StringPortPlugin } from '../plugins/StringPortPlugin'
import { portRegistry } from '../registry/PortRegistry'

describe('stream port plugin', () => {
  beforeAll(() => {
    // Register required plugins
    portRegistry.register(StringPortPlugin)
    portRegistry.register(NumberPortPlugin)
    portRegistry.register(StreamPortPlugin)
  })

  describe('validation', () => {
    it('should validate basic stream structure', () => {
      const config = createStreamConfig(StringPortPlugin.configSchema.parse({
        type: 'string',
      }))

      // Test valid stream
      const channel = new MultiChannel<IPortValue>()
      channel.send(createStringValue('test'))
      const validValue = createStreamValue(channel)
      expect(validateStreamValue(validValue, config)).toHaveLength(0)

      // Test invalid structure
      const invalidValue = { type: 'stream', invalid: true }
      expect(validateStreamValue(invalidValue, config)).toContain(
        'Invalid stream value structure',
      )
    })
  })

  describe('serialization', () => {
    it('should serialize and deserialize stream values', () => {
      const channel = new MultiChannel<IPortValue>()
      channel.send(createStringValue('hello'))
      channel.send(createNumberValue(42))
      const original = createStreamValue(channel)

      // Serialize
      const serialized = StreamPortPlugin.serializeValue(original) as {
        type: 'stream'
        buffer: IPortValue[]
        isClosed: boolean
      }
      expect(serialized).toEqual({
        type: 'stream',
        buffer: [
          createStringValue('hello'),
          createNumberValue(42),
        ],
        isClosed: false,
      })

      // Deserialize
      const deserialized = StreamPortPlugin.deserializeValue(serialized)
      expect(deserialized.type).toBe('stream')
      expect(deserialized.channel.getBuffer()).toEqual([
        createStringValue('hello'),
        createNumberValue(42),
      ])
      expect(deserialized.channel.isChannelClosed()).toBe(false)
    })

    it('should handle closed channels', () => {
      const channel = new MultiChannel<IPortValue>()
      channel.send(createStringValue('test'))
      channel.close()
      const original = createStreamValue(channel)

      // Serialize
      const serialized = StreamPortPlugin.serializeValue(original) as {
        type: 'stream'
        buffer: IPortValue[]
        isClosed: boolean
      }
      expect(serialized.isClosed).toBe(true)

      // Deserialize
      const deserialized = StreamPortPlugin.deserializeValue(serialized)
      expect(deserialized.channel.isChannelClosed()).toBe(true)
    })

    it('should handle invalid serialization input', () => {
      // Invalid structure
      expect(() => StreamPortPlugin.serializeValue({
        type: 'stream',
        invalid: true,
      } as any)).toThrow('Invalid stream value structure')
    })

    it('should handle invalid deserialization input', () => {
      // Invalid structure
      expect(() => StreamPortPlugin.deserializeValue({
        type: 'stream',
        invalid: true,
      })).toThrow('Invalid stream value structure')
    })
  })

  describe('schema validation', () => {
    it('should validate config schema', () => {
      const result = StreamPortPlugin.configSchema.safeParse({
        type: 'stream',
        itemConfig: { type: 'string' },
      })
      expect(result.success).toBe(true)

      const invalidResult = StreamPortPlugin.configSchema.safeParse({
        type: 'stream',
        itemConfig: { type: 'unknown' },
      })
      expect(invalidResult.success).toBe(false)
    })

    it('should validate value schema', () => {
      const channel = new MultiChannel<IPortValue>()
      const result = StreamPortPlugin.valueSchema.safeParse({
        type: 'stream',
        channel,
      })
      expect(result.success).toBe(true)

      const invalidResult = StreamPortPlugin.valueSchema.safeParse({
        type: 'stream',
        channel: 'not a channel',
      })
      expect(invalidResult.success).toBe(false)
    })
  })

  describe('config serialization', () => {
    it('should serialize config with all fields', () => {
      const config = createStreamConfig(
        StringPortPlugin.configSchema.parse({
          type: 'string',
          minLength: 2,
          maxLength: 10,
          pattern: '^[a-z]+$',
        }),
        {
          name: 'test',
          id: 'test-id',
          metadata: { custom: 'value' },
        },
      )

      const serialized = StreamPortPlugin.serializeConfig(config)
      expect(serialized).toStrictEqual({
        type: 'stream',
        name: 'test',
        id: 'test-id',
        itemConfig: {
          type: 'string',
          minLength: 2,
          maxLength: 10,
          pattern: '^[a-z]+$',
        },
        metadata: { custom: 'value' },
      })
    })

    it('should serialize minimal config', () => {
      const config = createStreamConfig(
        StringPortPlugin.configSchema.parse({
          type: 'string',
        }),
      )
      const serialized = StreamPortPlugin.serializeConfig(config)
      expect(serialized).toStrictEqual({
        type: 'stream',
        itemConfig: {
          type: 'string',
        },
      })
    })

    it('should deserialize config with all fields', () => {
      const data = {
        type: 'stream',
        name: 'test',
        id: 'test-id',
        itemConfig: {
          type: 'string',
          minLength: 2,
          maxLength: 10,
          pattern: '^[a-z]+$',
        },
        metadata: { custom: 'value' },
      }

      const deserialized = StreamPortPlugin.deserializeConfig(data)
      expect(deserialized).toStrictEqual(data)
    })

    it('should deserialize minimal config', () => {
      const data = {
        type: 'stream',
        itemConfig: {
          type: 'string',
        },
      }

      const deserialized = StreamPortPlugin.deserializeConfig(data)
      expect(deserialized).toStrictEqual(data)
    })

    it('should throw on invalid config deserialization input', () => {
      expect(() => StreamPortPlugin.deserializeConfig({
        type: 'stream',
        itemConfig: {
          type: 'unknown',
        },
      })).toThrow()

      expect(() => StreamPortPlugin.deserializeConfig({
        type: 'string',
      })).toThrow()

      expect(() => StreamPortPlugin.deserializeConfig({
        type: 'stream',
        itemConfig: {
          type: 'string',
        },
        unknownField: true,
      })).not.toThrow() // passthrough allows extra fields
    })

    it('should maintain metadata types during serialization roundtrip', () => {
      const config = createStreamConfig(
        StringPortPlugin.configSchema.parse({
          type: 'string',
        }),
        {
          metadata: {
            number: 42,
            string: 'test',
            boolean: true,
            array: [1, 2, 3],
            object: { nested: 'value' },
          },
        },
      )

      const serialized = StreamPortPlugin.serializeConfig(config)
      const deserialized = StreamPortPlugin.deserializeConfig(serialized)

      expect(deserialized).toStrictEqual(config)
      expect(deserialized.metadata).toStrictEqual(config.metadata)
    })
  })

  describe('channel functionality', () => {
    it('should support multiple subscribers', async () => {
      const channel = new MultiChannel<IPortValue>()
      const value = createStreamValue(channel)

      // Create two subscribers
      const subscriber1Values: IPortValue[] = []
      const subscriber2Values: IPortValue[] = []

      const subscriber1 = (async () => {
        for await (const item of value.channel) {
          subscriber1Values.push(item)
        }
      })()

      const subscriber2 = (async () => {
        for await (const item of value.channel) {
          subscriber2Values.push(item)
        }
      })()

      // Send some values
      channel.send(createStringValue('hello'))
      channel.send(createNumberValue(42))
      channel.close()

      // Wait for subscribers to finish
      await Promise.all([subscriber1, subscriber2])

      // Both subscribers should have received all values
      expect(subscriber1Values).toEqual([
        createStringValue('hello'),
        createNumberValue(42),
      ])
      expect(subscriber2Values).toEqual([
        createStringValue('hello'),
        createNumberValue(42),
      ])
    })

    it('should handle batch sending', () => {
      const channel = new MultiChannel<IPortValue>()
      const value = createStreamValue(channel)

      const items = [
        createStringValue('one'),
        createStringValue('two'),
        createStringValue('three'),
      ]

      channel.sendBatch(items)
      expect(value.channel.getBuffer()).toEqual(items)
    })
  })
})
