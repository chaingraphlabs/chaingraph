import type { SerializedPortData } from '@chaingraph/types/port.new'
import { beforeAll, describe, expect, it } from 'vitest'
import { PortDirection, PortType } from '../config/constants'
import { ObjectPort } from '../ports/object.port'
import { registerTestPorts } from '../registry/register-ports'

describe('object port json serialization', () => {
  // Register required port types before running tests
  beforeAll(() => {
    registerTestPorts(
      PortType.Object, // For object port itself
      PortType.String, // For string properties
      PortType.Number, // For number properties
      PortType.Boolean, // For boolean properties
      PortType.Array, // For array properties
    )
  })

  describe('basic types serialization', () => {
    it('should handle full serialization cycle for simple object', () => {
      // Create original port
      const originalPort = new ObjectPort({
        type: PortType.Object,
        schema: {
          properties: {
            name: {
              type: PortType.String,
              validation: {
                minLength: 2,
                maxLength: 5,
              },
            },
            age: {
              type: PortType.Number,
              validation: {
                min: 0,
                max: 100,
                integer: true,
              },
            },
            active: { type: PortType.Boolean },
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
      originalPort.setValue({
        name: 'John',
        age: 30,
        active: true,
      })

      // Serialize to JSON string
      const serialized = originalPort.serialize()
      const jsonString = JSON.stringify(serialized)

      // Deserialize from JSON string
      const parsed = JSON.parse(jsonString) as SerializedPortData
      const restoredPort = originalPort.deserialize(parsed)

      // Verify restored port
      expect(restoredPort.config).toEqual(originalPort.config)
      expect(restoredPort.getValue()).toEqual({
        name: 'John',
        age: 30,
        active: true,
      })
      expect(restoredPort.getMetadata('custom')).toBe('value')
    })

    it('should handle full serialization cycle for partial object', () => {
      // Create original port
      const originalPort = new ObjectPort({
        type: PortType.Object,
        schema: {
          properties: {
            name: { type: PortType.String },
            age: { type: PortType.Number },
          },
        },
      })
      originalPort.setValue({ name: 'John' }) // Only setting name

      // Serialize to JSON string
      const serialized = originalPort.serialize()
      const jsonString = JSON.stringify(serialized)

      // Deserialize from JSON string
      const parsed = JSON.parse(jsonString) as SerializedPortData
      const restoredPort = originalPort.deserialize(parsed)

      // Verify restored port
      expect(restoredPort.config).toEqual(originalPort.config)
      expect(restoredPort.getValue()).toEqual({ name: 'John' })
    })
  })

  describe('complex types serialization', () => {
    it('should handle full serialization cycle for nested objects', () => {
      // Create original port
      const originalPort = new ObjectPort({
        type: PortType.Object,
        schema: {
          properties: {
            user: {
              type: PortType.Object,
              schema: {
                properties: {
                  name: { type: PortType.String },
                  settings: {
                    type: PortType.Object,
                    schema: {
                      properties: {
                        theme: { type: PortType.String },
                        notifications: { type: PortType.Boolean },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      })
      originalPort.setValue({
        user: {
          name: 'John',
          settings: {
            theme: 'dark',
            notifications: true,
          },
        },
      })

      // Serialize to JSON string
      const serialized = originalPort.serialize()
      const jsonString = JSON.stringify(serialized)

      // Deserialize from JSON string
      const parsed = JSON.parse(jsonString) as SerializedPortData
      const restoredPort = originalPort.deserialize(parsed)

      // Verify restored port
      expect(restoredPort.config).toEqual(originalPort.config)
      expect(restoredPort.getValue()).toEqual({
        user: {
          name: 'John',
          settings: {
            theme: 'dark',
            notifications: true,
          },
        },
      })
    })

    it('should handle full serialization cycle for objects with arrays', () => {
      // Create original port
      const originalPort = new ObjectPort({
        type: PortType.Object,
        schema: {
          properties: {
            name: { type: PortType.String },
            scores: {
              type: PortType.Array,
              elementConfig: {
                type: PortType.Number,
                validation: {
                  min: 0,
                  max: 100,
                },
              },
            },
          },
        },
      })
      originalPort.setValue({
        name: 'John',
        scores: [85, 92, 78],
      })

      // Serialize to JSON string
      const serialized = originalPort.serialize()
      const jsonString = JSON.stringify(serialized)

      // Deserialize from JSON string
      const parsed = JSON.parse(jsonString) as SerializedPortData
      const restoredPort = originalPort.deserialize(parsed)

      // Verify restored port
      expect(restoredPort.config).toEqual(originalPort.config)
      expect(restoredPort.getValue()).toEqual({
        name: 'John',
        scores: [85, 92, 78],
      })
    })
  })

  describe('error handling', () => {
    it('should reject invalid JSON string', () => {
      const originalPort = new ObjectPort({
        type: PortType.Object,
        schema: {
          properties: {
            name: { type: PortType.String },
          },
        },
      })

      const invalidJson = '{ invalid json }'
      expect(() => {
        const parsed = JSON.parse(invalidJson)
        originalPort.deserialize(parsed)
      }).toThrow()
    })

    it('should reject JSON with invalid port configuration', () => {
      const originalPort = new ObjectPort({
        type: PortType.Object,
        schema: {
          properties: {
            name: { type: PortType.String },
          },
        },
      })

      const invalidConfig = {
        config: {
          type: PortType.Object,
          // Missing schema
        },
        value: { name: 'John' },
      }

      const jsonString = JSON.stringify(invalidConfig)
      expect(() => {
        const parsed = JSON.parse(jsonString)
        originalPort.deserialize(parsed)
      }).toThrow()
    })

    it('should reject JSON with invalid port value', () => {
      const originalPort = new ObjectPort({
        type: PortType.Object,
        schema: {
          properties: {
            age: {
              type: PortType.Number,
              validation: {
                min: 0,
                max: 100,
              },
            },
          },
        },
      })

      const invalidValue = {
        config: {
          type: PortType.Object,
          schema: {
            properties: {
              age: {
                type: PortType.Number,
                validation: {
                  min: 0,
                  max: 100,
                },
              },
            },
          },
        },
        value: { age: 200 }, // Value exceeds max
      }

      const jsonString = JSON.stringify(invalidValue)
      expect(() => {
        const parsed = JSON.parse(jsonString)
        originalPort.deserialize(parsed)
      }).toThrow()
    })
  })
})
