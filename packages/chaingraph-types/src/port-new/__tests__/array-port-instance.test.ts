import type {
  ArrayPortConfig,
  StringPortConfig,
} from '../base/types'
import { beforeEach, describe, expect, it } from 'vitest'
import { ArrayPort } from '../instances/ArrayPort'
import { ArrayPortPlugin, validateArrayValue } from '../plugins/ArrayPortPlugin'
import { createStringValue, StringPortPlugin } from '../plugins/StringPortPlugin'
import { portRegistry } from '../registry/PortPluginRegistry'

/**
 * Helper function to create an array port value.
 * (Typically one would use a factory; here we wrap it for convenience.)
 */
function createArrayValue(items: any[]): { type: 'array', value: any[] } {
  return { type: 'array', value: items }
}

describe('arrayPort Instance', () => {
  beforeEach(() => {
    // Reset the registry and register required plugins so that the itemConfig
    // (in this case, a string port config) can be properly validated.
    portRegistry.clear()
    portRegistry.register(StringPortPlugin)
    portRegistry.register(ArrayPortPlugin)
  })

  describe('basic Validation', () => {
    it('should validate an array port with sufficient items', () => {
      // Create an ArrayPortConfig with item type "string" and a minimum length of 2
      const config: ArrayPortConfig<StringPortConfig> = {
        type: 'array',
        itemConfig: { type: 'string', minLength: 2 },
        minLength: 2,
        maxLength: 4,
      }

      // Create a valid array value with two items
      const validValue = createArrayValue([
        createStringValue('hello'),
        createStringValue('world'),
      ])

      // Use the plugin validation function
      const errors = validateArrayValue(validValue, config)
      expect(errors).toHaveLength(0)
    })

    it('should report errors when array is too short or too long', () => {
      const config: ArrayPortConfig<StringPortConfig> = {
        type: 'array',
        itemConfig: { type: 'string', minLength: 1 },
        minLength: 2,
        maxLength: 3,
      }

      // Empty array (too short)
      const emptyValue = createArrayValue([])
      let errors = validateArrayValue(emptyValue, config)
      expect(errors).toContain('Array must have at least 2 items')

      // Array with one item (still too short)
      const oneItem = createArrayValue([
        createStringValue('test'),
      ])
      errors = validateArrayValue(oneItem, config)
      expect(errors).toContain('Array must have at least 2 items')

      // Array that is too long
      const longArray = createArrayValue([
        createStringValue('one'),
        createStringValue('two'),
        createStringValue('three'),
        createStringValue('four'),
      ])
      errors = validateArrayValue(longArray, config)
      expect(errors).toContain('Array must have at most 3 items')
    })

    it('should report an error if at least one array item has an invalid structure', () => {
      const config: ArrayPortConfig<StringPortConfig> = {
        type: 'array',
        itemConfig: { type: 'string', minLength: 1 },
      }

      // Create an array value where the second item is missing the expected "value" field
      const badItem = { invalid: 'structure' }
      const mixedValue = createArrayValue([
        createStringValue('good'),
        badItem,
      ])

      const errors = validateArrayValue(mixedValue, config)
      expect(errors.some(msg => msg.includes('Invalid item structure'))).toBe(true)
    })
  })

  describe('default Value and Instance Behavior', () => {
    it('should automatically use the defaultValue defined in the configuration', () => {
      const config: ArrayPortConfig<StringPortConfig> = {
        type: 'array',
        itemConfig: { type: 'string', minLength: 1 },
        minLength: 1,
        maxLength: 5,
        defaultValue: createArrayValue([
          createStringValue('default1'),
          createStringValue('default2'),
        ]),
      }

      const port = new ArrayPort(config)
      const value = port.getValue()
      expect(value).toEqual(config.defaultValue)
    })

    it('should update the value when setValue is called (and pass validation)', () => {
      const config: ArrayPortConfig<StringPortConfig> = {
        type: 'array',
        itemConfig: { type: 'string', minLength: 1 },
        minLength: 1,
        maxLength: 4,
      }
      const port = new ArrayPort<StringPortConfig>(config)
      const newValue = createArrayValue([
        createStringValue('one'),
        createStringValue('two'),
      ])
      // setValue should not throw and then return the updated value
      port.setValue(newValue)
      expect(port.getValue()).toEqual(newValue)
    })
  })

  describe('serialization and Deserialization', () => {
    it('should correctly serialize and deserialize an array port value', () => {
      const config: ArrayPortConfig<StringPortConfig> = {
        type: 'array',
        itemConfig: { type: 'string', minLength: 1 },
        minLength: 1,
        maxLength: 5,
        defaultValue: createArrayValue([
          createStringValue('itemA'),
          createStringValue('itemB'),
        ]),
      }

      const port = new ArrayPort(config)
      const originalValue = port.getValue()

      // Serialize the array value
      const serialized = ArrayPortPlugin.serializeValue(originalValue!)
      // Simulate a JSON roundtrip by converting to a JSON string and back
      const jsonString = JSON.stringify(serialized)
      const parsedData = JSON.parse(jsonString)
      // Deserialize the value
      const deserialized = ArrayPortPlugin.deserializeValue(parsedData)
      expect(deserialized).toEqual(originalValue)
    })

    it('should throw during serialization if the array value structure is invalid', () => {
      // Create an invalid array value (e.g. missing "value" property)
      const badValue: any = {
        type: 'array',
        invalid: true,
      }
      expect(() => ArrayPortPlugin.serializeValue(badValue)).toThrow()
    })
  })
})
