import { beforeAll, describe, expect, it } from 'vitest'
import { MultiChannel } from '../channel'
import { PortDirection, PortType } from '../config/constants'
import { SerializationRegistry } from '../serialization/serializer'
import { isPortType, validatePortConfig, validatePortConfigType } from '../validation'

describe('stream port configurations', () => {
  // Register MultiChannel for serialization
  beforeAll(() => {
    SerializationRegistry.getInstance().registerClass('MultiChannel', MultiChannel)
  })

  describe('stream input ports', () => {
    const streamInputConfig = {
      type: PortType.Stream,
      id: 'test-stream-input',
      title: 'Test Stream Input',
      direction: PortDirection.Input,
      mode: 'input',
      valueType: {
        type: PortType.Number,
        validation: {
          min: 0,
          max: 100,
        },
      },
      bufferSize: 10,
    } as const

    it('should validate correct stream input config', () => {
      const validated = validatePortConfigType(streamInputConfig, PortType.Stream)
      expect(isPortType(validated, PortType.Stream)).toBe(true)
      expect(isPortType(validated.valueType, PortType.Number)).toBe(true)
    })

    it('should handle stream with channel value', async () => {
      const channel = new MultiChannel<number>()
      channel.send(1)
      channel.send(2)
      channel.send(3)

      const configWithChannel = {
        ...streamInputConfig,
        defaultValue: null,
      } as const

      const validated = validatePortConfigType(configWithChannel, PortType.Stream)
      expect(channel).toBeInstanceOf(MultiChannel)

      // Verify channel data is preserved
      const values: number[] = []
      for await (const value of channel) {
        values.push(value)
        if (values.length === 3)
          break // Break after getting all values
      }
      expect(values).toEqual([1, 2, 3])
    }, { timeout: 10000 }) // Increase timeout for async operations

    it('should validate stream input with different value types', () => {
      const stringStreamConfig = {
        ...streamInputConfig,
        valueType: {
          type: PortType.String,
          validation: {
            minLength: 1,
          },
        },
      } as const
      const validated = validatePortConfigType(stringStreamConfig, PortType.Stream)
      expect(isPortType(validated.valueType, PortType.String)).toBe(true)
    })
  })

  describe('stream output ports', () => {
    const streamOutputConfig = {
      type: PortType.Stream,
      id: 'test-stream-output',
      title: 'Test Stream Output',
      direction: PortDirection.Output,
      mode: 'output',
      valueType: {
        type: PortType.Object,
        schema: {
          properties: {
            timestamp: {
              type: PortType.Number,
            },
            value: {
              type: PortType.Number,
            },
          },
          required: ['timestamp', 'value'],
        },
      },
      bufferSize: 5,
    } as const

    it('should validate correct stream output config', () => {
      const validated = validatePortConfigType(streamOutputConfig, PortType.Stream)
      expect(isPortType(validated, PortType.Stream)).toBe(true)
      expect(isPortType(validated.valueType, PortType.Object)).toBe(true)
    })

    it('should handle stream with complex data', async () => {
      const channel = new MultiChannel<{ timestamp: number, value: number }>()
      const testData = [
        { timestamp: 1, value: 10 },
        { timestamp: 2, value: 20 },
      ]

      channel.sendBatch(testData)

      const configWithChannel = {
        ...streamOutputConfig,
        defaultValue: null,
      } as const

      const validated = validatePortConfigType(configWithChannel, PortType.Stream)
      expect(channel).toBeInstanceOf(MultiChannel)

      // Verify channel data is preserved
      const values = []
      for await (const value of channel) {
        values.push(value)
        if (values.length === testData.length)
          break // Break after getting all values
      }
      expect(values).toEqual(testData)
    }, { timeout: 10000 }) // Increase timeout for async operations
  })

  describe('stream port with complex value types', () => {
    interface ComplexData {
      id: string
      data: Array<{
        name: string
        value: number
      }>
      metadata?: {
        timestamp?: number
        tags?: string[]
      }
    }

    const complexStreamConfig = {
      type: PortType.Stream,
      id: 'test-complex-stream',
      title: 'Test Complex Stream',
      direction: PortDirection.Input,
      mode: 'input',
      valueType: {
        type: PortType.Object,
        schema: {
          properties: {
            id: {
              type: PortType.String,
            },
            data: {
              type: PortType.Array,
              elementConfig: {
                type: PortType.Object,
                schema: {
                  properties: {
                    name: {
                      type: PortType.String,
                    },
                    value: {
                      type: PortType.Number,
                    },
                  },
                  required: ['name', 'value'],
                },
              },
            },
            metadata: {
              type: PortType.Object,
              schema: {
                properties: {
                  timestamp: {
                    type: PortType.Number,
                  },
                  tags: {
                    type: PortType.Array,
                    elementConfig: {
                      type: PortType.String,
                    },
                  },
                },
              },
            },
          },
          required: ['id', 'data'],
        },
      },
    } as const

    it('should validate complex stream config', () => {
      const validated = validatePortConfigType(complexStreamConfig, PortType.Stream)
      expect(isPortType(validated, PortType.Stream)).toBe(true)
      expect(isPortType(validated.valueType, PortType.Object)).toBe(true)
    })

    it('should handle stream with complex nested data', async () => {
      const channel = new MultiChannel<ComplexData>()
      const testData: ComplexData = {
        id: 'test-1',
        data: [
          { name: 'item1', value: 10 },
          { name: 'item2', value: 20 },
        ],
        metadata: {
          timestamp: Date.now(),
          tags: ['test', 'example'],
        },
      }

      channel.send(testData)

      const configWithChannel = {
        ...complexStreamConfig,
        defaultValue: null,
      } as const

      const validated = validatePortConfigType(configWithChannel, PortType.Stream)
      expect(channel).toBeInstanceOf(MultiChannel)

      // Verify channel data is preserved
      const values = []
      // eslint-disable-next-line no-unreachable-loop
      for await (const value of channel) {
        values.push(value)
        break // Only need the first value
      }
      expect(values).toEqual([testData])
    }, { timeout: 10000 }) // Increase timeout for async operations
  })

  describe('error handling', () => {
    it('should reject stream without mode', () => {
      const invalidConfig = {
        type: PortType.Stream,
        valueType: {
          type: PortType.Number,
        },
      }
      expect(() => validatePortConfig(invalidConfig)).toThrow()
    })

    it('should reject stream with invalid buffer size', () => {
      const invalidConfig = {
        type: PortType.Stream,
        mode: 'input',
        valueType: {
          type: PortType.Number,
        },
        bufferSize: -1, // Invalid: negative buffer size
      }
      expect(() => validatePortConfig(invalidConfig)).toThrow()
    })

    it('should reject stream with missing value type', () => {
      const invalidConfig = {
        type: PortType.Stream,
        mode: 'input',
      } as const
      expect(() => validatePortConfig(invalidConfig)).toThrow()
    })

    it('should reject stream with invalid value type', () => {
      const invalidConfig = {
        type: PortType.Stream,
        mode: 'input',
        valueType: {
          type: 'invalid' as PortType,
        },
      }
      expect(() => validatePortConfig(invalidConfig)).toThrow()
    })
  })
})
