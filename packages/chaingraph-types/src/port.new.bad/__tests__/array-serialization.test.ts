import type { PortConfig } from '../config/types'
import { describe, expect, it } from 'vitest'
import { PortType } from '../config/constants'
import { PortValueSerializer } from '../serialization/serializer'

describe('array port serialization', () => {
  const serializer = new PortValueSerializer()

  describe('arrays of scalar types', () => {
    describe('string array', () => {
      const stringArrayConfig: PortConfig = {
        type: PortType.Array,
        elementConfig: {
          type: PortType.String,
          validation: {
            minLength: 1,
            maxLength: 100,
          },
        },
      } as const

      it('should serialize string array', () => {
        const value = ['one', 'two', 'three']
        const serialized = serializer.serialize(stringArrayConfig, value)
        expect(serialized).toEqual(value)
      })

      it('should deserialize string array', () => {
        const value = ['one', 'two', 'three']
        const deserialized = serializer.deserialize(stringArrayConfig, value)
        expect(deserialized).toEqual(value)
      })

      it('should handle empty array', () => {
        const value: string[] = []
        const serialized = serializer.serialize(stringArrayConfig, value)
        expect(serialized).toEqual(value)
      })
    })

    describe('number array', () => {
      const numberArrayConfig: PortConfig = {
        type: PortType.Array,
        elementConfig: {
          type: PortType.Number,
          validation: {
            min: 0,
            max: 100,
          },
        },
      } as const

      it('should serialize number array', () => {
        const value = [1, 2, 3, 4, 5]
        const serialized = serializer.serialize(numberArrayConfig, value)
        expect(serialized).toEqual(value)
      })

      it('should deserialize number array', () => {
        const value = [1, 2, 3, 4, 5]
        const deserialized = serializer.deserialize(numberArrayConfig, value)
        expect(deserialized).toEqual(value)
      })

      it('should handle floating point numbers', () => {
        const value = [1.1, 2.2, 3.3]
        const serialized = serializer.serialize(numberArrayConfig, value)
        expect(serialized).toEqual(value)
      })
    })

    describe('boolean array', () => {
      const booleanArrayConfig: PortConfig = {
        type: PortType.Array,
        elementConfig: {
          type: PortType.Boolean,
        },
      } as const

      it('should serialize boolean array', () => {
        const value = [true, false, true]
        const serialized = serializer.serialize(booleanArrayConfig, value)
        expect(serialized).toEqual(value)
      })

      it('should deserialize boolean array', () => {
        const value = [true, false, true]
        const deserialized = serializer.deserialize(booleanArrayConfig, value)
        expect(deserialized).toEqual(value)
      })
    })
  })

  describe('arrays of objects', () => {
    const objectArrayConfig: PortConfig = {
      type: PortType.Array,
      elementConfig: {
        type: PortType.Object,
        schema: {
          properties: {
            id: {
              type: PortType.String,
            },
            value: {
              type: PortType.Number,
            },
            enabled: {
              type: PortType.Boolean,
            },
          },
        },
      },
    } as const

    it('should serialize array of objects', () => {
      const value = [
        { id: '1', value: 10, enabled: true },
        { id: '2', value: 20, enabled: false },
        { id: '3', value: 30, enabled: true },
      ]
      const serialized = serializer.serialize(objectArrayConfig, value)
      expect(serialized).toEqual(value)
    })

    it('should deserialize array of objects', () => {
      const value = [
        { id: '1', value: 10, enabled: true },
        { id: '2', value: 20, enabled: false },
        { id: '3', value: 30, enabled: true },
      ]
      const deserialized = serializer.deserialize(objectArrayConfig, value)
      expect(deserialized).toEqual(value)
    })

    it('should handle array of partial objects', () => {
      const value = [
        { id: '1', value: 10 },
        { id: '2', enabled: false },
      ]
      const serialized = serializer.serialize(objectArrayConfig, value)
      expect(serialized).toEqual(value)
    })
  })

  describe('nested arrays', () => {
    const matrixConfig: PortConfig = {
      type: PortType.Array,
      elementConfig: {
        type: PortType.Array,
        elementConfig: {
          type: PortType.Number,
        },
      },
    } as const

    it('should serialize matrix', () => {
      const value = [
        [1, 2, 3],
        [4, 5, 6],
        [7, 8, 9],
      ]
      const serialized = serializer.serialize(matrixConfig, value)
      expect(serialized).toEqual(value)
    })

    it('should deserialize matrix', () => {
      const value = [
        [1, 2, 3],
        [4, 5, 6],
        [7, 8, 9],
      ]
      const deserialized = serializer.deserialize(matrixConfig, value)
      expect(deserialized).toEqual(value)
    })

    it('should handle jagged arrays', () => {
      const value = [
        [1, 2],
        [3, 4, 5],
        [6],
      ]
      const serialized = serializer.serialize(matrixConfig, value)
      expect(serialized).toEqual(value)
    })

    it('should handle empty nested arrays', () => {
      const value = [[], [], []]
      const serialized = serializer.serialize(matrixConfig, value)
      expect(serialized).toEqual(value)
    })
  })

  describe('array of arrays of objects', () => {
    const complexArrayConfig: PortConfig = {
      type: PortType.Array,
      elementConfig: {
        type: PortType.Array,
        elementConfig: {
          type: PortType.Object,
          schema: {
            properties: {
              x: { type: PortType.Number },
              y: { type: PortType.Number },
              label: { type: PortType.String },
            },
          },
        },
      },
    } as const

    it('should serialize complex nested structure', () => {
      const value = [
        [
          { x: 0, y: 0, label: 'origin' },
          { x: 1, y: 0, label: 'right' },
        ],
        [
          { x: 0, y: 1, label: 'up' },
          { x: 1, y: 1, label: 'corner' },
        ],
      ]
      const serialized = serializer.serialize(complexArrayConfig, value)
      expect(serialized).toEqual(value)
    })

    it('should deserialize complex nested structure', () => {
      const value = [
        [
          { x: 0, y: 0, label: 'origin' },
          { x: 1, y: 0, label: 'right' },
        ],
        [
          { x: 0, y: 1, label: 'up' },
          { x: 1, y: 1, label: 'corner' },
        ],
      ]
      const deserialized = serializer.deserialize(complexArrayConfig, value)
      expect(deserialized).toEqual(value)
    })
  })

  describe('error handling', () => {
    const numberArrayConfig: PortConfig = {
      type: PortType.Array,
      elementConfig: {
        type: PortType.Number,
      },
    } as const

    it('should handle non-array values', () => {
      const value = 'not an array' as any
      const serialized = serializer.serialize(numberArrayConfig, value)
      expect(serialized).toBe(value)
    })

    it('should handle null value', () => {
      const value = null as any
      const serialized = serializer.serialize(numberArrayConfig, value)
      expect(serialized).toBe(value)
    })

    it('should handle undefined value', () => {
      const value = undefined as any
      const serialized = serializer.serialize(numberArrayConfig, value)
      expect(serialized).toBe(value)
    })

    it('should handle missing elementConfig', () => {
      const invalidConfig = {
        type: PortType.Array,
      } as unknown as PortConfig

      expect(() => {
        serializer.serialize(invalidConfig, [1, 2, 3])
      }).toThrow()
    })
  })
})
