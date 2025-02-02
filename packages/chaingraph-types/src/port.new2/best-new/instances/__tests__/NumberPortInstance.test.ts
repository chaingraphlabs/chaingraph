import type { NumberPortConfig, NumberPortValue } from '../../base/types'
import { describe, expect, it } from 'vitest'
import { NumberPortInstance } from '../NumberPortInstance'

describe('numberPortInstance', () => {
  const createConfig = (overrides?: Partial<NumberPortConfig>): NumberPortConfig => ({
    type: 'number',
    id: 'test-port',
    name: 'Test Port',
    ...overrides,
  })

  const createValue = (num: number): NumberPortValue => ({
    type: 'number',
    value: num,
  })

  describe('constructor', () => {
    it('initializes with empty value', () => {
      const port = new NumberPortInstance(createConfig())
      expect(port.getValue()).toBeUndefined()
    })
  })

  describe('getValue', () => {
    it('returns current value when set', () => {
      const port = new NumberPortInstance(createConfig())
      port.setValue(createValue(42))
      expect(port.getValue()).toEqual(createValue(42))
    })
  })

  describe('setValue', () => {
    it('sets valid number value', () => {
      const port = new NumberPortInstance(createConfig())
      port.setValue(createValue(42))
      expect(port.getValue()).toEqual(createValue(42))
    })

    it('throws error for value below minimum', () => {
      const port = new NumberPortInstance(createConfig({ min: 0 }))
      expect(() => port.setValue(createValue(-1))).toThrow()
    })

    it('throws error for value above maximum', () => {
      const port = new NumberPortInstance(createConfig({ max: 100 }))
      expect(() => port.setValue(createValue(101))).toThrow()
    })

    it('throws error for non-integer when integer required', () => {
      const port = new NumberPortInstance(createConfig({ integer: true }))
      expect(() => port.setValue(createValue(42.5))).toThrow()
    })

    it('validates step constraints', () => {
      const port = new NumberPortInstance(createConfig({ step: 5 }))
      port.setValue(createValue(10)) // Valid: divisible by 5
      expect(() => port.setValue(createValue(12))).toThrow() // Invalid: not divisible by 5
    })

    it('handles floating point steps correctly', () => {
      const port = new NumberPortInstance(createConfig({ step: 0.1 }))
      port.setValue(createValue(0.2)) // Valid: multiple of 0.1
      port.setValue(createValue(0.3)) // Valid: multiple of 0.1
      expect(() => port.setValue(createValue(0.123))).toThrow() // Invalid: not a multiple of 0.1
    })

    it('throws error for invalid value type', () => {
      const port = new NumberPortInstance(createConfig())
      expect(() => port.setValue({ type: 'string', value: '42' } as any)).toThrow()
    })
  })

  describe('reset', () => {
    it('resets to undefined', () => {
      const port = new NumberPortInstance(createConfig())
      port.setValue(createValue(100))
      port.reset()
      expect(port.getValue()).toBeUndefined()
    })
  })

  describe('serialize/deserialize', () => {
    it('serializes current value and config', () => {
      const config = createConfig()
      const port = new NumberPortInstance(config)
      const value = createValue(42)
      port.setValue(value)
      expect(port.serialize()).toEqual({
        config,
        value,
      })
    })

    it('serializes with undefined value when no value set', () => {
      const config = createConfig()
      const port = new NumberPortInstance(config)
      expect(port.serialize()).toEqual({
        config,
        value: undefined,
      })
    })

    it('deserializes valid data', () => {
      const config = createConfig()
      const value = createValue(42)
      const port = new NumberPortInstance(config)

      port.deserialize({
        config,
        value,
      })

      expect(port.getValue()).toEqual(value)
    })

    it('throws error when deserializing invalid data', () => {
      const port = new NumberPortInstance(createConfig())
      expect(() => port.deserialize('not an object')).toThrow()
      expect(() => port.deserialize({})).toThrow()
      expect(() => port.deserialize({ config: null, value: null })).toThrow()
    })
  })

  describe('validate', () => {
    it('validates configuration', () => {
      const port = new NumberPortInstance(createConfig())
      expect(port.validate()).toBe(true)
    })

    it('validates with valid value', () => {
      const port = new NumberPortInstance(createConfig())
      port.setValue(createValue(42))
      expect(port.validate()).toBe(true)
    })

    it('validates with constraints', () => {
      const port = new NumberPortInstance(createConfig({
        min: 0,
        max: 100,
        integer: true,
        step: 5,
      }))

      port.setValue(createValue(50))
      expect(port.validate()).toBe(true)

      // Reset and try invalid values
      port.reset()
      expect(() => port.setValue(createValue(-1))).toThrow() // Below min
      expect(() => port.setValue(createValue(101))).toThrow() // Above max
      expect(() => port.setValue(createValue(42.5))).toThrow() // Not integer
      expect(() => port.setValue(createValue(42))).toThrow() // Not divisible by step
    })
  })

  describe('type guard', () => {
    it('correctly identifies NumberPortInstance objects', () => {
      const port = new NumberPortInstance(createConfig())
      expect(NumberPortInstance.isNumberPortInstance(port)).toBe(true)
      expect(NumberPortInstance.isNumberPortInstance({})).toBe(false)
      expect(NumberPortInstance.isNumberPortInstance(null)).toBe(false)
      expect(NumberPortInstance.isNumberPortInstance(undefined)).toBe(false)
    })
  })
})
