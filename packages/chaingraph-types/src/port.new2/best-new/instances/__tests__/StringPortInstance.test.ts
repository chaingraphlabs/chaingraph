import type { StringPortConfig, StringPortValue } from '../../base/types'
import { describe, expect, it } from 'vitest'
import { StringPortInstance } from '../StringPortInstance'

describe('stringPortInstance', () => {
  const createConfig = (overrides?: Partial<StringPortConfig>): StringPortConfig => ({
    type: 'string',
    id: 'test-port',
    name: 'Test Port',
    ...overrides,
  })

  const createValue = (str: string): StringPortValue => ({
    type: 'string',
    value: str,
  })

  describe('constructor', () => {
    it('initializes with empty value', () => {
      const port = new StringPortInstance(createConfig())
      expect(port.getValue()).toBeUndefined()
    })
  })

  describe('getValue', () => {
    it('returns current value when set', () => {
      const port = new StringPortInstance(createConfig())
      port.setValue(createValue('test'))
      expect(port.getValue()).toEqual(createValue('test'))
    })
  })

  describe('setValue', () => {
    it('sets valid string value', () => {
      const port = new StringPortInstance(createConfig())
      port.setValue(createValue('test'))
      expect(port.getValue()).toEqual(createValue('test'))
    })

    it('validates string length constraints', () => {
      const port = new StringPortInstance(createConfig({
        minLength: 3,
        maxLength: 5,
      }))

      port.setValue(createValue('test')) // Valid: length 4
      expect(() => port.setValue(createValue('ab'))).toThrow() // Too short
      expect(() => port.setValue(createValue('too long'))).toThrow() // Too long
    })

    it('validates pattern constraint', () => {
      const port = new StringPortInstance(createConfig({
        pattern: '^[A-Z][a-z]+$', // Capitalized word
      }))

      port.setValue(createValue('Hello')) // Valid
      expect(() => port.setValue(createValue('hello'))).toThrow() // Invalid: not capitalized
      expect(() => port.setValue(createValue('HELLO'))).toThrow() // Invalid: all caps
    })

    it('throws error for invalid value type', () => {
      const port = new StringPortInstance(createConfig())
      expect(() => port.setValue({ type: 'number', value: 42 } as any)).toThrow()
    })
  })

  describe('reset', () => {
    it('resets to undefined', () => {
      const port = new StringPortInstance(createConfig())
      port.setValue(createValue('test'))
      port.reset()
      expect(port.getValue()).toBeUndefined()
    })
  })

  describe('serialize/deserialize', () => {
    it('serializes current value and config', () => {
      const config = createConfig()
      const port = new StringPortInstance(config)
      const value = createValue('test')
      port.setValue(value)
      expect(port.serialize()).toEqual({
        config,
        value,
      })
    })

    it('serializes with undefined value when no value set', () => {
      const config = createConfig()
      const port = new StringPortInstance(config)
      expect(port.serialize()).toEqual({
        config,
        value: undefined,
      })
    })

    it('deserializes valid data', () => {
      const config = createConfig()
      const value = createValue('test')
      const port = new StringPortInstance(config)

      port.deserialize({
        config,
        value,
      })

      expect(port.getValue()).toEqual(value)
    })

    it('throws error when deserializing invalid data', () => {
      const port = new StringPortInstance(createConfig())
      expect(() => port.deserialize('not an object')).toThrow()
      expect(() => port.deserialize({})).toThrow()
      expect(() => port.deserialize({ config: null, value: null })).toThrow()
    })
  })

  describe('validate', () => {
    it('validates configuration', () => {
      const port = new StringPortInstance(createConfig())
      expect(port.validate()).toBe(true)
    })

    it('validates with valid value', () => {
      const port = new StringPortInstance(createConfig())
      port.setValue(createValue('test'))
      expect(port.validate()).toBe(true)
    })

    it('validates with constraints', () => {
      const port = new StringPortInstance(createConfig({
        minLength: 3,
        maxLength: 5,
        pattern: '^[A-Z][a-z]+$',
      }))

      port.setValue(createValue('Test'))
      expect(port.validate()).toBe(true)

      // Reset and try invalid values
      port.reset()
      expect(() => port.setValue(createValue('ab'))).toThrow() // Too short
      expect(() => port.setValue(createValue('too long'))).toThrow() // Too long
      expect(() => port.setValue(createValue('test'))).toThrow() // Not capitalized
    })
  })

  describe('type guard', () => {
    it('correctly identifies StringPortInstance objects', () => {
      const port = new StringPortInstance(createConfig())
      expect(StringPortInstance.isStringPortInstance(port)).toBe(true)
      expect(StringPortInstance.isStringPortInstance({})).toBe(false)
      expect(StringPortInstance.isStringPortInstance(null)).toBe(false)
      expect(StringPortInstance.isStringPortInstance(undefined)).toBe(false)
    })
  })
})
