/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { AnyPortConfig } from '../base'
import { describe, expect, it } from 'vitest'
import { PortPluginRegistry } from '../../port/plugins'
import { AnyPort } from '../instances'
import {
  AnyPortPlugin,
  createNumberConfig,
  createNumberValue,
  createStringConfig,
  createStringValue,
  NumberPortPlugin,
  StringPortPlugin,
  validateAnyValue,
} from '../plugins/'

/**
 * Helper function to create an any port value
 */
function createAnyValue(value: any): any {
  return value
}

PortPluginRegistry.getInstance().register(AnyPortPlugin)
PortPluginRegistry.getInstance().register(StringPortPlugin)
PortPluginRegistry.getInstance().register(NumberPortPlugin)

describe('anyPort Instance', () => {
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
      port.setValue(invalidValue)

      expect(port.validate()).eq(false)
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
      const portConfig = port.getRawConfig()

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
      const portConfig = port.getRawConfig()

      expect(portConfig.ui?.bgColor).toBe('#custom')
      expect(portConfig.ui?.borderColor).toBe('#custom-border')
    })

    it('dynamicaly change underlying type and serialize', () => {
      const config: AnyPortConfig = {
        type: 'any',
      }

      const port = new AnyPort(config)
      const serialized = port.serialize()
      const serializedJson = JSON.stringify(serialized)
      const parsedData = JSON.parse(serializedJson)
      const deserialized = new AnyPort(config)
      deserialized.deserialize(parsedData)

      const expectedConfig = {
        type: 'any',
        ui: {
          bgColor: '#cccccc',
          borderColor: '#333333',
        },
        underlyingType: undefined,
      }
      expect(deserialized.getConfig()).toEqual(expectedConfig)
      expect(deserialized.getValue()).toEqual(undefined)

      // set underlying type
      deserialized.setUnderlyingType({
        type: 'string',
        defaultValue: 'string_default',
        direction: 'input',
        id: 'any-port',
        parentId: 'parent-id',
        connections: [],
        order: 0,
      })

      const updatedSerialized = deserialized.serialize()
      const updatedSerializedJson = JSON.stringify(updatedSerialized)
      const updatedParsedData = JSON.parse(updatedSerializedJson)
      const updatedDeserialized = new AnyPort(config)
      updatedDeserialized.deserialize(updatedParsedData)
      const expectedUpdatedConfig = {
        defaultValue: undefined,
        type: 'any',
        ui: {
          bgColor: '#cccccc',
          borderColor: '#333333',
        },
        underlyingType: {
          connections: [],
          defaultValue: 'string_default',
          direction: 'input',
          id: 'any-port',
          order: 0,
          parentId: 'parent-id',
          type: 'string',
        },
      }
      expect(updatedDeserialized.getRawConfig()).toEqual(expectedUpdatedConfig)
      expect(updatedDeserialized.getValue()).toEqual(undefined)
      expect(updatedDeserialized.validate()).toBe(true)

      updatedDeserialized.serialize()
    })
  })
})
