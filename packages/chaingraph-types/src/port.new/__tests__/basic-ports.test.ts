import { describe, expect, it } from 'vitest'
import { PortDirection, PortType } from '../config/constants'
import { isPortType, validatePortConfig, validatePortConfigType } from '../validation'

describe('basic port configurations', () => {
  describe('string port', () => {
    const stringPortConfig = {
      type: PortType.String,
      id: 'test-string',
      title: 'Test String',
      direction: PortDirection.Input,
      validation: {
        minLength: 1,
        maxLength: 100,
      },
    }

    it('should validate correct string port config', () => {
      const validated = validatePortConfigType(stringPortConfig, PortType.String)
      expect(isPortType(validated, PortType.String)).toBe(true)
    })

    it('should validate string port with default value', () => {
      const configWithDefault = {
        ...stringPortConfig,
        defaultValue: 'default',
      }
      const validated = validatePortConfigType(configWithDefault, PortType.String)
      expect(validated.defaultValue).toBe('default')
    })

    it('should reject string port with invalid validation', () => {
      const invalidConfig = {
        type: PortType.String,
        validation: {
          minLength: -1, // Invalid: negative length
        },
      }
      expect(() => validatePortConfig(invalidConfig)).toThrow()
    })
  })

  describe('number port', () => {
    const numberPortConfig = {
      type: PortType.Number,
      id: 'test-number',
      title: 'Test Number',
      direction: PortDirection.Input,
      validation: {
        min: 0,
        max: 100,
        integer: true,
      },
    }

    it('should validate correct number port config', () => {
      const validated = validatePortConfigType(numberPortConfig, PortType.Number)
      expect(isPortType(validated, PortType.Number)).toBe(true)
    })

    it('should validate number port with default value', () => {
      const configWithDefault = {
        ...numberPortConfig,
        defaultValue: 50,
      }
      const validated = validatePortConfigType(configWithDefault, PortType.Number)
      expect(validated.defaultValue).toBe(50)
    })

    it('should reject number port with invalid range', () => {
      const invalidConfig = {
        type: PortType.Number,
        validation: {
          min: 100,
          max: 0, // Invalid: max less than min
        },
      }
      expect(() => validatePortConfig(invalidConfig)).toThrow()
    })
  })

  describe('boolean port', () => {
    const booleanPortConfig = {
      type: PortType.Boolean,
      id: 'test-boolean',
      title: 'Test Boolean',
      direction: PortDirection.Input,
    }

    it('should validate correct boolean port config', () => {
      const validated = validatePortConfigType(booleanPortConfig, PortType.Boolean)
      expect(isPortType(validated, PortType.Boolean)).toBe(true)
    })

    it('should validate boolean port with default value', () => {
      const configWithDefault = {
        ...booleanPortConfig,
        defaultValue: false,
      }
      const validated = validatePortConfigType(configWithDefault, PortType.Boolean)
      expect(validated.defaultValue).toBe(false)
    })

    it('should reject port with invalid direction', () => {
      const invalidConfig = {
        type: PortType.Boolean,
        direction: 'invalid' as PortDirection,
      }
      expect(() => validatePortConfig(invalidConfig)).toThrow()
    })
  })

  describe('type guards', () => {
    it('should correctly identify port types', () => {
      const stringPort = validatePortConfigType({
        type: PortType.String,
        defaultValue: 'test',
      }, PortType.String)
      expect(isPortType(stringPort, PortType.String)).toBe(true)
      expect(isPortType(stringPort, PortType.Number)).toBe(false)

      const numberPort = validatePortConfigType({
        type: PortType.Number,
        defaultValue: 42,
      }, PortType.Number)
      expect(isPortType(numberPort, PortType.Number)).toBe(true)
      expect(isPortType(numberPort, PortType.String)).toBe(false)
    })

    it('should reject mismatched port types', () => {
      const stringConfig = {
        type: PortType.String,
        defaultValue: 'test',
      }
      expect(() => validatePortConfigType(stringConfig, PortType.Number)).toThrow()
    })
  })
})
