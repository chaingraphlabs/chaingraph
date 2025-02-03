import { beforeEach, describe, expect, it } from 'vitest'
import { SerializationRegistry } from '../../serialization/serializer'
import { MultiChannel } from '../multi-channel'

describe('multi channel', () => {
  let channel: MultiChannel<number>

  beforeEach(() => {
    channel = new MultiChannel<number>()
    SerializationRegistry.getInstance().registerClass('MultiChannel', MultiChannel)
  })

  describe('basic operations', () => {
    it('should send and receive values', async () => {
      const received: number[] = []
      const iterator = channel[Symbol.asyncIterator]()

      // Start receiving in background
      const receivePromise = (async () => {
        for await (const value of { [Symbol.asyncIterator]: () => iterator }) {
          received.push(value)
          if (value === 3)
            break
        }
      })()

      channel.send(1)
      channel.send(2)
      channel.send(3)

      await receivePromise
      expect(received).toEqual([1, 2, 3])
    })

    it('should handle batch sends', async () => {
      const received: number[] = []
      const iterator = channel[Symbol.asyncIterator]()

      const receivePromise = (async () => {
        for await (const value of { [Symbol.asyncIterator]: () => iterator }) {
          received.push(value)
          if (received.length === 3)
            break
        }
      })()

      channel.sendBatch([1, 2, 3])

      await receivePromise
      expect(received).toEqual([1, 2, 3])
    })

    it('should handle multiple subscribers', async () => {
      const received1: number[] = []
      const received2: number[] = []

      const iterator1 = channel[Symbol.asyncIterator]()
      const iterator2 = channel[Symbol.asyncIterator]()

      const receive1Promise = (async () => {
        for await (const value of { [Symbol.asyncIterator]: () => iterator1 }) {
          received1.push(value)
          if (value === 2)
            break
        }
      })()

      const receive2Promise = (async () => {
        for await (const value of { [Symbol.asyncIterator]: () => iterator2 }) {
          received2.push(value)
          if (value === 2)
            break
        }
      })()

      channel.send(1)
      channel.send(2)

      await Promise.all([receive1Promise, receive2Promise])
      expect(received1).toEqual([1, 2])
      expect(received2).toEqual([1, 2])
    })

    it('should handle channel closing', async () => {
      const received: number[] = []
      const iterator = channel[Symbol.asyncIterator]()

      const receivePromise = (async () => {
        for await (const value of { [Symbol.asyncIterator]: () => iterator }) {
          received.push(value)
        }
      })()

      channel.send(1)
      channel.send(2)
      channel.close()

      await receivePromise
      expect(received).toEqual([1, 2])
      expect(channel.isChannelClosed()).toBe(true)
    })
  })

  describe('serialization', () => {
    it('should serialize empty channel', () => {
      const serialized = channel.serialize()
      expect(serialized).toEqual({
        __type: 'MultiChannel',
        __version: 1,
        __data: {
          buffer: [],
          isClosed: false,
          version: 1,
        },
      })
    })

    it('should serialize channel with values', () => {
      channel.sendBatch([1, 2, 3])
      const serialized = channel.serialize()
      expect(serialized).toEqual({
        __type: 'MultiChannel',
        __version: 1,
        __data: {
          buffer: [1, 2, 3],
          isClosed: false,
          version: 1,
        },
      })
    })

    it('should serialize closed channel', () => {
      channel.sendBatch([1, 2])
      channel.close()
      const serialized = channel.serialize()
      expect(serialized).toEqual({
        __type: 'MultiChannel',
        __version: 1,
        __data: {
          buffer: [1, 2],
          isClosed: true,
          version: 1,
        },
      })
    })

    it('should deserialize and restore channel state', async () => {
      // Create and serialize original channel
      const original = new MultiChannel<number>()
      original.sendBatch([1, 2, 3])
      original.close()
      const serialized = original.serialize()

      // Deserialize to new channel
      const deserialized = MultiChannel.deserialize<number>(serialized)

      // Verify state
      expect(deserialized.getBuffer()).toEqual([1, 2, 3])
      expect(deserialized.isChannelClosed()).toBe(true)

      // Verify we can still read all values
      const received: number[] = []
      for await (const value of deserialized) {
        received.push(value)
      }
      expect(received).toEqual([1, 2, 3])
    })

    it('should handle empty buffer deserialization', () => {
      const serialized = {
        __type: 'MultiChannel',
        __version: 1,
        __data: {
          buffer: [],
          isClosed: false,
          version: 1,
        },
      }

      const deserialized = MultiChannel.deserialize<number>(serialized)
      expect(deserialized.getBuffer()).toEqual([])
      expect(deserialized.isChannelClosed()).toBe(false)
    })

    it('should handle complex value types', async () => {
      interface TestData {
        id: string
        value: number
      }

      const channel = new MultiChannel<TestData>()
      const data = { id: 'test', value: 42 }

      channel.send(data)
      const serialized = channel.serialize()
      const deserialized = MultiChannel.deserialize<TestData>(serialized)

      const received = await deserialized[Symbol.asyncIterator]().next()
      expect(received.value).toEqual(data)
    })
  })

  describe('error handling', () => {
    it('should throw when sending to closed channel', () => {
      channel.close()
      expect(() => channel.send(1)).toThrow('Cannot send to a closed channel.')
    })

    it('should throw when batch sending to closed channel', () => {
      channel.close()
      expect(() => channel.sendBatch([1, 2])).toThrow('Cannot send to a closed channel.')
    })

    it('should handle early iterator termination', async () => {
      const iterator = channel[Symbol.asyncIterator]()

      channel.send(1)
      const result1 = await iterator.next()
      expect(result1).toEqual({ value: 1, done: false })

      if (!iterator.return) {
        throw new Error('Iterator does not support early termination')
      }
      const result2 = await iterator.return()
      expect(result2).toEqual({ value: undefined, done: true })

      const result3 = await iterator.next()
      expect(result3).toEqual({ value: undefined, done: true })
    })

    it('should handle invalid serialized data', () => {
      const invalidData = {
        __type: 'MultiChannel',
        __version: 1,
        __data: {
          // Missing required fields
        },
      }

      expect(() => MultiChannel.deserialize(invalidData)).toThrow()
    })

    it('should maintain subscriber count', () => {
      const iterator1 = channel[Symbol.asyncIterator]()
      const iterator2 = channel[Symbol.asyncIterator]()

      expect(channel.getSubscriberCount()).toBe(2)

      if (!iterator1.return) {
        throw new Error('Iterator does not support early termination')
      }
      iterator1.return() // Early termination
      expect(channel.getSubscriberCount()).toBe(1)

      channel.close() // Should remove remaining subscriber
    })
  })
})
