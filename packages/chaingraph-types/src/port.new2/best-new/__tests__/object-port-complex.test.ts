import type { IPortConfig } from '../base/types'
import { portRegistry } from '@chaingraph/types/port.new2/best-new/registry/PortRegistry'
import { beforeAll, describe, expect, it } from 'vitest'
import { createNumberConfig, createNumberValue, NumberPortPlugin } from '../plugins/NumberPortPlugin'
import {
  createObjectConfig,
  createObjectValue,
  ObjectPortPlugin,
  validateObjectValue,
} from '../plugins/ObjectPortPlugin'
import { createStringConfig, createStringValue, StringPortPlugin } from '../plugins/StringPortPlugin'
import { portValidator } from '../validation/port-validator'

describe('objectPortPlugin: tricky nested test', () => {
  beforeAll(() => {
    // If not already done, register the ObjectPortPlugin and the others:
    portRegistry.register(StringPortPlugin)
    portRegistry.register(NumberPortPlugin)
    portRegistry.register(ObjectPortPlugin)
  })

  it('should detect multiple errors in nested fields', () => {
    // Build a config that references nested objects
    // Example structure:
    // rootObjectConfig = {
    //   user: { type: 'object', fields: {
    //     name: { type: 'string', minLength: 2 },
    //     info: { type: 'object', fields: {
    //       age:   { type: 'number', min: 21 },
    //       title: { type: 'string', pattern: '^[A-Z]' }
    //     }}
    //   }}
    // }

    const nestedConfig: IPortConfig = createObjectConfig({
      age: createNumberConfig({ min: 21 }),
      title: createStringConfig({ pattern: '^[A-Z]' }),
    })

    const userConfig: IPortConfig = createObjectConfig({
      name: createStringConfig({ minLength: 2 }),
      info: nestedConfig,
      // intentionally no “extra” field here to check if plugin catches unexpected
    })

    const rootObjectConfig = createObjectConfig({
      user: userConfig,
    })

    // Build a value that is partially incorrect
    // For instance:
    // rootObjectValue = {
    //   user: {
    //     name: { type: 'string', value: 'A' }, // too short (needs minLength=2)
    //     info: {
    //       // Missing “age”
    //       // “title” is a number port instead of string => type mismatch
    //       title: { type: 'number', value: 123 },
    //       extraField: { type: 'string', value: '???' } // unexpected field
    //     }
    //   },
    //   unexpectedRootField: { type: 'string', value: '??' }
    // }

    const badUserInfo = createObjectValue({
      // Omit "age" -> missing required field
      // Mismatch "title" (should be string, but we pass number)
      title: createNumberValue(123),
      extraField: createStringValue('???'), // not defined in config
    })

    const badUserValue = createObjectValue({
      // name is too short
      name: createStringValue('A'),
      info: badUserInfo,
    })

    const rootObjectValue = createObjectValue({
      user: badUserValue,
      // unexpected root field
      unexpectedRootField: createStringValue('??'),
    })

    // Now validate using either:
    // 1) The direct function from ObjectPortPlugin
    const pluginErrors = validateObjectValue(rootObjectValue, rootObjectConfig)
    // 2) Or the centralized portValidator if you prefer
    const validatorResult = portValidator.validatePort(rootObjectConfig, rootObjectValue)

    // Check plugin-level
    expect(pluginErrors.length).toBeGreaterThan(0)
    // We might expect ~5 errors, for example:
    // - "name" is too short
    // - "age" is missing
    // - "title" type mismatch
    // - "extraField" unexpected
    // - "unexpectedRootField" is unexpected
    expect(pluginErrors).toEqual(
      expect.arrayContaining([
        expect.stringContaining('Missing required field'),
        expect.stringContaining('String must be at least 2 characters long'), // e.g. "String must be at least 2 characters long"
        expect.stringContaining('expected type string, got number'), // mismatch for "title"
        expect.stringContaining('Unexpected field: user.info.extraField'),
        expect.stringContaining('Unexpected field: unexpectedRootField'),
      ]),
    )

    // Check the portValidator-level
    expect(validatorResult.success).toBe(false)
    // The errors might appear as nested objects, so we can just confirm existence of certain messages
    const fullErrorMessages = validatorResult.errors.map(e => e.message)
    expect(fullErrorMessages).toEqual(
      expect.arrayContaining([
        expect.stringContaining('type mismatch'), // or "expected string, got number"
        expect.stringContaining('String must be at least'), // for "name" field
      ]),
    )
  })
})
