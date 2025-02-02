import type { NumberPortConfig } from '../../base/number-port-config'
import { describe, expect, it } from 'vitest'
import { NumberPortInstance } from '../NumberPortInstance'

describe('numberPortInstance', () => {
  const createConfig = (overrides?: Partial<NumberPortConfig>): NumberPortConfig => ({
    type: 'number',
    id: 'test-port',
    title: 'Test Port',
    optional: false,
    ...overrides,
  })

  describe('constructor', () => {
    it('initializes with default value from config', () => {
      const config = createConfig({ defaultValue: 42 })
      const port = new NumberPortInstance(config)
      expect(port.getValue()).toBe(42)
    })

    it('initializes without value when no default provided', () => {
      const port = new NumberPortInstance(createConfig())
      expect(port.getValue()).toBeUndefined()
    })
  })

  describe('getValue', () => {
    it('returns current value when set', () => {
      const port = new NumberPortInstance(createConfig())
      port.setValue(42)
      expect(port.getValue()).toBe(42)
    })

    it('returns default value when no value is set', () => {
      const port = new NumberPortInstance(createConfig({ defaultValue: 42 }))
      expect(port.getValue()).toBe(42)
    })
  })

  describe('setValue', () => {
    it('sets valid number value', () => {
      const port = new NumberPortInstance(createConfig())
      port.setValue(42)
      expect(port.getValue()).toBe(42)
    })

    it('throws error for value below minimum', () => {
      const port = new NumberPortInstance(createConfig({ min: 0 }))
      expect(() => port.setValue(-1)).toThrow()
    })

    it('throws error for value above maximum', () => {
      const port = new NumberPortInstance(createConfig({ max: 100 }))
      expect(() => port.setValue(101)).toThrow()
    })

    it('throws error for non-integer when integer required', () => {
      const port = new NumberPortInstance(createConfig({ integer: true }))
      expect(() => port.setValue(42.5)).toThrow()
    })

    it('validates step constraints', () => {
      const port = new NumberPortInstance(createConfig({ step: 5 }))
      port.setValue(10) // Valid: divisible by 5
      expect(() => port.setValue(12)).toThrow() // Invalid: not divisible by 5
    })

    it('handles floating point steps correctly', () => {
      const port = new NumberPortInstance(createConfig({ step: 0.1 }))
      port.setValue(0.2) // Valid: multiple of 0.1
      port.setValue(0.3) // Valid: multiple of 0.1
      expect(() => port.setValue(0.123)).toThrow() // Invalid: not a multiple of 0.1
    })
  })

  describe('reset', () => {
    it('resets to default value when available', () => {
      const port = new NumberPortInstance(createConfig({ defaultValue: 42 }))
      port.setValue(100)
      port.reset()
      expect(port.getValue()).toBe(42)
    })

    it('resets to undefined when no default value', () => {
      const port = new NumberPortInstance(createConfig())
      port.setValue(100)
      port.reset()
      expect(port.getValue()).toBeUndefined()
    })
  })

  describe('serialize/deserialize', () => {
    it('serializes current value', () => {
      const port = new NumberPortInstance(createConfig())
      port.setValue(42)
      expect(port.serialize()).toBe(42)
    })

    it('serializes to null when no value set', () => {
      const port = new NumberPortInstance(createConfig())
      expect(port.serialize()).toBeNull()
    })

    it('deserializes valid number value', () => {
      const port = new NumberPortInstance(createConfig())
      port.deserialize(42)
      expect(port.getValue()).toBe(42)
    })

    it('deserializes number from string', () => {
      const port = new NumberPortInstance(createConfig())
      port.deserialize('42')
      expect(port.getValue()).toBe(42)
    })

    it('throws error when deserializing invalid value', () => {
      const port = new NumberPortInstance(createConfig())
      expect(() => port.deserialize('not a number')).toThrow()
      expect(() => port.deserialize({})).toThrow()
    })

    it('handles null/undefined in deserialization', () => {
      const port = new NumberPortInstance(createConfig())
      port.setValue(42)
      port.deserialize(null)
      expect(port.getValue()).toBeUndefined()
    })
  })

  describe('validate', () => {
    it('validates basic number type', () => {
      const port = new NumberPortInstance(createConfig())
      expect(port.validate(42)).toBe(true)
      expect(port.validate('42')).toBe(false)
      expect(port.validate({})).toBe(false)
      expect(port.validate(Number.NaN)).toBe(false)
      expect(port.validate(Infinity)).toBe(false)
    })

    it('validates min/max constraints', () => {
      const port = new NumberPortInstance(createConfig({ min: 0, max: 100 }))
      expect(port.validate(-1)).toBe(false)
      expect(port.validate(0)).toBe(true)
      expect(port.validate(50)).toBe(true)
      expect(port.validate(100)).toBe(true)
      expect(port.validate(101)).toBe(false)
    })

    it('validates integer constraint', () => {
      const port = new NumberPortInstance(createConfig({ integer: true }))
      expect(port.validate(42)).toBe(true)
      expect(port.validate(42.5)).toBe(false)
    })

    it('validates step constraints', () => {
      const port = new NumberPortInstance(createConfig({ step: 5 }))
      expect(port.validate(0)).toBe(true)
      expect(port.validate(5)).toBe(true)
      expect(port.validate(10)).toBe(true)
      expect(port.validate(7)).toBe(false)
    })
  })

  describe('type guard', () => {
    it('correctly identifies NumberPortInstance objects', () => {
      const port = new NumberPortInstance(createConfig())
      expect(NumberPortInstance.isNumberPortInstance(port)).toBe(true)
      expect(NumberPortInstance.isNumberPortInstance({})).toBe(false)
    })
  })
})
