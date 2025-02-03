import type { PortConfig } from '../config/types'
import { describe, expect, it } from 'vitest'
import { PortType } from '../config/constants'
import { PortValueSerializer } from '../serialization/serializer'

describe('object port serialization', () => {
  const serializer = new PortValueSerializer()

  describe('simple object ports', () => {
    const simpleObjectConfig: PortConfig = {
      type: PortType.Object,
      schema: {
        properties: {
          name: {
            type: PortType.String,
            validation: {
              minLength: 1,
              maxLength: 100,
            },
          },
          age: {
            type: PortType.Number,
            validation: {
              min: 0,
              max: 150,
              integer: true,
            },
          },
          isActive: {
            type: PortType.Boolean,
          },
        },
      },
    } as const

    it('should serialize object with all fields', () => {
      const value = {
        name: 'John Doe',
        age: 30,
        isActive: true,
      }
      const serialized = serializer.serialize(simpleObjectConfig, value)
      expect(serialized).toEqual(value)
    })

    it('should deserialize object with all fields', () => {
      const value = {
        name: 'John Doe',
        age: 30,
        isActive: true,
      }
      const deserialized = serializer.deserialize(simpleObjectConfig, value)
      expect(deserialized).toEqual(value)
    })

    it('should handle partial object serialization', () => {
      const value = {
        name: 'John Doe',
        age: 30,
      }
      const serialized = serializer.serialize(simpleObjectConfig, value)
      expect(serialized).toEqual(value)
    })
  })

  describe('nested object ports', () => {
    const nestedObjectConfig: PortConfig = {
      type: PortType.Object,
      schema: {
        properties: {
          user: {
            type: PortType.Object,
            schema: {
              properties: {
                name: {
                  type: PortType.String,
                },
                contact: {
                  type: PortType.Object,
                  schema: {
                    properties: {
                      email: {
                        type: PortType.String,
                      },
                      phone: {
                        type: PortType.String,
                      },
                    },
                  },
                },
              },
            },
          },
          settings: {
            type: PortType.Object,
            schema: {
              properties: {
                theme: {
                  type: PortType.String,
                },
                notifications: {
                  type: PortType.Boolean,
                },
              },
            },
          },
        },
      },
    } as const

    it('should serialize deeply nested object', () => {
      const value = {
        user: {
          name: 'John Doe',
          contact: {
            email: 'john@example.com',
            phone: '+1234567890',
          },
        },
        settings: {
          theme: 'dark',
          notifications: true,
        },
      }
      const serialized = serializer.serialize(nestedObjectConfig, value)
      expect(serialized).toEqual(value)
    })

    it('should deserialize deeply nested object', () => {
      const value = {
        user: {
          name: 'John Doe',
          contact: {
            email: 'john@example.com',
            phone: '+1234567890',
          },
        },
        settings: {
          theme: 'dark',
          notifications: true,
        },
      }
      const deserialized = serializer.deserialize(nestedObjectConfig, value)
      expect(deserialized).toEqual(value)
    })

    it('should handle partial nested object', () => {
      const value = {
        user: {
          name: 'John Doe',
          contact: {
            email: 'john@example.com',
          },
        },
      }
      const serialized = serializer.serialize(nestedObjectConfig, value)
      expect(serialized).toEqual(value)
    })
  })

  describe('object with array properties', () => {
    const objectWithArrayConfig: PortConfig = {
      type: PortType.Object,
      schema: {
        properties: {
          name: {
            type: PortType.String,
          },
          tags: {
            type: PortType.Array,
            elementConfig: {
              type: PortType.String,
            },
          },
          scores: {
            type: PortType.Array,
            elementConfig: {
              type: PortType.Number,
            },
          },
        },
      },
    } as const

    it('should serialize object with array properties', () => {
      const value = {
        name: 'Test Item',
        tags: ['tag1', 'tag2', 'tag3'],
        scores: [85, 92, 78],
      }
      const serialized = serializer.serialize(objectWithArrayConfig, value)
      expect(serialized).toEqual(value)
    })

    it('should deserialize object with array properties', () => {
      const value = {
        name: 'Test Item',
        tags: ['tag1', 'tag2', 'tag3'],
        scores: [85, 92, 78],
      }
      const deserialized = serializer.deserialize(objectWithArrayConfig, value)
      expect(deserialized).toEqual(value)
    })

    it('should handle empty arrays', () => {
      const value = {
        name: 'Test Item',
        tags: [],
        scores: [],
      }
      const serialized = serializer.serialize(objectWithArrayConfig, value)
      expect(serialized).toEqual(value)
    })
  })

  describe('object with nested arrays', () => {
    const objectWithNestedArraysConfig: PortConfig = {
      type: PortType.Object,
      schema: {
        properties: {
          name: {
            type: PortType.String,
          },
          matrix: {
            type: PortType.Array,
            elementConfig: {
              type: PortType.Array,
              elementConfig: {
                type: PortType.Number,
              },
            },
          },
        },
      },
    } as const

    it('should serialize object with nested arrays', () => {
      const value = {
        name: 'Matrix',
        matrix: [
          [1, 2, 3],
          [4, 5, 6],
          [7, 8, 9],
        ],
      }
      const serialized = serializer.serialize(objectWithNestedArraysConfig, value)
      expect(serialized).toEqual(value)
    })

    it('should deserialize object with nested arrays', () => {
      const value = {
        name: 'Matrix',
        matrix: [
          [1, 2, 3],
          [4, 5, 6],
          [7, 8, 9],
        ],
      }
      const deserialized = serializer.deserialize(objectWithNestedArraysConfig, value)
      expect(deserialized).toEqual(value)
    })
  })

  describe('error handling', () => {
    const simpleObjectConfig: PortConfig = {
      type: PortType.Object,
      schema: {
        properties: {
          name: {
            type: PortType.String,
          },
          age: {
            type: PortType.Number,
          },
        },
      },
    } as const

    it('should handle empty object', () => {
      const value = {}
      const serialized = serializer.serialize(simpleObjectConfig, value)
      expect(serialized).toEqual({})
    })

    it('should handle undefined properties', () => {
      const value = {
        name: 'John',
        age: undefined,
      }
      const serialized = serializer.serialize(simpleObjectConfig, value)
      expect(serialized).toEqual({ name: 'John' })
    })

    it('should handle non-object values', () => {
      const value = 'not an object' as any
      const serialized = serializer.serialize(simpleObjectConfig, value)
      expect(serialized).toBe(value)
    })

    it('should handle missing schema', () => {
      const invalidConfig = {
        type: PortType.Object,
      } as PortConfig
      expect(() => serializer.serialize(invalidConfig, {})).toThrow()
    })
  })
})
