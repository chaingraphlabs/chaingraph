import type { ConfigFromPortType } from '../config/types'
import { beforeAll, describe, expect, it } from 'vitest'
import { MultiChannel } from '../channel/multi-channel'
import { PortDirection, PortType } from '../config/constants'
import { StreamPort } from '../ports/stream.port'
import { registerTestPorts } from '../registry/register-ports'
import { SerializationRegistry } from '../serialization/serializer'

describe('stream port', () => {
  // Register required port types and serializers before running tests
  beforeAll(() => {
    registerTestPorts(
      PortType.Stream,
      PortType.Number,
      PortType.String,
      PortType.Object,
    )
    SerializationRegistry.getInstance().registerClass('MultiChannel', MultiChannel)
  })

  describe('basic functionality', () => {
    it('should create stream port with minimal config', () => {
      const config: ConfigFromPortType<PortType.Stream> = {
        type: PortType.Stream,
        mode: 'input',
        valueType: { type: PortType.Number },
      }

      const port = new StreamPort(config)
      expect(port.config).toEqual(config)
      expect(port.hasValue()).toBe(false)
    })

    it('should set and get value', async () => {
      const port = new StreamPort<number>({
        type: PortType.Stream,
        mode: 'input',
        valueType: { type: PortType.Number },
      })

      const channel = new MultiChannel<number>()
      port.setValue(channel)

      channel.send(42)
      const values = await collectStreamValues(port.getValue(), 1)
      expect(values).toEqual([42])
    })

    it('should reset value', () => {
      const port = new StreamPort<number>({
        type: PortType.Stream,
        mode: 'input',
        valueType: { type: PortType.Number },
      })

      const channel = new MultiChannel<number>()
      port.setValue(channel)
      port.reset()
      expect(port.hasValue()).toBe(false)
    })
  })

  describe('channel operations', () => {
    it('should handle input stream with buffering', async () => {
      const port = new StreamPort<number>({
        type: PortType.Stream,
        mode: 'input',
        valueType: { type: PortType.Number },
        bufferSize: 3,
      })

      const channel = new MultiChannel<number>()
      port.setValue(channel)

      // Send values to the channel
      channel.send(1)
      channel.send(2)
      channel.send(3)

      const values = await collectStreamValues(port.getValue(), 3)
      expect(values).toEqual([1, 2, 3])
    })

    it('should handle output stream with complex data', async () => {
      interface DataPoint {
        timestamp: number
        value: number
      }

      const port = new StreamPort<DataPoint>({
        type: PortType.Stream,
        mode: 'output',
        valueType: {
          type: PortType.Object,
          schema: {
            properties: {
              timestamp: { type: PortType.Number },
              value: { type: PortType.Number },
            },
          },
        },
      })

      const channel = new MultiChannel<DataPoint>()
      port.setValue(channel)

      const data = { timestamp: Date.now(), value: 42 }
      channel.send(data)

      const values = await collectStreamValues(port.getValue(), 1)
      expect(values).toEqual([data])
    })

    it('should handle batch operations', async () => {
      const port = new StreamPort<string>({
        type: PortType.Stream,
        mode: 'input',
        valueType: { type: PortType.String },
      })

      const channel = new MultiChannel<string>()
      port.setValue(channel)

      const batch = ['one', 'two', 'three']
      channel.sendBatch(batch)

      const values = await collectStreamValues(port.getValue(), batch.length)
      expect(values).toEqual(batch)
    })
  })

  describe('validation', () => {
    it('should validate buffer size', () => {
      expect(() => new StreamPort({
        type: PortType.Stream,
        mode: 'input',
        valueType: { type: PortType.Number },
        bufferSize: -1, // Invalid buffer size
      })).toThrow()
    })
  })

  describe('error handling', () => {
    it('should reject invalid mode', () => {
      const invalidConfig: ConfigFromPortType<PortType.Stream> = {
        type: PortType.Stream,
        mode: 'invalid' as 'input' | 'output',
        valueType: { type: PortType.Number },
      }

      expect(() => new StreamPort(invalidConfig)).toThrow()
    })

    it('should reject missing value type', () => {
      const invalidConfig = {
        type: PortType.Stream,
        mode: 'input',
      } as const

      // @ts-expect-error Testing missing valueType
      expect(() => new StreamPort(invalidConfig)).toThrow()
    })

    it('should reject non-channel values', () => {
      const port = new StreamPort<number>({
        type: PortType.Stream,
        mode: 'input',
        valueType: { type: PortType.Number },
      })

      expect(() => port.setValue('not a channel' as any)).toThrow()
      expect(() => port.setValue(42 as any)).toThrow()
      expect(() => port.setValue([] as any)).toThrow()
      expect(() => port.setValue(null as any)).toThrow()
    })
  })

  describe('events', () => {
    it('should emit value change events', () => {
      const port = new StreamPort<number>({
        type: PortType.Stream,
        mode: 'input',
        valueType: { type: PortType.Number },
      })

      const events: any[] = []
      port.on('value:change', (event, data) => {
        events.push({ event, data })
      })

      const channel1 = new MultiChannel<number>()
      const channel2 = new MultiChannel<number>()

      port.setValue(channel1)
      port.setValue(channel2)

      expect(events).toHaveLength(2)
      expect(events[0].data).toEqual({
        oldValue: undefined,
        newValue: channel1,
      })
      expect(events[1].data).toEqual({
        oldValue: channel1,
        newValue: channel2,
      })
    })

    it('should emit reset events', () => {
      const port = new StreamPort<number>({
        type: PortType.Stream,
        mode: 'input',
        valueType: { type: PortType.Number },
      })

      const channel = new MultiChannel<number>()
      port.setValue(channel)

      const events: any[] = []
      port.on('value:reset', (event, data) => {
        events.push({ event, data })
      })

      port.reset()

      expect(events).toHaveLength(1)
      expect(events[0].data).toEqual({
        oldValue: channel,
      })
    })
  })

  describe('common port properties', () => {
    it('should handle optional properties', () => {
      const port = new StreamPort({
        type: PortType.Stream,
        mode: 'input',
        valueType: { type: PortType.Number },
        id: 'test-stream',
        title: 'Test Stream',
        description: 'A test stream port',
        direction: PortDirection.Input,
        optional: true,
        metadata: {
          custom: 'value',
        },
      })

      expect(port.config.id).toBe('test-stream')
      expect(port.config.title).toBe('Test Stream')
      expect(port.config.description).toBe('A test stream port')
      expect(port.config.direction).toBe(PortDirection.Input)
      expect(port.config.optional).toBe(true)
      expect(port.config.metadata).toEqual({ custom: 'value' })
    })
  })
})

/**
 * Helper function to collect values from a stream
 */
async function collectStreamValues<T>(
  channel: MultiChannel<T>,
  count: number,
): Promise<T[]> {
  const values: T[] = []
  for await (const value of channel) {
    values.push(value)
    if (values.length === count)
      break
  }
  return values
}
