import { Decimal } from 'decimal.js'
import { beforeEach, describe, expect, it } from 'vitest'
import { NumberPort, type NumberPortConfig } from '../number'

describe('numberPort', () => {
  let defaultConfig: NumberPortConfig

  beforeEach(() => {
    defaultConfig = {
      id: 'test-number-port',
      name: 'Test Number Port',
      direction: 'input',
      type: 'number',
    }
  })

  describe('basic functionality', () => {
    it('should create with default value', () => {
      const port = new NumberPort({
        ...defaultConfig,
        defaultValue: 42,
      })
      expect(port.getValue().equals(new Decimal(42))).toBe(true)
    })

    it('should create with zero when no default value provided', () => {
      const port = new NumberPort(defaultConfig)
      expect(port.getValue().equals(new Decimal(0))).toBe(true)
    })

    it('should set and get value correctly', () => {
      const port = new NumberPort(defaultConfig)

      port.setValue(123)
      expect(port.getValue().equals(new Decimal(123))).toBe(true)

      port.setValue('456.789')
      expect(port.getValue().equals(new Decimal('456.789'))).toBe(true)

      port.setValue(new Decimal(789))
      expect(port.getValue().equals(new Decimal(789))).toBe(true)
    })

    it('should reset to default value', () => {
      const port = new NumberPort({
        ...defaultConfig,
        defaultValue: 42,
      })

      port.setValue(100)
      port.reset()
      expect(port.getValue().equals(new Decimal(42))).toBe(true)
    })

    it('should check if has value', () => {
      const port = new NumberPort(defaultConfig)
      expect(port.hasValue()).toBe(true)

      port.setValue(Number.NaN)
      expect(port.hasValue()).toBe(false)
    })

    it('should clone correctly', () => {
      const original = new NumberPort({
        ...defaultConfig,
        defaultValue: 42,
      })

      const cloned = original.clone()
      expect(cloned.getValue().equals(original.getValue())).toBe(true)
      expect(cloned).toBeInstanceOf(NumberPort)

      // Ensure independent values
      original.setValue(100)
      expect(cloned.getValue().equals(new Decimal(42))).toBe(true)
    })
  })

  describe('validation', () => {
    it('should validate minimum value', async () => {
      const port = new NumberPort({
        ...defaultConfig,
        validation: {
          min: 0,
        },
      })

      port.setValue(-1)
      expect(await port.validate()).toBe(false)

      port.setValue(0)
      expect(await port.validate()).toBe(true)

      port.setValue(1)
      expect(await port.validate()).toBe(true)
    })

    it('should validate maximum value', async () => {
      const port = new NumberPort({
        ...defaultConfig,
        validation: {
          max: 100,
        },
      })

      port.setValue(101)
      expect(await port.validate()).toBe(false)

      port.setValue(100)
      expect(await port.validate()).toBe(true)

      port.setValue(99)
      expect(await port.validate()).toBe(true)
    })

    it('should validate integer constraint', async () => {
      const port = new NumberPort({
        ...defaultConfig,
        validation: {
          integer: true,
        },
      })

      port.setValue(42.5)
      expect(await port.validate()).toBe(false)

      port.setValue(42)
      expect(await port.validate()).toBe(true)
    })

    it('should validate precision', async () => {
      const port = new NumberPort({
        ...defaultConfig,
        validation: {
          precision: 2,
        },
      })

      port.setValue('10.123')
      expect(await port.validate()).toBe(false)

      port.setValue('10.12')
      expect(await port.validate()).toBe(true)

      port.setValue('10.1')
      expect(await port.validate()).toBe(true)
    })

    it('should validate negative values', async () => {
      const port = new NumberPort({
        ...defaultConfig,
        validation: {
          allowNegative: false,
        },
      })

      port.setValue(-1)
      expect(await port.validate()).toBe(false)

      port.setValue(0)
      expect(await port.validate()).toBe(true)

      port.setValue(1)
      expect(await port.validate()).toBe(true)
    })

    it('should validate zero value', async () => {
      const port = new NumberPort({
        ...defaultConfig,
        validation: {
          allowZero: false,
        },
      })

      port.setValue(0)
      expect(await port.validate()).toBe(false)

      port.setValue(1)
      expect(await port.validate()).toBe(true)

      port.setValue(-1)
      expect(await port.validate()).toBe(true)
    })

    it('should support custom validation', async () => {
      const port = new NumberPort({
        ...defaultConfig,
        validation: {
          validator: (value) => {
            const decimal = value as Decimal
            return decimal.modulo(2).equals(0) // Only even numbers
          },
        },
      })

      port.setValue(3)
      expect(await port.validate()).toBe(false)

      port.setValue(4)
      expect(await port.validate()).toBe(true)
    })

    it('should validate multiple constraints', async () => {
      const port = new NumberPort({
        ...defaultConfig,
        validation: {
          min: 0,
          max: 100,
          integer: true,
          allowZero: false,
        },
      })

      port.setValue(-1)
      expect(await port.validate()).toBe(false)

      port.setValue(0)
      expect(await port.validate()).toBe(false)

      port.setValue(50.5)
      expect(await port.validate()).toBe(false)

      port.setValue(101)
      expect(await port.validate()).toBe(false)

      port.setValue(50)
      expect(await port.validate()).toBe(true)
    })
  })

  describe('mathematical operations', () => {
    it('should perform addition correctly', () => {
      const port = new NumberPort(defaultConfig)
      port.setValue('10.5')

      expect(port.add('20.3').equals(new Decimal('30.8'))).toBe(true)
      expect(port.add(5).equals(new Decimal('15.5'))).toBe(true)
      expect(port.add(new Decimal('0.5')).equals(new Decimal('11'))).toBe(true)
    })

    it('should perform subtraction correctly', () => {
      const port = new NumberPort(defaultConfig)
      port.setValue('10.5')

      expect(port.subtract('3.2').equals(new Decimal('7.3'))).toBe(true)
      expect(port.subtract(5).equals(new Decimal('5.5'))).toBe(true)
      expect(port.subtract(new Decimal('0.5')).equals(new Decimal('10'))).toBe(true)
    })

    it('should perform multiplication correctly', () => {
      const port = new NumberPort(defaultConfig)
      port.setValue('10.5')

      expect(port.multiply('2').equals(new Decimal('21'))).toBe(true)
      expect(port.multiply(3).equals(new Decimal('31.5'))).toBe(true)
      expect(port.multiply(new Decimal('0.5')).equals(new Decimal('5.25'))).toBe(true)
    })

    it('should perform division correctly', () => {
      const port = new NumberPort(defaultConfig)
      port.setValue('10.5')

      expect(port.divide('2').equals(new Decimal('5.25'))).toBe(true)
      expect(port.divide(5).equals(new Decimal('2.1'))).toBe(true)
      expect(port.divide(new Decimal('0.5')).equals(new Decimal('21'))).toBe(true)
    })

    it('should round numbers correctly', () => {
      const port = new NumberPort(defaultConfig)
      port.setValue('10.567')

      expect(port.round().equals(new Decimal('11'))).toBe(true)
      expect(port.round(2).equals(new Decimal('10.57'))).toBe(true)
      expect(port.round(1).equals(new Decimal('10.6'))).toBe(true)
    })

    it('should calculate absolute value', () => {
      const port = new NumberPort(defaultConfig)

      port.setValue('-10.5')
      expect(port.abs().equals(new Decimal('10.5'))).toBe(true)

      port.setValue('10.5')
      expect(port.abs().equals(new Decimal('10.5'))).toBe(true)
    })
  })

  describe('conversion methods', () => {
    it('should convert to string correctly', () => {
      const port = new NumberPort(defaultConfig)
      port.setValue('10.5')
      expect(port.toString()).toBe('10.5')
    })

    it('should convert to number correctly', () => {
      const port = new NumberPort(defaultConfig)
      port.setValue('10.5')
      expect(port.toNumber()).toBe(10.5)
    })
  })
})
