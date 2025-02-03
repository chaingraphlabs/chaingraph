import { describe, expect, it } from 'vitest'
import { PortType } from '../config/constants'
import { booleanPortSchema, numberPortSchema, stringPortSchema } from '../validation'

describe('scalar port schemas', () => {
  describe('string port schema', () => {
    it('should validate string port config through JSON serialization', () => {
      const config = {
        type: PortType.String,
        validation: {
          minLength: 1,
          maxLength: 100,
        },
      }

      // Serialize to JSON and back
      const serialized = JSON.stringify(config)
      const deserialized = JSON.parse(serialized)

      // Validate with Zod
      const result = stringPortSchema.safeParse(deserialized)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).toEqual(config)
      }
    })

    it('should validate string port with default value through JSON serialization', () => {
      const config = {
        type: PortType.String,
        defaultValue: 'test',
        validation: {
          minLength: 1,
          maxLength: 10,
        },
      }

      const serialized = JSON.stringify(config)
      const deserialized = JSON.parse(serialized)

      const result = stringPortSchema.safeParse(deserialized)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).toEqual(config)
      }
    })

    it('should reject invalid minLength/maxLength through JSON serialization', () => {
      const config = {
        type: PortType.String,
        validation: {
          minLength: 10,
          maxLength: 5, // Invalid: maxLength < minLength
        },
      }

      const serialized = JSON.stringify(config)
      const deserialized = JSON.parse(serialized)

      const result = stringPortSchema.safeParse(deserialized)
      expect(result.success).toBe(false)
    })

    it('should reject negative length values through JSON serialization', () => {
      const config = {
        type: PortType.String,
        validation: {
          minLength: -1, // Invalid: negative length
        },
      }

      const serialized = JSON.stringify(config)
      const deserialized = JSON.parse(serialized)

      const result = stringPortSchema.safeParse(deserialized)
      expect(result.success).toBe(false)
    })
  })

  describe('number port schema', () => {
    it('should validate number port config through JSON serialization', () => {
      const config = {
        type: PortType.Number,
        validation: {
          min: 0,
          max: 100,
          integer: true,
        },
      }

      const serialized = JSON.stringify(config)
      const deserialized = JSON.parse(serialized)

      const result = numberPortSchema.safeParse(deserialized)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).toEqual(config)
      }
    })

    it('should validate number port with default value through JSON serialization', () => {
      const config = {
        type: PortType.Number,
        defaultValue: 42,
        validation: {
          min: 0,
          max: 100,
        },
      }

      const serialized = JSON.stringify(config)
      const deserialized = JSON.parse(serialized)

      const result = numberPortSchema.safeParse(deserialized)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).toEqual(config)
      }
    })

    it('should validate floating point constraints through JSON serialization', () => {
      const config = {
        type: PortType.Number,
        defaultValue: 3.14,
        validation: {
          min: 0,
          max: 10,
          integer: false,
        },
      }

      const serialized = JSON.stringify(config)
      const deserialized = JSON.parse(serialized)

      const result = numberPortSchema.safeParse(deserialized)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).toEqual(config)
      }
    })

    it('should reject invalid min/max through JSON serialization', () => {
      const config = {
        type: PortType.Number,
        validation: {
          min: 100,
          max: 0, // Invalid: max < min
        },
      }

      const serialized = JSON.stringify(config)
      const deserialized = JSON.parse(serialized)

      const result = numberPortSchema.safeParse(deserialized)
      expect(result.success).toBe(false)
    })
  })

  describe('boolean port schema', () => {
    it('should validate boolean port config through JSON serialization', () => {
      const config = {
        type: PortType.Boolean,
      }

      const serialized = JSON.stringify(config)
      const deserialized = JSON.parse(serialized)

      const result = booleanPortSchema.safeParse(deserialized)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).toEqual(config)
      }
    })

    it('should validate boolean port with default value through JSON serialization', () => {
      const config = {
        type: PortType.Boolean,
        defaultValue: true,
      }

      const serialized = JSON.stringify(config)
      const deserialized = JSON.parse(serialized)

      const result = booleanPortSchema.safeParse(deserialized)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).toEqual(config)
      }
    })
  })

  describe('common port properties', () => {
    it('should validate optional properties through JSON serialization', () => {
      const config = {
        type: PortType.String,
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

      const result = stringPortSchema.safeParse(deserialized)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).toEqual(config)
      }
    })

    it('should reject invalid metadata type through JSON serialization', () => {
      const config = {
        type: PortType.String,
        metadata: 'not an object', // Invalid: string instead of object
      }

      const serialized = JSON.stringify(config)
      const deserialized = JSON.parse(serialized)

      const result = stringPortSchema.safeParse(deserialized)
      expect(result.success).toBe(false)
    })

    it('should reject invalid optional type through JSON serialization', () => {
      const config = {
        type: PortType.String,
        optional: 'yes', // Invalid: string instead of boolean
      }

      const serialized = JSON.stringify(config)
      const deserialized = JSON.parse(serialized)

      const result = stringPortSchema.safeParse(deserialized)
      expect(result.success).toBe(false)
    })
  })
})
