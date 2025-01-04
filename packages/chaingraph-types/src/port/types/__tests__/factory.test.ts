import { PortFactory } from '@chaingraph/types'
import { PortTypeEnum } from '@chaingraph/types/port/types/port-types'
import { Decimal } from 'decimal.js'
import { describe, expect, it } from 'vitest'

describe('portFactory', () => {
  describe('primitive ports', () => {
    it('should create string port', () => {
      const port = PortFactory.create(PortTypeEnum.String, {
        id: 'test-string',
        name: 'Test String',
        defaultValue: 'hello',
      })

      expect(port.config.type).toBe(PortTypeEnum.String)
      expect(port.config.id).toBe('test-string')
      expect(port.value).toBe('hello')

      // Check type safety
      port.setValue('world')
      expect(port.value).toBe('world')
      // @ts-expect-error should not accept number
      port.setValue(123)
    })

    it('should create number port', () => {
      const port = PortFactory.create(PortTypeEnum.Number, {
        id: 'test-number',
        name: 'Test Number',
        defaultValue: new Decimal(42),
      })

      expect(port.config.type).toBe(PortTypeEnum.Number)
      expect(port.config.id).toBe('test-number')
      expect(port.value.equals(new Decimal(42))).toBe(true)

      port.setValue(new Decimal(100))
      expect(port.value.equals(new Decimal(100))).toBe(true)
      // @ts-expect-error should not accept string
      port.setValue('123')
    })

    it('should create boolean port', () => {
      const port = PortFactory.create(PortTypeEnum.Boolean, {
        id: 'test-bool',
        name: 'Test Boolean',
        defaultValue: true,
      })

      expect(port.config.type).toBe(PortTypeEnum.Boolean)
      expect(port.config.id).toBe('test-bool')
      expect(port.value).toBe(true)

      port.setValue(false)
      expect(port.value).toBe(false)
      // @ts-expect-error should not accept string
      port.setValue('true')
    })
  })

  describe('array ports', () => {
    it('should create simple array port', () => {
      const port = PortFactory.create(
        {
          type: PortTypeEnum.Array,
          elementType: PortTypeEnum.String,
        },
        {
          portConfig: {
            id: 'test-array',
            name: 'Test Array',
          },
        },
      )

      expect(port.config.type.type).toBe(PortTypeEnum.Array)
      expect(port.config.type.elementType).toBe(PortTypeEnum.String)
      expect(port.config.id).toBe('test-array')
      expect(Array.isArray(port.value)).toBe(true)
      expect(port.value).toHaveLength(0)

      // Test array operations
      port.push('hello')
      expect(port.value).toHaveLength(1)
      expect(port.value[0]).toBe('hello')

      // @ts-expect-error should not accept number
      port.push(123)
    })

    it('should create nested array port', () => {
      const port = PortFactory.create(
        {
          type: PortTypeEnum.Array,
          elementType: {
            type: PortTypeEnum.Array,
            elementType: PortTypeEnum.Number,
          },
        },
        {
          portConfig: {
            id: 'test-nested-array',
            name: 'Test Nested Array',
            defaultValue: [[new Decimal(1), new Decimal(2)]],
          },
        },
      )

      expect(port.config.type.type).toBe(PortTypeEnum.Array)
      expect(port.config.type.elementType.type).toBe(PortTypeEnum.Array)
      expect(port.config.type.elementType.elementType).toBe(PortTypeEnum.Number)
      expect(port.value).toHaveLength(1)
      expect(port.value[0]).toHaveLength(2)
      expect(port.value[0][0].equals(new Decimal(1))).toBe(true)
    })
  })

  describe('validation', () => {
    it('should validate array elements', async () => {
      const port = PortFactory.create(
        {
          type: PortTypeEnum.Array,
          elementType: PortTypeEnum.Number,
        },
        {
          portConfig: {
            id: 'test-validation',
            name: 'Test Validation',
            validation: {
              validator: values => values.every(v => v.greaterThan(0)),
            },
          },
        },
      )

      port.setValue([new Decimal(1), new Decimal(2)])
      expect(await port.validate()).toBe(true)

      port.setValue([new Decimal(-1), new Decimal(2)])
      expect(await port.validate()).toBe(false)
    })
  })

  describe('error handling', () => {
    it('should throw on unsupported type', () => {
      expect(() =>
        // @ts-expect-error testing runtime check
        PortFactory.create('unsupported', {}),
      ).toThrow('Unsupported primitive type')
    })

    it('should maintain type safety', () => {
      const stringPort = PortFactory.create(PortTypeEnum.String, {
        id: 'test',
        name: 'Test',
      })

      // These should cause TypeScript errors
      // @ts-expect-error
      stringPort.setValue(123)
      // @ts-expect-error
      stringPort.setValue(true)
    })
  })
})
