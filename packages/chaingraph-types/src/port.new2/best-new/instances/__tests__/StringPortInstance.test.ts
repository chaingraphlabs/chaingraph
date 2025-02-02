import type { PortConfig } from '../../base/new-port-config'
import { describe, expect, it } from 'vitest'
import { StringPortInstance } from '../StringPortInstance'

describe('stringPortInstance', () => {
  const createConfig = (overrides?: Partial<PortConfig<string>>): PortConfig<string> => ({
    type: 'string',
    id: 'test-port',
    title: 'Test Port',
    optional: false,
    ...overrides,
  })

  describe('constructor', () => {
    it('initializes with default value from config', () => {
      const config = createConfig({ defaultValue: 'default' })
      const port = new StringPortInstance(config)
      expect(port.getValue()).toBe('default')
    })

    it('initializes without value when no default provided', () => {
      const port = new StringPortInstance(createConfig())
      expect(port.getValue()).toBeUndefined()
    })
  })

  describe('getValue', () => {
    it('returns current value when set', () => {
      const port = new StringPortInstance(createConfig())
      port.setValue('test')
      expect(port.getValue()).toBe('test')
    })

    it('returns default value when no value is set', () => {
      const port = new StringPortInstance(createConfig({ defaultValue: 'default' }))
      expect(port.getValue()).toBe('default')
    })
  })

  describe('setValue', () => {
    it('sets valid string value', () => {
      const port = new StringPortInstance(createConfig())
      port.setValue('test')
      expect(port.getValue()).toBe('test')
    })

    it('throws error for empty string when port is not optional', () => {
      const port = new StringPortInstance(createConfig({ optional: false }))
      expect(() => port.setValue('')).toThrow()
    })

    it('allows empty string when port is optional', () => {
      const port = new StringPortInstance(createConfig({ optional: true }))
      port.setValue('')
      expect(port.getValue()).toBe('')
    })
  })

  describe('reset', () => {
    it('resets to default value when available', () => {
      const port = new StringPortInstance(createConfig({ defaultValue: 'default' }))
      port.setValue('test')
      port.reset()
      expect(port.getValue()).toBe('default')
    })

    it('resets to undefined when no default value', () => {
      const port = new StringPortInstance(createConfig())
      port.setValue('test')
      port.reset()
      expect(port.getValue()).toBeUndefined()
    })
  })

  describe('serialize/deserialize', () => {
    it('serializes current value', () => {
      const port = new StringPortInstance(createConfig())
      port.setValue('test')
      expect(port.serialize()).toBe('test')
    })

    it('serializes to null when no value set', () => {
      const port = new StringPortInstance(createConfig())
      expect(port.serialize()).toBeNull()
    })

    it('deserializes valid string value', () => {
      const port = new StringPortInstance(createConfig())
      port.deserialize('test')
      expect(port.getValue()).toBe('test')
    })

    it('throws error when deserializing invalid value', () => {
      const port = new StringPortInstance(createConfig())
      expect(() => port.deserialize(123)).toThrow()
    })

    it('handles null/undefined in deserialization', () => {
      const port = new StringPortInstance(createConfig())
      port.setValue('test')
      port.deserialize(null)
      expect(port.getValue()).toBeUndefined()
    })
  })

  describe('validate', () => {
    it('returns true for valid strings', () => {
      const port = new StringPortInstance(createConfig())
      expect(port.validate('test')).toBe(true)
    })

    it('returns false for non-string values', () => {
      const port = new StringPortInstance(createConfig())
      expect(port.validate(123)).toBe(false)
      expect(port.validate({})).toBe(false)
      expect(port.validate([])).toBe(false)
    })

    it('validates empty strings based on optional flag', () => {
      const requiredPort = new StringPortInstance(createConfig({ optional: false }))
      const optionalPort = new StringPortInstance(createConfig({ optional: true }))

      expect(requiredPort.validate('')).toBe(false)
      expect(optionalPort.validate('')).toBe(true)
    })
  })

  describe('type guard', () => {
    it('correctly identifies StringPortInstance objects', () => {
      const port = new StringPortInstance(createConfig())
      expect(StringPortInstance.isStringPortInstance(port)).toBe(true)
      expect(StringPortInstance.isStringPortInstance({})).toBe(false)
    })
  })
})
