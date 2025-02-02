import type { IPortConfig } from '../base/types'
import { beforeAll, describe, expect, it } from 'vitest'
import { createNumberConfig, createNumberValue, NumberPortPlugin } from '../plugins/NumberPortPlugin'
import {
  createObjectConfig,
  createObjectValue,
  ObjectPortPlugin,
  validateObjectValue,
} from '../plugins/ObjectPortPlugin'
import { createStringConfig, createStringValue, StringPortPlugin } from '../plugins/StringPortPlugin'
import { portRegistry } from '../registry/PortRegistry'
import { portValidator } from '../validation/port-validator'

describe('objectPortPlugin: tricky nested test', () => {
  beforeAll(() => {
    // Register required plugins
    portRegistry.register(StringPortPlugin)
    portRegistry.register(NumberPortPlugin)
    portRegistry.register(ObjectPortPlugin)
  })

  it('should detect multiple errors in nested fields', () => {
    // Build a config that references nested objects
    const nestedConfig: IPortConfig = createObjectConfig({
      age: createNumberConfig({ min: 21 }),
      title: createStringConfig({ pattern: '^[A-Z]' }),
    })

    const userConfig: IPortConfig = createObjectConfig({
      name: createStringConfig({ minLength: 2 }),
      info: nestedConfig,
    })

    const rootObjectConfig = createObjectConfig({
      user: userConfig,
    })

    // Build a value that is partially incorrect
    const badUserInfo = createObjectValue({
      // Missing "age" -> missing required field
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

    // Check plugin-level validation
    const pluginErrors = validateObjectValue(rootObjectValue, rootObjectConfig)
    expect(pluginErrors.length).toBeGreaterThan(0)
    expect(pluginErrors.length).toEqual(5) // Expected number of unique error types

    // Check the portValidator-level
    const validatorResult = portValidator.validatePort(rootObjectConfig, rootObjectValue)
    expect(validatorResult.success).toBe(false)

    // Get all error messages
    const fullErrorMessages = validatorResult.errors.map(e => e.message)

    // Log errors for debugging
    console.log('Validation errors:', fullErrorMessages)

    // Check for presence of each error type
    expect(fullErrorMessages.some(msg => msg.includes('2 characters'))).toBe(true)
    expect(fullErrorMessages.some(msg => msg.includes('Missing required field'))).toBe(true)
    expect(fullErrorMessages.some(msg => msg.includes('expected type string'))).toBe(true)
    expect(fullErrorMessages.some(msg => msg.includes('Unexpected field'))).toBe(true)

    // We expect around 14 errors due to validation at different levels
    expect(fullErrorMessages.length).toBe(5)
  })
})
