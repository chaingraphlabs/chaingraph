import { describe, expect, it } from 'vitest'
import { PortDirection, PortType } from '../config/constants'
import { isPortType, validatePortConfig, validatePortConfigType } from '../validation'

describe('array port configurations', () => {
  describe('simple array ports', () => {
    describe('array of numbers', () => {
      const numberArrayConfig = {
        type: PortType.Array,
        id: 'test-number-array',
        title: 'Test Number Array',
        direction: PortDirection.Input,
        elementConfig: {
          type: PortType.Number,
          validation: {
            min: 0,
            max: 100,
          },
        },
      }

      it('should validate correct number array config', () => {
        const validated = validatePortConfigType(numberArrayConfig, PortType.Array)
        expect(isPortType(validated, PortType.Array)).toBe(true)
        expect(isPortType(validated.elementConfig, PortType.Number)).toBe(true)
      })

      it('should validate array with default value', () => {
        const configWithDefault = {
          ...numberArrayConfig,
          defaultValue: [1, 2, 3],
        }
        const validated = validatePortConfigType(configWithDefault, PortType.Array)
        expect(validated.defaultValue).toEqual([1, 2, 3])
      })
    })

    describe('array of strings', () => {
      const stringArrayConfig = {
        type: PortType.Array,
        id: 'test-string-array',
        title: 'Test String Array',
        direction: PortDirection.Input,
        elementConfig: {
          type: PortType.String,
          validation: {
            minLength: 1,
            maxLength: 10,
          },
        },
      }

      it('should validate correct string array config', () => {
        const validated = validatePortConfigType(stringArrayConfig, PortType.Array)
        expect(isPortType(validated, PortType.Array)).toBe(true)
        expect(isPortType(validated.elementConfig, PortType.String)).toBe(true)
      })

      it('should validate array with string elements', () => {
        const configWithDefault = {
          ...stringArrayConfig,
          defaultValue: ['one', 'two', 'three'],
        }
        const validated = validatePortConfigType(configWithDefault, PortType.Array)
        expect(validated.defaultValue).toEqual(['one', 'two', 'three'])
      })
    })
  })

  describe('nested array ports', () => {
    describe('array of arrays', () => {
      const matrixConfig = {
        type: PortType.Array,
        id: 'test-matrix',
        title: 'Test Matrix',
        direction: PortDirection.Input,
        elementConfig: {
          type: PortType.Array,
          elementConfig: {
            type: PortType.Number,
          },
        },
      }

      it('should validate correct matrix config', () => {
        const validated = validatePortConfigType(matrixConfig, PortType.Array)
        expect(isPortType(validated, PortType.Array)).toBe(true)
        expect(isPortType(validated.elementConfig, PortType.Array)).toBe(true)
      })

      it('should validate matrix with valid dimensions', () => {
        const configWithDefault = {
          ...matrixConfig,
          defaultValue: [[1, 2], [3, 4]],
        }
        const validated = validatePortConfigType(configWithDefault, PortType.Array)
        expect(validated.defaultValue).toEqual([[1, 2], [3, 4]])
      })
    })
  })

  describe('error cases', () => {
    it('should reject array with missing elementConfig', () => {
      const invalidConfig = {
        type: PortType.Array,
      }
      expect(() => validatePortConfig(invalidConfig)).toThrow()
    })

    it('should reject array with invalid element type', () => {
      const invalidConfig = {
        type: PortType.Array,
        elementConfig: {
          type: 'invalid' as PortType,
        },
      }
      expect(() => validatePortConfig(invalidConfig)).toThrow()
    })

    it('should reject array with non-array default value', () => {
      const invalidConfig = {
        type: PortType.Array,
        elementConfig: {
          type: PortType.Number,
        },
        defaultValue: 'not an array',
      }
      expect(() => validatePortConfig(invalidConfig)).toThrow()
    })
  })
})
