import { describe, expect, it } from 'vitest'
import { PrimitivePortType } from '../../types/port-types'
import { BooleanPort, type BooleanPortConfig } from '../boolean'

describe('booleanPort', () => {
  const createConfig = (partial: Partial<BooleanPortConfig> = {}): BooleanPortConfig => ({
    id: 'test-port',
    name: 'Test Port',
    type: PrimitivePortType.Boolean,
    ...partial,
  })

  describe('constructor', () => {
    it('should create port with default value false', () => {
      const port = new BooleanPort(createConfig())
      expect(port.value).toBe(false)
    })

    it('should create port with provided default value', () => {
      const port = new BooleanPort(createConfig({ defaultValue: true }))
      expect(port.value).toBe(true)
    })
  })

  describe('setValue', () => {
    it('should set boolean value', () => {
      const port = new BooleanPort(createConfig())
      port.setValue(true)
      expect(port.value).toBe(true)
    })

    it('should throw error for non-boolean value', () => {
      const port = new BooleanPort(createConfig())
      // @ts-expect-error testing runtime type check
      expect(() => port.setValue('true')).toThrow(TypeError)
      // @ts-expect-error testing runtime type check
      expect(() => port.setValue(1)).toThrow(TypeError)
    })
  })

  describe('getValue', () => {
    it('should return current value', () => {
      const port = new BooleanPort(createConfig({ defaultValue: true }))
      expect(port.getValue()).toBe(true)
    })

    it('should return same value as value property', () => {
      const port = new BooleanPort(createConfig())
      expect(port.getValue()).toBe(port.value)
    })
  })

  describe('validate', () => {
    it('should return true when no validation is set', async () => {
      const port = new BooleanPort(createConfig())
      expect(await port.validate()).toBe(true)
    })

    it('should use custom validator when provided', async () => {
      const port = new BooleanPort(createConfig({
        validation: {
          validator: value => value === true,
        },
      }))

      port.setValue(false)
      expect(await port.validate()).toBe(false)

      port.setValue(true)
      expect(await port.validate()).toBe(true)
    })
  })

  describe('reset', () => {
    it('should reset to default value', () => {
      const port = new BooleanPort(createConfig({ defaultValue: true }))
      port.setValue(false)
      port.reset()
      expect(port.value).toBe(true)
    })

    it('should reset to false when no default value', () => {
      const port = new BooleanPort(createConfig())
      port.setValue(true)
      port.reset()
      expect(port.value).toBe(false)
    })
  })

  describe('hasValue', () => {
    it('should always return true', () => {
      const port = new BooleanPort(createConfig())
      expect(port.hasValue()).toBe(true)
      port.setValue(true)
      expect(port.hasValue()).toBe(true)
      port.setValue(false)
      expect(port.hasValue()).toBe(true)
    })
  })

  describe('clone', () => {
    it('should create new instance with same config', () => {
      const config = createConfig({ defaultValue: true })
      const port = new BooleanPort(config)
      const clone = port.clone()

      expect(clone).toBeInstanceOf(BooleanPort)
      expect(clone).not.toBe(port)
      expect(clone.value).toBe(port.value)
      expect(clone.config).toEqual(port.config)
    })

    it('should create independent instance', () => {
      const port = new BooleanPort(createConfig())
      const clone = port.clone()

      port.setValue(true)
      expect(clone.value).toBe(false)
    })
  })
})
