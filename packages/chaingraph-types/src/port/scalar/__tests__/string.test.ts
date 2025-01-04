import { describe, expect, it } from 'vitest'
import { PortTypeEnum } from '../../types/port-types'
import { StringPort, type StringPortConfig } from '../string'

describe('stringPort', () => {
  // Helper function to create a port with default config
  const createPort = (config?: Partial<StringPortConfig>) => {
    return new StringPort({
      id: 'test-string',
      name: 'Test String',
      type: PortTypeEnum.String,
      ...config,
    })
  }

  describe('initialization', () => {
    it('should initialize with empty string as default value', () => {
      const port = createPort()
      expect(port.getValue()).toBe('')
    })

    it('should initialize with provided default value', () => {
      const port = createPort({ defaultValue: 'test' })
      expect(port.getValue()).toBe('test')
    })

    it('should have correct configuration', () => {
      const config: StringPortConfig = {
        id: 'test-id',
        name: 'Test Name',
        type: PortTypeEnum.String,
        defaultValue: 'default',
      }
      const port = new StringPort(config)
      expect(port.config).toEqual(config)
    })
  })

  describe('value operations', () => {
    it('should get and set values correctly', () => {
      const port = createPort()

      port.setValue('hello')
      expect(port.getValue()).toBe('hello')
      expect(port.value).toBe('hello')

      port.setValue('')
      expect(port.getValue()).toBe('')
      expect(port.value).toBe('')
    })

    it('should throw error when setting invalid value type', () => {
      const port = createPort()

      // @ts-expect-error Testing runtime type check
      expect(() => port.setValue(123)).toThrow()
      // @ts-expect-error Testing runtime type check
      expect(() => port.setValue(true)).toThrow()
      // @ts-expect-error Testing runtime type check
      expect(() => port.setValue({})).toThrow()
    })

    it('should correctly check if has value', () => {
      const port = createPort()
      expect(port.hasValue()).toBe(false)

      port.setValue('test')
      expect(port.hasValue()).toBe(true)

      port.setValue('')
      expect(port.hasValue()).toBe(false)
    })

    it('should reset to default value', () => {
      const port = createPort({ defaultValue: 'default' })
      port.setValue('test')
      port.reset()
      expect(port.getValue()).toBe('default')
    })
  })

  describe('validation', () => {
    it('should validate without validation rules', async () => {
      const port = createPort()
      expect(await port.validate()).toBe(true)
    })

    it('should validate minimum length', async () => {
      const port = createPort({
        validation: {
          minLength: 3,
        },
      })

      port.setValue('ab')
      expect(await port.validate()).toBe(false)

      port.setValue('abc')
      expect(await port.validate()).toBe(true)

      port.setValue('abcd')
      expect(await port.validate()).toBe(true)
    })

    it('should validate maximum length', async () => {
      const port = createPort({
        validation: {
          maxLength: 3,
        },
      })

      port.setValue('abcd')
      expect(await port.validate()).toBe(false)

      port.setValue('abc')
      expect(await port.validate()).toBe(true)

      port.setValue('ab')
      expect(await port.validate()).toBe(true)
    })

    it('should validate with both min and max length', async () => {
      const port = createPort({
        validation: {
          minLength: 2,
          maxLength: 4,
        },
      })

      port.setValue('a')
      expect(await port.validate()).toBe(false)

      port.setValue('ab')
      expect(await port.validate()).toBe(true)

      port.setValue('abcd')
      expect(await port.validate()).toBe(true)

      port.setValue('abcde')
      expect(await port.validate()).toBe(false)
    })

    it('should validate with custom validator', async () => {
      const port = createPort({
        validation: {
          validator: async value => (value as string).startsWith('test'),
        },
      })

      port.setValue('hello')
      expect(await port.validate()).toBe(false)

      port.setValue('test123')
      expect(await port.validate()).toBe(true)
    })

    it('should combine custom validator with length validation', async () => {
      const port = createPort({
        validation: {
          minLength: 5,
          maxLength: 10,
          validator: async value => (value as string).startsWith('test'),
        },
      })

      port.setValue('test')
      expect(await port.validate()).toBe(false) // too short

      port.setValue('hello12345')
      expect(await port.validate()).toBe(false) // doesn't start with 'test'

      port.setValue('test12345678')
      expect(await port.validate()).toBe(false) // too long

      port.setValue('test123')
      expect(await port.validate()).toBe(true)
    })
  })

  describe('cloning', () => {
    it('should clone port with all properties', () => {
      const originalPort = createPort({
        defaultValue: 'test',
        validation: {
          minLength: 2,
          maxLength: 4,
        },
      })

      const clonedPort = originalPort.clone()

      expect(clonedPort).toBeInstanceOf(StringPort)
      expect(clonedPort.config).toEqual(originalPort.config)
      expect(clonedPort.getValue()).toBe(originalPort.getValue())
    })

    it('should create independent clone', () => {
      const originalPort = createPort({ defaultValue: 'original' })
      const clonedPort = originalPort.clone()

      clonedPort.setValue('modified')
      expect(originalPort.getValue()).toBe('original')
      expect(clonedPort.getValue()).toBe('modified')
    })
  })

  describe('error handling', () => {
    it('should handle undefined validation properly', async () => {
      const port = createPort({ validation: undefined })
      expect(await port.validate()).toBe(true)
    })

    it('should handle validator errors gracefully', async () => {
      const port = createPort({
        validation: {
          validator: async () => {
            throw new Error('Validation error')
          },
        },
      })

      await expect(port.validate()).rejects.toThrow('Validation error')
    })
  })
})
