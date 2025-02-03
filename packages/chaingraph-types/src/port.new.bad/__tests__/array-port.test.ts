import type { ConfigFromPortType } from '../config/types'
import { beforeAll, describe, expect, it } from 'vitest'
import { PortDirection, PortType } from '../config/constants'
import { ArrayPort } from '../ports/array.port'
import { registerTestPorts } from '../registry/register-ports'

describe('array port', () => {
  // Register required port types before running tests
  beforeAll(() => {
    registerTestPorts(
      PortType.Array, // For array port itself
      PortType.String, // For string array tests
      PortType.Number, // For number array tests
      PortType.Boolean, // For boolean array tests
      PortType.Object, // For object array tests
    )
  })

  describe('basic functionality', () => {
    it('should create array port with minimal config', () => {
      const config: ConfigFromPortType<PortType.Array> = {
        type: PortType.Array,
        elementConfig: {
          type: PortType.String,
        },
      }

      const port = new ArrayPort(config)
      expect(port.config).toEqual(config)
      expect(port.hasValue()).toBe(false)
    })

    it('should handle default value', () => {
      const config: ConfigFromPortType<PortType.Array> = {
        type: PortType.Array,
        elementConfig: {
          type: PortType.Number,
        },
        defaultValue: [1, 2, 3],
      }

      const port = new ArrayPort(config)
      expect(port.hasValue()).toBe(true)
      expect(port.getValue()).toEqual([1, 2, 3])
    })

    it('should set and get value', () => {
      const port = new ArrayPort<string>({
        type: PortType.Array,
        elementConfig: {
          type: PortType.String,
        },
      })
      port.setValue(['a', 'b', 'c'])
      expect(port.getValue()).toEqual(['a', 'b', 'c'])
    })

    it('should reset value', () => {
      const port = new ArrayPort<number>({
        type: PortType.Array,
        elementConfig: {
          type: PortType.Number,
        },
      })
      port.setValue([1, 2, 3])
      port.reset()
      expect(port.hasValue()).toBe(false)
    })

    it('should handle empty array', () => {
      const port = new ArrayPort<string>({
        type: PortType.Array,
        elementConfig: {
          type: PortType.String,
        },
      })
      port.setValue([])
      expect(port.getValue()).toEqual([])
    })
  })

  describe('validation', () => {
    it('should validate array elements of string type', () => {
      const port = new ArrayPort<string>({
        type: PortType.Array,
        elementConfig: {
          type: PortType.String,
          validation: {
            minLength: 2,
            maxLength: 5,
          },
        },
      })

      expect(() => port.setValue(['ab', 'abc', 'abcd'])).not.toThrow()
      expect(() => port.setValue(['a'])).toThrow() // Too short
      expect(() => port.setValue(['abcdef'])).toThrow() // Too long
    })

    it('should validate array elements of number type', () => {
      const port = new ArrayPort<number>({
        type: PortType.Array,
        elementConfig: {
          type: PortType.Number,
          validation: {
            min: 0,
            max: 100,
          },
        },
      })

      expect(() => port.setValue([0, 50, 100])).not.toThrow()
      expect(() => port.setValue([-1])).toThrow() // Below min
      expect(() => port.setValue([101])).toThrow() // Above max
    })

    it('should validate nested arrays', () => {
      const port = new ArrayPort<number[]>({
        type: PortType.Array,
        elementConfig: {
          type: PortType.Array,
          elementConfig: {
            type: PortType.Number,
          },
        },
      })

      expect(() => port.setValue([[1, 2], [3, 4]])).not.toThrow()
      expect(() => port.setValue([[1, 'a' as any]])).toThrow() // Invalid nested element
    })

    it('should validate array of objects', () => {
      interface TestObject {
        id: string
        value: number
      }

      const port = new ArrayPort<TestObject>({
        type: PortType.Array,
        elementConfig: {
          type: PortType.Object,
          schema: {
            properties: {
              id: { type: PortType.String },
              value: { type: PortType.Number },
            },
          },
        },
      })

      expect(() => port.setValue([
        { id: '1', value: 10 },
        { id: '2', value: 20 },
      ])).not.toThrow()
      expect(() => port.setValue([
        { id: '1', value: 'invalid' as any },
      ])).toThrow() // Invalid value type
    })

    it('should validate complex nested structures', () => {
      interface TestUser {
        user: {
          name: string
          scores: number[]
        }
      }

      const port = new ArrayPort<TestUser>({
        type: PortType.Array,
        elementConfig: {
          type: PortType.Object,
          schema: {
            properties: {
              user: {
                type: PortType.Object,
                schema: {
                  properties: {
                    name: { type: PortType.String },
                    scores: {
                      type: PortType.Array,
                      elementConfig: { type: PortType.Number },
                    },
                  },
                },
              },
            },
          },
        },
      })

      expect(() => port.setValue([{
        user: {
          name: 'John',
          scores: [85, 92, 78],
        },
      }])).not.toThrow()

      expect(() => port.setValue([{
        user: {
          name: 'John',
          scores: ['invalid' as any],
        },
      }])).toThrow() // Invalid scores type
    })
  })

  describe('serialization', () => {
    it('should serialize port without value', () => {
      const config: ConfigFromPortType<PortType.Array> = {
        type: PortType.Array,
        elementConfig: {
          type: PortType.String,
        },
      }

      const port = new ArrayPort(config)
      const serialized = port.serialize()

      expect(serialized).toEqual({
        config,
        value: undefined,
        metadata: undefined,
      })
    })

    it('should serialize port with value', () => {
      const config: ConfigFromPortType<PortType.Array> = {
        type: PortType.Array,
        elementConfig: {
          type: PortType.Number,
        },
      }

      const port = new ArrayPort<number>(config)
      port.setValue([1, 2, 3])
      const serialized = port.serialize()

      expect(serialized).toEqual({
        config,
        value: [1, 2, 3],
        metadata: undefined,
      })
    })

    it('should deserialize port', () => {
      const config: ConfigFromPortType<PortType.Array> = {
        type: PortType.Array,
        elementConfig: {
          type: PortType.String,
        },
      }

      const originalPort = new ArrayPort<string>(config)
      originalPort.setValue(['a', 'b', 'c'])

      const serialized = originalPort.serialize()
      const deserializedPort = originalPort.deserialize(serialized)

      expect(deserializedPort).toBeInstanceOf(ArrayPort)
      expect(deserializedPort.config).toEqual(config)
      expect(deserializedPort.getValue()).toEqual(['a', 'b', 'c'])
    })

    it('should handle metadata in serialization', () => {
      const port = new ArrayPort<number>({
        type: PortType.Array,
        elementConfig: {
          type: PortType.Number,
        },
      })
      port.setValue([1, 2, 3])
      port.setMetadata('key1', 'value1')
      port.setMetadata('key2', { nested: true })

      const serialized = port.serialize()
      const deserializedPort = port.deserialize(serialized)

      expect(deserializedPort.getMetadata('key1')).toBe('value1')
      expect(deserializedPort.getMetadata('key2')).toEqual({ nested: true })
    })
  })

  describe('common port properties', () => {
    it('should handle optional properties', () => {
      const port = new ArrayPort<string>({
        type: PortType.Array,
        elementConfig: {
          type: PortType.String,
        },
        id: 'test-id',
        title: 'Test Port',
        description: 'A test port',
        direction: PortDirection.Input,
        optional: true,
        metadata: {
          custom: 'value',
        },
      })

      expect(port.config.id).toBe('test-id')
      expect(port.config.title).toBe('Test Port')
      expect(port.config.description).toBe('A test port')
      expect(port.config.direction).toBe(PortDirection.Input)
      expect(port.config.optional).toBe(true)
      expect(port.config.metadata).toEqual({ custom: 'value' })
    })
  })

  describe('error handling', () => {
    it('should reject missing elementConfig', () => {
      const invalidConfig = {
        type: PortType.Array,
      } as const

      // @ts-expect-error - Testing invalid config
      expect(() => new ArrayPort(invalidConfig)).toThrow()
    })

    it('should reject invalid element type', () => {
      const invalidConfig = {
        type: PortType.Array,
        elementConfig: {
          type: 'invalid' as PortType,
        },
      } as const

      // @ts-expect-error - Testing invalid config
      expect(() => new ArrayPort(invalidConfig)).toThrow()
    })

    it('should reject non-array values', () => {
      const port = new ArrayPort<string>({
        type: PortType.Array,
        elementConfig: {
          type: PortType.String,
        },
      })
      expect(() => port.setValue('not an array' as any)).toThrow()
      expect(() => port.setValue(42 as any)).toThrow()
      expect(() => port.setValue({} as any)).toThrow()
    })

    it('should reject invalid nested validation', () => {
      expect(() => new ArrayPort<number>({
        type: PortType.Array,
        elementConfig: {
          type: PortType.Number,
          validation: {
            min: 100,
            max: 0, // Invalid: max < min
          },
        },
      })).toThrow()
    })
  })

  describe('events', () => {
    it('should emit value change events', () => {
      const port = new ArrayPort<number>({
        type: PortType.Array,
        elementConfig: {
          type: PortType.Number,
        },
      })
      const events: any[] = []

      port.on('value:change', (event, data) => {
        events.push({ event, data })
      })

      port.setValue([1, 2])
      port.setValue([3, 4])

      expect(events).toHaveLength(2)
      expect(events[0].data).toEqual({
        oldValue: undefined,
        newValue: [1, 2],
      })
      expect(events[1].data).toEqual({
        oldValue: [1, 2],
        newValue: [3, 4],
      })
    })

    it('should emit reset events', () => {
      const port = new ArrayPort<number>({
        type: PortType.Array,
        elementConfig: {
          type: PortType.Number,
        },
      })
      const events: any[] = []

      port.setValue([1, 2, 3])
      port.on('value:reset', (event, data) => {
        events.push({ event, data })
      })

      port.reset()

      expect(events).toHaveLength(1)
      expect(events[0].data).toEqual({
        oldValue: [1, 2, 3],
      })
    })
  })
})
