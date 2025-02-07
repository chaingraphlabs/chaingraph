import type { EnumPortConfig } from '../base'
import { describe, expect, it } from 'vitest'
import { EnumPort } from '../instances'
import {
  createNumberConfig,
  createStringConfig,
  EnumPortPlugin,
  NumberPortPlugin,
  StringPortPlugin,
  validateEnumValue,
} from '../plugins'
import { portRegistry } from '../registry'

/**
 * Helper function to create an enum port value.
 * Now simply returns a plain string.
 */
function createEnumValue(value: string): string {
  return value
}

portRegistry.register(StringPortPlugin)
portRegistry.register(NumberPortPlugin)
portRegistry.register(EnumPortPlugin)

describe('enumPort Instance (plain values)', () => {
  describe('basic Validation', () => {
    it('should validate an enum port with valid option selection', () => {
      // Create an EnumPortConfig with string and number options.
      const config: EnumPortConfig = {
        type: 'enum',
        options: [
          { ...createStringConfig(), id: 'str1', name: 'String Option' },
          { ...createNumberConfig(), id: 'num1', name: 'Number Option' },
        ],
      }

      // Create a valid enum value (plain string) selecting the first option.
      const validValue = createEnumValue('str1')

      // Use the plugin validation function.
      const errors = validateEnumValue(validValue, config)
      expect(errors).toHaveLength(0)
    })

    it('should report error when selected option id is invalid', () => {
      const config: EnumPortConfig = {
        type: 'enum',
        options: [
          { ...createStringConfig(), id: 'opt1', name: 'Option 1' },
          { ...createNumberConfig(), id: 'opt2', name: 'Option 2' },
        ],
      }

      // Try to select a non-existent option.
      const invalidValue = createEnumValue('invalid_id')
      const errors = validateEnumValue(invalidValue, config)
      expect(errors).toContain('Value must be one of the valid option ids: opt1, opt2')
    })

    it('should validate option configurations', () => {
      // Create config with an invalid option (for instance, string config with negative minLength)
      const config: EnumPortConfig = {
        type: 'enum',
        options: [
          { ...createStringConfig({ minLength: -1 }), id: 'invalid_opt' },
        ],
      }

      const port = new EnumPort(config)
      expect(port.validate()).toBe(false)
    })
  })

  describe('default Value and Instance Behavior', () => {
    it('should automatically use the defaultValue defined in the configuration', () => {
      const config: EnumPortConfig = {
        type: 'enum',
        options: [
          { ...createStringConfig(), id: 'opt1', name: 'Option 1' },
          { ...createNumberConfig(), id: 'opt2', name: 'Option 2' },
        ],
        defaultValue: createEnumValue('opt1'),
      }

      const port = new EnumPort(config)
      const value = port.getValue()
      // Expect plain value "opt1"
      expect(value).toEqual(config.defaultValue)
    })

    it('should update the value when setValue is called with valid option', () => {
      const config: EnumPortConfig = {
        type: 'enum',
        options: [
          { ...createStringConfig(), id: 'opt1', name: 'Option 1' },
          { ...createNumberConfig(), id: 'opt2', name: 'Option 2' },
        ],
      }

      const port = new EnumPort(config)
      const newValue = createEnumValue('opt2')

      // setValue should not throw and then return the updated value (plain string)
      port.setValue(newValue)
      expect(port.getValue()).toEqual(newValue)
    })

    it('should throw when setValue is called with invalid option', () => {
      const config: EnumPortConfig = {
        type: 'enum',
        options: [
          { ...createStringConfig(), id: 'opt1', name: 'Option 1' },
          { ...createNumberConfig(), id: 'opt2', name: 'Option 2' },
        ],
      }

      const port = new EnumPort(config)
      const invalidValue = createEnumValue('invalid_id')

      expect(() => port.setValue(invalidValue)).toThrow()
    })
  })

  describe('serialization and Deserialization', () => {
    it('should correctly serialize and deserialize an enum port value', () => {
      const config: EnumPortConfig = {
        type: 'enum',
        options: [
          { ...createStringConfig(), id: 'opt1', name: 'Option 1' },
          { ...createNumberConfig(), id: 'opt2', name: 'Option 2' },
        ],
        defaultValue: createEnumValue('opt1'),
      }

      const port = new EnumPort(config)
      const originalValue = port.getValue()

      // Serialize the enum value. Since values are plain, expect a plain string.
      const serialized = EnumPortPlugin.serializeValue(originalValue!, config)
      // Simulate a JSON roundtrip.
      const jsonString = JSON.stringify(serialized)
      const parsedData = JSON.parse(jsonString)
      // Deserialize the value.
      const deserialized = EnumPortPlugin.deserializeValue(parsedData, config)
      expect(deserialized).toEqual(originalValue)
    })

    it('should correctly serialize and deserialize enum port config with options', () => {
      const originalConfig: EnumPortConfig = {
        type: 'enum',
        options: [
          { ...createStringConfig(), id: 'opt1', name: 'Option 1' },
          { ...createNumberConfig(), id: 'opt2', name: 'Option 2' },
        ],
        defaultValue: createEnumValue('opt1'),
      }

      // Serialize the config.
      const serialized = EnumPortPlugin.serializeConfig(originalConfig)
      // Simulate a JSON roundtrip.
      const jsonString = JSON.stringify(serialized)
      const parsedData = JSON.parse(jsonString)
      // Deserialize the config.
      const deserialized = EnumPortPlugin.deserializeConfig(parsedData)
      expect(deserialized).toEqual(originalConfig)
    })

    it('should throw during serialization if the enum value structure is invalid', () => {
      const badValue: any = {
        // Missing expected plain string value (for enum, a plain string is expected)
        invalid: true,
      }
      expect(() => EnumPortPlugin.serializeValue(badValue, {} as any)).toThrow()
    })
  })

  describe('uI Configuration', () => {
    it('should apply default UI colors if not overridden', () => {
      const config: EnumPortConfig = {
        type: 'enum',
        options: [
          { ...createStringConfig(), id: 'opt1', name: 'Option 1' },
        ],
      }

      const port = new EnumPort(config)
      const portConfig = port.getConfig()
      expect(portConfig.ui?.bgColor).toBe('#eedf3c')
      expect(portConfig.ui?.borderColor).toBe('#443f17')
    })

    it('should allow overriding default UI colors', () => {
      const config: EnumPortConfig = {
        type: 'enum',
        options: [
          { ...createStringConfig(), id: 'opt1', name: 'Option 1' },
        ],
        ui: {
          bgColor: '#custom',
          borderColor: '#custom-border',
        },
      }

      const port = new EnumPort(config)
      const portConfig = port.getConfig()
      expect(portConfig.ui?.bgColor).toBe('#custom')
      expect(portConfig.ui?.borderColor).toBe('#custom-border')
    })
  })
})
