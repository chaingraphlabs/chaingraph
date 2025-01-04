import type { ComplexPortType } from '../port-types'
import type { PortValue } from '../port-values'
import { Decimal } from 'decimal.js'
import { describe, expect, it } from 'vitest'
import { PortTypeEnum } from '../port-types'

describe('port Values Type System', () => {
  describe('primitive Types', () => {
    it('should correctly type string values', () => {
      const value: PortValue<PortTypeEnum.String> = 'test'
      // @ts-expect-error number should not be assignable to string
      const invalid: PortValue<PortTypeEnum.String> = 42

      expect(typeof value).toBe('string')
    })

    it('should correctly type number values', () => {
      const value: PortValue<PortTypeEnum.Number> = new Decimal(42)
      // @ts-expect-error number should not be assignable to Decimal
      const invalid: PortValue<PortTypeEnum.Number> = 42

      expect(value).toBeInstanceOf(Decimal)
    })

    it('should correctly type boolean values', () => {
      const value: PortValue<PortTypeEnum.Boolean> = true
      // @ts-expect-error string should not be assignable to boolean
      const invalid: PortValue<PortTypeEnum.Boolean> = 'true'

      expect(typeof value).toBe('boolean')
    })
  })

  describe('array Types', () => {
    it('should correctly type string array', () => {
      const stringArrayType: ComplexPortType[PortTypeEnum.Array] = {
        type: PortTypeEnum.Array,
        elementType: PortTypeEnum.String,
      }

      const values: PortValue<typeof stringArrayType> = ['one', 'two', 'three']
      // @ts-expect-error number array should not be assignable to string array
      const invalid: PortValue<typeof stringArrayType> = [1, 2, 3]

      expect(Array.isArray(values)).toBe(true)
      expect(values.every(v => typeof v === 'string')).toBe(true)
    })

    it('should correctly type number array', () => {
      const numberArrayType: ComplexPortType[PortTypeEnum.Array] = {
        type: PortTypeEnum.Array,
        elementType: PortTypeEnum.Number,
      }

      const values: PortValue<typeof numberArrayType> = [
        new Decimal(1),
        new Decimal(2),
        new Decimal(3),
      ]
      // @ts-expect-error regular numbers should not be assignable to Decimal array
      const invalid: PortValue<typeof numberArrayType> = [1, 2, 3]

      expect(Array.isArray(values)).toBe(true)
      expect(values.every(v => v instanceof Decimal)).toBe(true)
    })

    it('should correctly type nested arrays', () => {
      const numberArrayArrayType: ComplexPortType[PortTypeEnum.Array] = {
        type: PortTypeEnum.Array,
        elementType: {
          type: PortTypeEnum.Array,
          elementType: PortTypeEnum.Number,
        },
      }

      const values: PortValue<typeof numberArrayArrayType> = [
        [new Decimal(1), new Decimal(2)],
        [new Decimal(3), new Decimal(4)],
      ]
      // @ts-expect-error regular number arrays should not be assignable
      const invalid: PortValue<typeof numberArrayArrayType> = [[1, 2], [3, 4]]

      expect(Array.isArray(values)).toBe(true)
      expect(values.every(arr =>
        Array.isArray(arr) && arr.every(v => v instanceof Decimal),
      )).toBe(true)
    })

    // it('should correctly type array of mixed primitives', () => {
    //   const mixedArrayType: ComplexPortType[PortTypeEnum.Array] = {
    //     type: PortTypeEnum.Array,
    //     elementType: {
    //       type: PortTypeEnum.Object,
    //       schema: {
    //         properties: {
    //           name: PortTypeEnum.String,
    //           value: PortTypeEnum.Number,
    //           active: PortTypeEnum.Boolean,
    //         },
    //       },
    //     },
    //   }
    //
    //   const values: PortValue<typeof mixedArrayType> = [
    //     { name: 'first', value: new Decimal(1), active: true },
    //     { name: 'second', value: new Decimal(2), active: false },
    //   ]
    //
    //   // @ts-expect-error wrong property types should not be assignable
    //   const invalid: PortValue<typeof mixedArrayType> = [
    //     { name: 'first', value: 1, active: 'true' },
    //   ]
    //
    //   expect(Array.isArray(values)).toBe(true)
    //   expect(values.every(obj =>
    //     typeof obj.name === 'string'
    //     && obj.value instanceof Decimal
    //     && typeof obj.active === 'boolean',
    //   )).toBe(true)
    // })
  })
})
