import { describe, expect, it } from 'vitest'
import { PortType } from '../config/constants'
import { streamPortSchema } from '../validation'

describe('stream port schema', () => {
  describe('basic stream configuration', () => {
    it('should validate basic stream port through JSON', () => {
      const config = {
        type: PortType.Stream,
        mode: 'input',
        valueType: {
          type: PortType.Number,
        },
      }

      const serialized = JSON.stringify(config)
      const deserialized = JSON.parse(serialized)

      const result = streamPortSchema.safeParse(deserialized)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).toEqual(config)
      }
    })

    it('should validate stream port with default value through JSON', () => {
      const config = {
        type: PortType.Stream,
        mode: 'output',
        valueType: {
          type: PortType.String,
        },
        defaultValue: null,
      }

      const serialized = JSON.stringify(config)
      const deserialized = JSON.parse(serialized)

      const result = streamPortSchema.safeParse(deserialized)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).toEqual(config)
      }
    })

    it('should validate stream with buffer size through JSON', () => {
      const config = {
        type: PortType.Stream,
        mode: 'input',
        valueType: {
          type: PortType.Number,
        },
        bufferSize: 10,
      }

      const serialized = JSON.stringify(config)
      const deserialized = JSON.parse(serialized)

      const result = streamPortSchema.safeParse(deserialized)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).toEqual(config)
      }
    })
  })

  describe('stream with complex value types', () => {
    it('should validate stream of arrays through JSON', () => {
      const config = {
        type: PortType.Stream,
        mode: 'input',
        valueType: {
          type: PortType.Array,
          elementConfig: {
            type: PortType.Number,
          },
        },
      }

      const serialized = JSON.stringify(config)
      const deserialized = JSON.parse(serialized)

      const result = streamPortSchema.safeParse(deserialized)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).toEqual(config)
      }
    })

    it('should validate stream of objects through JSON', () => {
      const config = {
        type: PortType.Stream,
        mode: 'output',
        valueType: {
          type: PortType.Object,
          schema: {
            properties: {
              value: {
                type: PortType.Number,
              },
              timestamp: {
                type: PortType.String,
              },
            },
          },
        },
      }

      const serialized = JSON.stringify(config)
      const deserialized = JSON.parse(serialized)

      const result = streamPortSchema.safeParse(deserialized)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).toEqual(config)
      }
    })
  })

  describe('error cases', () => {
    it('should reject missing mode through JSON', () => {
      const config = {
        type: PortType.Stream,
        valueType: {
          type: PortType.Number,
        },
      }

      const serialized = JSON.stringify(config)
      const deserialized = JSON.parse(serialized)

      const result = streamPortSchema.safeParse(deserialized)
      expect(result.success).toBe(false)
    })

    it('should reject invalid mode through JSON', () => {
      const config = {
        type: PortType.Stream,
        mode: 'invalid',
        valueType: {
          type: PortType.Number,
        },
      }

      const serialized = JSON.stringify(config)
      const deserialized = JSON.parse(serialized)

      const result = streamPortSchema.safeParse(deserialized)
      expect(result.success).toBe(false)
    })

    it('should reject missing valueType through JSON', () => {
      const config = {
        type: PortType.Stream,
        mode: 'input',
      }

      const serialized = JSON.stringify(config)
      const deserialized = JSON.parse(serialized)

      const result = streamPortSchema.safeParse(deserialized)
      expect(result.success).toBe(false)
    })

    it('should reject negative buffer size through JSON', () => {
      const config = {
        type: PortType.Stream,
        mode: 'input',
        valueType: {
          type: PortType.Number,
        },
        bufferSize: -1,
      }

      const serialized = JSON.stringify(config)
      const deserialized = JSON.parse(serialized)

      const result = streamPortSchema.safeParse(deserialized)
      expect(result.success).toBe(false)
    })
  })

  describe('common port properties', () => {
    it('should validate optional properties through JSON', () => {
      const config = {
        type: PortType.Stream,
        mode: 'input',
        valueType: {
          type: PortType.Number,
        },
        id: 'test-id',
        title: 'Test Stream Port',
        description: 'A test stream port',
        optional: true,
        metadata: {
          custom: 'value',
        },
      }

      const serialized = JSON.stringify(config)
      const deserialized = JSON.parse(serialized)

      const result = streamPortSchema.safeParse(deserialized)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).toEqual(config)
      }
    })

    it('should reject invalid metadata type through JSON', () => {
      const config = {
        type: PortType.Stream,
        mode: 'input',
        valueType: {
          type: PortType.Number,
        },
        metadata: 'not an object',
      }

      const serialized = JSON.stringify(config)
      const deserialized = JSON.parse(serialized)

      const result = streamPortSchema.safeParse(deserialized)
      expect(result.success).toBe(false)
    })

    it('should reject invalid optional type through JSON', () => {
      const config = {
        type: PortType.Stream,
        mode: 'input',
        valueType: {
          type: PortType.Number,
        },
        optional: 'yes',
      }

      const serialized = JSON.stringify(config)
      const deserialized = JSON.parse(serialized)

      const result = streamPortSchema.safeParse(deserialized)
      expect(result.success).toBe(false)
    })
  })
})
