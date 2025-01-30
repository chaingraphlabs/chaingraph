import type { SerializedPortData } from '@chaingraph/types/port.new'
import { beforeAll, describe, expect, it } from 'vitest'
import { PortDirection, PortType } from '../config/constants'
import { ArrayPort } from '../ports/array.port'
import { registerTestPorts } from '../registry/register-ports'

describe('array port json serialization', () => {
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

  describe('basic types serialization', () => {
    it('should handle full serialization cycle for string array', () => {
      // Create original port
      const originalPort = new ArrayPort<string>({
        type: PortType.Array,
        elementConfig: {
          type: PortType.String,
          validation: {
            minLength: 2,
            maxLength: 5,
          },
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
      originalPort.setValue(['abc', 'def'])

      // Serialize to JSON string
      const serialized = originalPort.serialize()
      const jsonString = JSON.stringify(serialized)

      // Deserialize from JSON string
      const parsed = JSON.parse(jsonString) as SerializedPortData
      const restoredPort = originalPort.deserialize(parsed)

      // Verify restored port
      expect(restoredPort.config).toEqual(originalPort.config)
      expect(restoredPort.getValue()).toEqual(['abc', 'def'])
      expect(restoredPort.getMetadata('custom')).toBe('value')
    })

    it('should handle full serialization cycle for number array', () => {
      // Create original port
      const originalPort = new ArrayPort<number>({
        type: PortType.Array,
        elementConfig: {
          type: PortType.Number,
          validation: {
            min: 0,
            max: 100,
            integer: true,
          },
        },
      })
      originalPort.setValue([42, 73])

      // Serialize to JSON string
      const serialized = originalPort.serialize()
      const jsonString = JSON.stringify(serialized)

      // Deserialize from JSON string
      const parsed = JSON.parse(jsonString) as SerializedPortData
      const restoredPort = originalPort.deserialize(parsed)

      // Verify restored port
      expect(restoredPort.config).toEqual(originalPort.config)
      expect(restoredPort.getValue()).toEqual([42, 73])
    })
  })

  describe('complex types serialization', () => {
    it('should handle full serialization cycle for nested arrays', () => {
      // Create original port
      const originalPort = new ArrayPort<number[]>({
        type: PortType.Array,
        elementConfig: {
          type: PortType.Array,
          elementConfig: {
            type: PortType.Number,
            validation: {
              min: 0,
              max: 100,
            },
          },
        },
      })
      originalPort.setValue([[1, 2], [3, 4]])

      // Serialize to JSON string
      const serialized = originalPort.serialize()
      const jsonString = JSON.stringify(serialized)

      // Deserialize from JSON string
      const parsed = JSON.parse(jsonString) as SerializedPortData
      const restoredPort = originalPort.deserialize(parsed)

      // Verify restored port
      expect(restoredPort.config).toEqual(originalPort.config)
      expect(restoredPort.getValue()).toEqual([[1, 2], [3, 4]])
    })

    it('should handle full serialization cycle for array of objects', () => {
      interface TestUser {
        user: {
          name: string
          scores: number[]
        }
      }

      // Create original port
      const originalPort = new ArrayPort<TestUser>({
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
      originalPort.setValue([{
        user: {
          name: 'John',
          scores: [85, 92, 78],
        },
      }])

      // Serialize to JSON string
      const serialized = originalPort.serialize()
      const jsonString = JSON.stringify(serialized)

      // Deserialize from JSON string
      const parsed = JSON.parse(jsonString) as SerializedPortData
      const restoredPort = originalPort.deserialize(parsed)

      // Verify restored port
      expect(restoredPort.config).toEqual(originalPort.config)
      expect(restoredPort.getValue()).toEqual([{
        user: {
          name: 'John',
          scores: [85, 92, 78],
        },
      }])
    })
  })

  describe('error handling', () => {
    it('should reject invalid JSON string', () => {
      const originalPort = new ArrayPort<string>({
        type: PortType.Array,
        elementConfig: {
          type: PortType.String,
        },
      })

      const invalidJson = '{ invalid json }'
      expect(() => {
        const parsed = JSON.parse(invalidJson)
        originalPort.deserialize(parsed)
      }).toThrow()
    })

    it('should reject JSON with invalid port configuration', () => {
      const originalPort = new ArrayPort<string>({
        type: PortType.Array,
        elementConfig: {
          type: PortType.String,
        },
      })

      const invalidConfig = {
        config: {
          type: PortType.Array,
          // Missing elementConfig
        },
        value: ['test'],
      }

      const jsonString = JSON.stringify(invalidConfig)
      expect(() => {
        const parsed = JSON.parse(jsonString)
        originalPort.deserialize(parsed)
      }).toThrow()
    })

    it('should reject JSON with invalid port value', () => {
      const originalPort = new ArrayPort<number>({
        type: PortType.Array,
        elementConfig: {
          type: PortType.Number,
          validation: {
            min: 0,
            max: 100,
          },
        },
      })

      const invalidValue = {
        config: {
          type: PortType.Array,
          elementConfig: {
            type: PortType.Number,
            validation: {
              min: 0,
              max: 100,
            },
          },
        },
        value: [200], // Value exceeds max
      }

      const jsonString = JSON.stringify(invalidValue)
      expect(() => {
        const parsed = JSON.parse(jsonString)
        originalPort.deserialize(parsed)
      }).toThrow()
    })
  })
})
