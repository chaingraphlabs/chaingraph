import { describe, expect, it } from 'vitest'
import { StringPort, type StringPortConfig } from '../string'

describe('stringPort', () => {
  // Helper function to create a default config
  const createConfig = (override: Partial<StringPortConfig> = {}): StringPortConfig => ({
    id: 'test-port',
    name: 'Test Port',
    direction: 'input',
    type: 'string',
    ...override,
  })

  describe('constructor', () => {
    it('should create instance with default values', () => {
      const port = new StringPort(createConfig())
      expect(port.getValue()).toBe('')
      expect(port.config.type).toBe('string')
    })

    it('should initialize with default value from config', () => {
      const port = new StringPort(createConfig({ defaultValue: 'default' }))
      expect(port.getValue()).toBe('default')
    })
  })

  describe('value operations', () => {
    it('should get and set value correctly', () => {
      const port = new StringPort(createConfig())
      port.setValue('test value')
      expect(port.getValue()).toBe('test value')
      expect(port.value).toBe('test value')
    })

    it('should reset to default value', () => {
      const port = new StringPort(createConfig({ defaultValue: 'default' }))
      port.setValue('test value')
      port.reset()
      expect(port.getValue()).toBe('default')
    })

    it('should reset to empty string when no default provided', () => {
      const port = new StringPort(createConfig())
      port.setValue('test value')
      port.reset()
      expect(port.getValue()).toBe('')
    })

    it('should correctly report if has value', () => {
      const port = new StringPort(createConfig())
      expect(port.hasValue()).toBe(false)
      port.setValue('test')
      expect(port.hasValue()).toBe(true)
      port.setValue('')
      expect(port.hasValue()).toBe(false)
    })
  })

  describe('validation', () => {
    it('should pass validation when no rules defined', async () => {
      const port = new StringPort(createConfig())
      expect(await port.validate()).toBe(true)
    })

    it('should validate minimum length', async () => {
      const port = new StringPort(createConfig({
        validation: {
          minLength: 5,
        },
      }))

      port.setValue('test')
      expect(await port.validate()).toBe(false)

      port.setValue('testing')
      expect(await port.validate()).toBe(true)
    })

    it('should validate maximum length', async () => {
      const port = new StringPort(createConfig({
        validation: {
          maxLength: 5,
        },
      }))

      port.setValue('testing')
      expect(await port.validate()).toBe(false)

      port.setValue('test')
      expect(await port.validate()).toBe(true)
    })

    it('should validate regex pattern', async () => {
      const port = new StringPort(createConfig({
        validation: {
          pattern: /^[A-Z]+$/,
        },
      }))

      port.setValue('test')
      expect(await port.validate()).toBe(false)

      port.setValue('TEST')
      expect(await port.validate()).toBe(true)
    })

    it('should support custom validator function', async () => {
      const port = new StringPort(createConfig({
        validation: {
          // Make the validation rule more specific
          validator: value => (value as string).startsWith('valid-'),
        },
      }))

      port.setValue('invalid-test')
      expect(await port.validate()).toBe(false)

      port.setValue('valid-test')
      expect(await port.validate()).toBe(true)
    })

    it('should combine multiple validation rules', async () => {
      const port = new StringPort(createConfig({
        validation: {
          minLength: 5,
          maxLength: 10,
          pattern: /^[A-Z]+$/,
          validator: value => (value as string).includes('TEST'),
        },
      }))

      port.setValue('TEST')
      expect(await port.validate()).toBe(false) // too short

      port.setValue('TESTING')
      expect(await port.validate()).toBe(true) // meets all criteria

      port.setValue('TOOLONGSTRING')
      expect(await port.validate()).toBe(false) // too long

      port.setValue('invalid')
      expect(await port.validate()).toBe(false) // doesn't match pattern
    })
  })

  describe('cloning', () => {
    it('should create a new instance with the same config', () => {
      const config = createConfig({
        defaultValue: 'default',
        validation: {
          minLength: 5,
        },
      })

      const original = new StringPort(config)
      original.setValue('test value')

      const cloned = original.clone()

      // Should have same config
      expect(cloned.config).toEqual(original.config)

      // Should have default value, not current value
      expect(cloned.getValue()).toBe(config.defaultValue)

      // Should be a different instance
      expect(cloned).not.toBe(original)
    })

    it('should maintain independence after cloning', () => {
      const original = new StringPort(createConfig())
      const cloned = original.clone()

      original.setValue('original')
      cloned.setValue('cloned')

      expect(original.getValue()).toBe('original')
      expect(cloned.getValue()).toBe('cloned')
    })
  })

  describe('edge cases', () => {
    it('should handle empty strings', () => {
      const port = new StringPort(createConfig())
      port.setValue('')
      expect(port.getValue()).toBe('')
      expect(port.hasValue()).toBe(false)
    })

    it('should handle whitespace strings', () => {
      const port = new StringPort(createConfig())
      port.setValue('   ')
      expect(port.getValue()).toBe('   ')
      expect(port.hasValue()).toBe(true)
    })

    it('should preserve string with special characters', () => {
      const port = new StringPort(createConfig())
      const specialString = '!@#$%^&*()\n\t'
      port.setValue(specialString)
      expect(port.getValue()).toBe(specialString)
    })
  })
})
