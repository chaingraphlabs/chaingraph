import { describe, expect, it } from 'vitest'
import { PortType } from '../config/constants'
import { arrayPortSchema } from '../validation'

describe('array port schema', () => {
  describe('basic array configuration', () => {
    it('should validate array of strings through JSON', () => {
      const config = {
        type: PortType.Array,
        elementConfig: {
          type: PortType.String,
        },
      }

      const serialized = JSON.stringify(config)
      const deserialized = JSON.parse(serialized)

      const result = arrayPortSchema.safeParse(deserialized)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).toEqual(config)
      }
    })

    it('should validate array with default value through JSON', () => {
      const config = {
        type: PortType.Array,
        elementConfig: {
          type: PortType.Number,
        },
        defaultValue: [1, 2, 3],
      }

      const serialized = JSON.stringify(config)
      const deserialized = JSON.parse(serialized)

      const result = arrayPortSchema.safeParse(deserialized)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).toEqual(config)
      }
    })

    it('should validate array with element validation through JSON', () => {
      const config = {
        type: PortType.Array,
        elementConfig: {
          type: PortType.String,
          validation: {
            minLength: 1,
            maxLength: 10,
          },
        },
      }

      const serialized = JSON.stringify(config)
      const deserialized = JSON.parse(serialized)

      const result = arrayPortSchema.safeParse(deserialized)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).toEqual(config)
      }
    })
  })

  describe('nested array configuration', () => {
    it('should validate array of arrays (matrix) through JSON', () => {
      const config = {
        type: PortType.Array,
        elementConfig: {
          type: PortType.Array,
          elementConfig: {
            type: PortType.Number,
          },
        },
      }

      const serialized = JSON.stringify(config)
      const deserialized = JSON.parse(serialized)

      const result = arrayPortSchema.safeParse(deserialized)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).toEqual(config)
      }
    })

    it('should validate matrix with default value through JSON', () => {
      const config = {
        type: PortType.Array,
        elementConfig: {
          type: PortType.Array,
          elementConfig: {
            type: PortType.Number,
          },
        },
        defaultValue: [
          [1, 2],
          [3, 4],
        ],
      }

      const serialized = JSON.stringify(config)
      const deserialized = JSON.parse(serialized)

      const result = arrayPortSchema.safeParse(deserialized)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).toEqual(config)
      }
    })
  })

  describe('array of objects', () => {
    it('should validate array of simple objects through JSON', () => {
      const config = {
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
            },
          },
        },
      }

      const serialized = JSON.stringify(config)
      const deserialized = JSON.parse(serialized)

      const result = arrayPortSchema.safeParse(deserialized)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).toEqual(config)
      }
    })

    it('should validate array of objects with nested structure through JSON', () => {
      const config = {
        type: PortType.Array,
        elementConfig: {
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
                    scores: {
                      type: PortType.Array,
                      elementConfig: {
                        type: PortType.Number,
                      },
                    },
                  },
                },
              },
            },
          },
        },
        defaultValue: [
          {
            user: {
              name: 'John',
              scores: [85, 92, 78],
            },
          },
        ],
      }

      const serialized = JSON.stringify(config)
      const deserialized = JSON.parse(serialized)

      const result = arrayPortSchema.safeParse(deserialized)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).toEqual(config)
      }
    })
  })

  describe('error cases', () => {
    it('should reject missing elementConfig through JSON', () => {
      const config = {
        type: PortType.Array,
      }

      const serialized = JSON.stringify(config)
      const deserialized = JSON.parse(serialized)

      const result = arrayPortSchema.safeParse(deserialized)
      expect(result.success).toBe(false)
    })

    it('should reject invalid element type through JSON', () => {
      const config = {
        type: PortType.Array,
        elementConfig: {
          type: 'invalid' as PortType,
        },
      }

      const serialized = JSON.stringify(config)
      const deserialized = JSON.parse(serialized)

      const result = arrayPortSchema.safeParse(deserialized)
      expect(result.success).toBe(false)
    })

    it('should reject non-array default value through JSON', () => {
      const config = {
        type: PortType.Array,
        elementConfig: {
          type: PortType.String,
        },
        defaultValue: 'not an array', // Invalid: string instead of array
      }

      const serialized = JSON.stringify(config)
      const deserialized = JSON.parse(serialized)

      const result = arrayPortSchema.safeParse(deserialized)
      expect(result.success).toBe(false)
    })

    it('should reject invalid nested element validation through JSON', () => {
      const config = {
        type: PortType.Array,
        elementConfig: {
          type: PortType.Array,
          elementConfig: {
            type: PortType.Number,
            validation: {
              min: 100,
              max: 0, // Invalid: max < min
            },
          },
        },
      }

      const serialized = JSON.stringify(config)
      const deserialized = JSON.parse(serialized)

      const result = arrayPortSchema.safeParse(deserialized)
      expect(result.success).toBe(false)
    })
  })

  describe('common port properties', () => {
    it('should validate optional properties through JSON', () => {
      const config = {
        type: PortType.Array,
        elementConfig: {
          type: PortType.String,
        },
        id: 'test-id',
        title: 'Test Port',
        description: 'A test port',
        optional: true,
        metadata: {
          custom: 'value',
        },
      }

      const serialized = JSON.stringify(config)
      const deserialized = JSON.parse(serialized)

      const result = arrayPortSchema.safeParse(deserialized)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).toEqual(config)
      }
    })

    it('should reject invalid metadata type through JSON', () => {
      const config = {
        type: PortType.Array,
        elementConfig: {
          type: PortType.String,
        },
        metadata: 'not an object', // Invalid: string instead of object
      }

      const serialized = JSON.stringify(config)
      const deserialized = JSON.parse(serialized)

      const result = arrayPortSchema.safeParse(deserialized)
      expect(result.success).toBe(false)
    })

    it('should reject invalid optional type through JSON', () => {
      const config = {
        type: PortType.Array,
        elementConfig: {
          type: PortType.String,
        },
        optional: 'yes', // Invalid: string instead of boolean
      }

      const serialized = JSON.stringify(config)
      const deserialized = JSON.parse(serialized)

      const result = arrayPortSchema.safeParse(deserialized)
      expect(result.success).toBe(false)
    })
  })
})
