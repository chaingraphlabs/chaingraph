import type { BooleanPortConfig } from '../boolean'
import { describe, expect, it } from 'vitest'
import { BooleanPort } from '../boolean'

describe('booleanPort', () => {
  // Helper function to create a port with default config
  const createPort = (config?: Partial<BooleanPortConfig>) => {
    return new BooleanPort({
      id: 'test-bool',
      name: 'Test Boolean',
      direction: 'input',
      type: 'boolean',
      ...config,
    })
  }

  describe('initialization', () => {
    it('should initialize with default value', () => {
      const port = createPort()
      expect(port.getValue()).toBe(false)
    })

    it('should initialize with provided default value', () => {
      const port = createPort({ defaultValue: true })
      expect(port.getValue()).toBe(true)
    })

    it('should have correct configuration', () => {
      const config: BooleanPortConfig = {
        id: 'test-id',
        name: 'Test Name',
        direction: 'output',
        type: 'boolean',
        description: 'Test description',
        defaultValue: true,
      }
      const port = new BooleanPort(config)

      expect(port.config).toEqual(config)
    })
  })

  describe('value operations', () => {
    it('should get and set values correctly', () => {
      const port = createPort()

      port.setValue(true)
      expect(port.getValue()).toBe(true)
      expect(port.value).toBe(true)

      port.setValue(false)
      expect(port.getValue()).toBe(false)
      expect(port.value).toBe(false)
    })

    it('should throw error when setting invalid value type', () => {
      const port = createPort()

      // @ts-expect-error Testing runtime type check
      expect(() => port.setValue('true')).toThrow()
      // @ts-expect-error Testing runtime type check
      expect(() => port.setValue(1)).toThrow()
      // @ts-expect-error Testing runtime type check
      expect(() => port.setValue({})).toThrow()
    })

    it('should always return hasValue as true', () => {
      const port = createPort()
      expect(port.hasValue()).toBe(true)

      port.setValue(true)
      expect(port.hasValue()).toBe(true)

      port.setValue(false)
      expect(port.hasValue()).toBe(true)
    })

    it('should reset to default value', () => {
      const port = createPort({ defaultValue: true })
      port.setValue(false)
      port.reset()
      expect(port.getValue()).toBe(true)
    })
  })

  describe('validation', () => {
    it('should validate without validation rules', async () => {
      const port = createPort()
      expect(await port.validate()).toBe(true)
    })

    it('should validate with custom validator', async () => {
      const port = createPort({
        validation: {
          validator: async value => (value as boolean) === true,
          errorMessage: 'Value must be true',
        },
      })

      port.setValue(true)
      expect(await port.validate()).toBe(true)

      port.setValue(false)
      expect(await port.validate()).toBe(false)
    })

    it('should validate allowed values', async () => {
      const port = createPort({
        validation: {
          allowedValues: [true],
        },
      })

      port.setValue(true)
      expect(await port.validate()).toBe(true)

      port.setValue(false)
      expect(await port.validate()).toBe(false)
    })

    it('should combine custom validator with allowed values', async () => {
      const port = createPort({
        validation: {
          allowedValues: [true],
          validator: async value => (value as boolean) === true,
        },
      })

      port.setValue(true)
      expect(await port.validate()).toBe(true)

      port.setValue(false)
      expect(await port.validate()).toBe(false)
    })
  })

  describe('boolean operations', () => {
    it('should toggle value correctly', () => {
      const port = createPort({ defaultValue: false })

      expect(port.toggle()).toBe(true)
      expect(port.getValue()).toBe(true)

      expect(port.toggle()).toBe(false)
      expect(port.getValue()).toBe(false)
    })

    it('should perform AND operation correctly', () => {
      const port = createPort({ defaultValue: true })

      expect(port.and(true)).toBe(true)
      expect(port.and(false)).toBe(false)

      port.setValue(false)
      expect(port.and(true)).toBe(false)
      expect(port.and(false)).toBe(false)
    })

    it('should perform OR operation correctly', () => {
      const port = createPort({ defaultValue: true })

      expect(port.or(true)).toBe(true)
      expect(port.or(false)).toBe(true)

      port.setValue(false)
      expect(port.or(true)).toBe(true)
      expect(port.or(false)).toBe(false)
    })

    it('should perform NOT operation correctly', () => {
      const port = createPort({ defaultValue: true })
      expect(port.not()).toBe(false)

      port.setValue(false)
      expect(port.not()).toBe(true)
    })
  })

  describe('cloning', () => {
    it('should clone port with all properties', () => {
      const originalPort = createPort({
        defaultValue: true,
        description: 'Test port',
        validation: {
          allowedValues: [true],
          errorMessage: 'Must be true',
        },
      })

      const clonedPort = originalPort.clone()

      expect(clonedPort).toBeInstanceOf(BooleanPort)
      expect(clonedPort.config).toEqual(originalPort.config)
      expect(clonedPort.getValue()).toBe(originalPort.getValue())
    })

    it('should create independent clone', () => {
      const originalPort = createPort({ defaultValue: true })
      const clonedPort = originalPort.clone()

      clonedPort.setValue(false)
      expect(originalPort.getValue()).toBe(true)
      expect(clonedPort.getValue()).toBe(false)
    })
  })

  describe('string conversion', () => {
    it('should convert to string correctly', () => {
      const port = createPort()

      expect(port.toString()).toBe('false')

      port.setValue(true)
      expect(port.toString()).toBe('true')
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
