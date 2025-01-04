import { PortTypeEnum } from '@chaingraph/types/port/types/port-types'
import { Decimal } from 'decimal.js'
import { describe, expect, it } from 'vitest'
import { NumberPort } from '../number'

describe('numberPort', () => {
  describe('constructor', () => {
    it('should create with default value', () => {
      const port = new NumberPort({
        id: 'test',
        name: 'Test Port',
        type: PortTypeEnum.Number,
      })

      expect(port.value.equals(0)).toBe(true)
    })

    it('should create with specified default value', () => {
      const port = new NumberPort({
        id: 'test',
        name: 'Test Port',
        type: PortTypeEnum.Number,
        defaultValue: new Decimal(42),
      })

      expect(port.value.equals(42)).toBe(true)
    })
  })

  describe('setValue', () => {
    it('should set valid decimal value', () => {
      const port = new NumberPort({
        id: 'test',
        name: 'Test Port',
        type: PortTypeEnum.Number,
      })

      const newValue = new Decimal(123.45)
      port.setValue(newValue)
      expect(port.value.equals(newValue)).toBe(true)
    })

    it('should throw error for non-decimal value', () => {
      const port = new NumberPort({
        id: 'test',
        name: 'Test Port',
        type: PortTypeEnum.Number,
      })

      // @ts-expect-error Testing runtime type check
      expect(() => port.setValue(123)).toThrow('NumberPort only accepts Decimal values')
    })
  })

  describe('validation', () => {
    it('should validate minimum value', async () => {
      const port = new NumberPort({
        id: 'test',
        name: 'Test Port',
        type: PortTypeEnum.Number,
        validation: {
          min: 10,
        },
      })

      port.setValue(new Decimal(5))
      expect(await port.validate()).toBe(false)

      port.setValue(new Decimal(15))
      expect(await port.validate()).toBe(true)
    })

    it('should validate maximum value', async () => {
      const port = new NumberPort({
        id: 'test',
        name: 'Test Port',
        type: PortTypeEnum.Number,
        validation: {
          max: 100,
        },
      })

      port.setValue(new Decimal(150))
      expect(await port.validate()).toBe(false)

      port.setValue(new Decimal(50))
      expect(await port.validate()).toBe(true)
    })

    it('should validate integer constraint', async () => {
      const port = new NumberPort({
        id: 'test',
        name: 'Test Port',
        type: PortTypeEnum.Number,
        validation: {
          integer: true,
        },
      })

      port.setValue(new Decimal(10.5))
      expect(await port.validate()).toBe(false)

      port.setValue(new Decimal(10))
      expect(await port.validate()).toBe(true)
    })

    it('should run custom validator', async () => {
      const port = new NumberPort({
        id: 'test',
        name: 'Test Port',
        type: PortTypeEnum.Number,
        validation: {
          validator: value => value instanceof Decimal && value.modulo(2).equals(0),
        },
      })

      port.setValue(new Decimal(7))
      expect(await port.validate()).toBe(false)

      port.setValue(new Decimal(8))
      expect(await port.validate()).toBe(true)
    })
  })

  describe('reset', () => {
    it('should reset to default value', () => {
      const defaultValue = new Decimal(42)
      const port = new NumberPort({
        id: 'test',
        name: 'Test Port',
        type: PortTypeEnum.Number,
        defaultValue,
      })

      port.setValue(new Decimal(100))
      port.reset()
      expect(port.value.equals(defaultValue)).toBe(true)
    })
  })

  describe('clone', () => {
    it('should create independent copy with same values', () => {
      const original = new NumberPort({
        id: 'test',
        name: 'Test Port',
        type: PortTypeEnum.Number,
        defaultValue: new Decimal(42),
        validation: {
          min: 0,
          max: 100,
        },
      })

      const cloned = original.clone()

      expect(cloned.value.equals(original.value)).toBe(true)
      expect(cloned).not.toBe(original)
      expect(cloned.config).toEqual(original.config)
    })
  })

  describe('hasValue', () => {
    it('should return true for valid number', () => {
      const port = new NumberPort({
        id: 'test',
        name: 'Test Port',
        type: PortTypeEnum.Number,
      })

      expect(port.hasValue()).toBe(true)
    })

    it('should return false for NaN', () => {
      const port = new NumberPort({
        id: 'test',
        name: 'Test Port',
        type: PortTypeEnum.Number,
      })

      port.setValue(new Decimal(Number.NaN))
      expect(port.hasValue()).toBe(false)
    })
  })
})
