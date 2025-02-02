import { describe, expect, it } from 'vitest'
import { NumberPortPlugin, validateNumberValue } from '../plugins/NumberPortPlugin'

describe('number port plugin', () => {
  describe('config validation', () => {
    it('should validate valid config', () => {
      const result = NumberPortPlugin.configSchema.safeParse({
        type: 'number',
        name: 'test',
        min: 0,
        max: 10,
        step: 2,
      })
      expect(result.success).toBe(true)
    })

    it('should reject invalid min/max combination', () => {
      const result = NumberPortPlugin.configSchema.safeParse({
        type: 'number',
        min: 10,
        max: 5,
      })
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.errors[0].message).toContain('min (10) must be less than or equal to max (5)')
      }
    })

    it('should validate step alignment with range', () => {
      const result = NumberPortPlugin.configSchema.safeParse({
        type: 'number',
        min: 0,
        max: 10,
        step: 3, // 10 is not divisible by 3
      })
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.errors[0].message).toContain('step (3) must divide range (10) evenly')
      }
    })

    it('should validate default value constraints', () => {
      const results = [
        // Test min constraint
        NumberPortPlugin.configSchema.safeParse({
          type: 'number',
          min: 0,
          defaultValue: -1,
        }),
        // Test max constraint
        NumberPortPlugin.configSchema.safeParse({
          type: 'number',
          max: 10,
          defaultValue: 11,
        }),
        // Test step alignment
        NumberPortPlugin.configSchema.safeParse({
          type: 'number',
          min: 0,
          step: 2,
          defaultValue: 3,
        }),
        // Test integer constraint
        NumberPortPlugin.configSchema.safeParse({
          type: 'number',
          integer: true,
          defaultValue: 1.5,
        }),
      ]

      results.forEach((result) => {
        expect(result.success).toBe(false)
      })
    })

    it('should allow optional fields to be omitted', () => {
      const result = NumberPortPlugin.configSchema.safeParse({
        type: 'number',
      })
      expect(result.success).toBe(true)
    })
  })

  describe('value validation', () => {
    it('should validate valid value', () => {
      const result = NumberPortPlugin.valueSchema.safeParse({
        type: 'number',
        value: 5,
      })
      expect(result.success).toBe(true)
    })

    it('should validate number constraints', () => {
      // Test each constraint individually to avoid multiple errors
      const validations = [
        // Valid value
        validateNumberValue(4, {
          type: 'number',
          min: 0,
          max: 10,
          step: 2,
        }),
        // Too small
        validateNumberValue(-1, {
          type: 'number',
          min: 0,
        }),
        // Too big
        validateNumberValue(11, {
          type: 'number',
          max: 10,
        }),
        // Not aligned with step
        validateNumberValue(3, {
          type: 'number',
          min: 0,
          step: 2,
        }),
        // Not integer
        validateNumberValue(1.5, {
          type: 'number',
          integer: true,
        }),
      ]

      expect(validations[0]).toHaveLength(0) // Valid
      expect(validations[1]).toHaveLength(1) // Too small
      expect(validations[2]).toHaveLength(1) // Too big
      expect(validations[3]).toHaveLength(1) // Not aligned with step
      expect(validations[4]).toHaveLength(1) // Not integer

      // Verify specific error messages
      expect(validations[1][0]).toContain('greater than or equal to 0')
      expect(validations[2][0]).toContain('less than or equal to 10')
      expect(validations[3][0]).toContain('aligned with step 2')
      expect(validations[4][0]).toContain('must be an integer')
    })
  })

  describe('serialization', () => {
    it('should serialize number value', () => {
      const value = {
        type: 'number' as const,
        value: 42,
      }
      expect(NumberPortPlugin.serializeValue!(value)).toBe(42)
    })

    it('should deserialize to number value', () => {
      expect(NumberPortPlugin.deserializeValue!(42)).toEqual({
        type: 'number',
        value: 42,
      })
    })

    it('should throw on invalid deserialization input', () => {
      expect(() => NumberPortPlugin.deserializeValue!('42')).toThrow(TypeError)
      expect(() => NumberPortPlugin.deserializeValue!(Infinity)).toThrow(TypeError)
      expect(() => NumberPortPlugin.deserializeValue!(Number.NaN)).toThrow(TypeError)
    })
  })

  describe('integration', () => {
    it('should validate full port object', () => {
      const port = {
        config: {
          type: 'number' as const,
          min: 0,
          max: 10,
          step: 2,
          integer: true,
        },
        value: {
          type: 'number' as const,
          value: 4,
        },
      }

      const configResult = NumberPortPlugin.configSchema.safeParse(port.config)
      const valueResult = NumberPortPlugin.valueSchema.safeParse(port.value)
      const validationResult = validateNumberValue(port.value.value, port.config)

      expect(configResult.success).toBe(true)
      expect(valueResult.success).toBe(true)
      expect(validationResult).toHaveLength(0)
    })

    it('should reject invalid combinations', () => {
      const port = {
        config: {
          type: 'number' as const,
          min: 0,
          max: 10,
          step: 2,
          integer: true,
        },
        value: {
          type: 'number' as const,
          value: 3.5, // Not integer and not aligned with step
        },
      }

      const validationResult = validateNumberValue(port.value.value, port.config)
      expect(validationResult.length).toBeGreaterThan(0)
      expect(validationResult).toContain('Value must be an integer')
      expect(validationResult).toContain('Value must be aligned with step 2')
    })
  })
})
