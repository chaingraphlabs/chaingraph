import type {
  AnyPortConfig,
} from '../base/types'
import { beforeEach, describe, expect, it } from 'vitest'
import { AnyPort } from '../instances/AnyPort'
import { AnyPortPlugin, validateAnyValue } from '../plugins/AnyPortPlugin'
import { createNumberConfig, createNumberValue, NumberPortPlugin } from '../plugins/NumberPortPlugin'
import { createStringConfig, createStringValue, StringPortPlugin } from '../plugins/StringPortPlugin'
import { portRegistry } from '../registry/PortPluginRegistry'

/**
 * Helper function to create an any port value
 */
function createAnyValue(value: any): any {
  return value
}

describe('anyPort Instance', () => {
  beforeEach(() => {
    // Reset the registry and register required plugins
    portRegistry.clear()
    portRegistry.register(StringPortPlugin)
    portRegistry.register(NumberPortPlugin)
    portRegistry.register(AnyPortPlugin)
  })

  describe('basic validation', () => {
    it('should validate an any port with string underlying type', () => {
      // Create an AnyPortConfig with string underlying type
      const config: AnyPortConfig = {
        type: 'any',
        underlyingType: createStringConfig({ minLength: 2 }),
      }

      // Create a valid any value wrapping a string value
      const validValue = createAnyValue(createStringValue('hello'))

      // Use the plugin validation function
      const errors = validateAnyValue(validValue, config)
      expect(errors).toHaveLength(0)
    })

    it('should validate an any port with number underlying type', () => {
      const config: AnyPortConfig = {
        type: 'any',
        underlyingType: createNumberConfig({ min: 0, max: 100 }),
      }

      // Create a valid any value wrapping a number value
      const validValue = createAnyValue(createNumberValue(50))

      const errors = validateAnyValue(validValue, config)
      expect(errors).toHaveLength(0)
    })

    it('should report error when underlying value fails validation', () => {
      const config: AnyPortConfig = {
        type: 'any',
        underlyingType: createStringConfig({ minLength: 5 }),
      }

      // Create an any value with a too-short string
      const invalidValue = createAnyValue(createStringValue('hi'))
      const errors = validateAnyValue(invalidValue, config)
      expect(errors).toContain('String must be at least 5 characters long')
    })

    it('should validate underlying type configuration', () => {
      // Create config with invalid underlying type (string with negative minLength)
      const config: AnyPortConfig = {
        type: 'any',
        underlyingType: createStringConfig({ minLength: -1 }),
      }

      const port = new AnyPort(config)
      expect(port.validate()).toBe(false)
    })
  })

  describe('default value and instance behavior', () => {
    it('should automatically use the defaultValue defined in the configuration', () => {
      const config: AnyPortConfig = {
        type: 'any',
        underlyingType: createStringConfig(),
        defaultValue: createAnyValue(createStringValue('default')),
      }

      const port = new AnyPort(config)
      const value = port.getValue()
      expect(value).toEqual(config.defaultValue)
    })

    it('should update the value when setValue is called with valid value', () => {
      const config: AnyPortConfig = {
        type: 'any',
        underlyingType: createNumberConfig({ min: 0, max: 100 }),
      }

      const port = new AnyPort(config)
      const newValue = createAnyValue(createNumberValue(42))

      // setValue should not throw and then return the updated value
      port.setValue(newValue)
      expect(port.getValue()).toEqual(newValue)
    })

    it('should throw when setValue is called with invalid value', () => {
      const config: AnyPortConfig = {
        type: 'any',
        underlyingType: createNumberConfig({ min: 0, max: 100 }),
      }

      const port = new AnyPort(config)
      const invalidValue = createAnyValue(createNumberValue(-1))

      expect(() => port.setValue(invalidValue)).toThrow()
    })
  })

  describe('serialization and deserialization', () => {
    it('should correctly serialize and deserialize an any port value', () => {
      const config: AnyPortConfig = {
        type: 'any',
        underlyingType: createStringConfig(),
        defaultValue: createAnyValue(createStringValue('test')),
      }

      const port = new AnyPort(config)
      const originalValue = port.getValue()

      // Serialize the any value
      const serialized = AnyPortPlugin.serializeValue(originalValue!, config)
      // Simulate a JSON roundtrip
      const jsonString = JSON.stringify(serialized)
      const parsedData = JSON.parse(jsonString)
      // Deserialize the value
      const deserialized = AnyPortPlugin.deserializeValue(parsedData, config)
      expect(deserialized).toEqual(originalValue)
    })

    it('should correctly serialize and deserialize any port config with underlying type', () => {
      const originalConfig: AnyPortConfig = {
        type: 'any',
        underlyingType: createNumberConfig({ min: 0, max: 100 }),
        defaultValue: createAnyValue(createNumberValue(50)),
      }

      // Serialize config
      const serialized = AnyPortPlugin.serializeConfig(originalConfig)
      // Simulate JSON roundtrip
      const jsonString = JSON.stringify(serialized)
      const parsedData = JSON.parse(jsonString)
      // Deserialize config
      const deserialized = AnyPortPlugin.deserializeConfig(parsedData)
      expect(deserialized).toEqual(originalConfig)
    })
  })

  describe('uI configuration', () => {
    it('should apply default UI colors if not overridden', () => {
      const config: AnyPortConfig = {
        type: 'any',
        underlyingType: createStringConfig(),
      }

      const port = new AnyPort(config)
      const portConfig = port.getConfig()

      expect(portConfig.ui?.bgColor).toBe('#cccccc')
      expect(portConfig.ui?.borderColor).toBe('#333333')
    })

    it('should allow overriding default UI colors', () => {
      const config: AnyPortConfig = {
        type: 'any',
        underlyingType: createStringConfig(),
        ui: {
          bgColor: '#custom',
          borderColor: '#custom-border',
        },
      }

      const port = new AnyPort(config)
      const portConfig = port.getConfig()

      expect(portConfig.ui?.bgColor).toBe('#custom')
      expect(portConfig.ui?.borderColor).toBe('#custom-border')
    })
  })
})
