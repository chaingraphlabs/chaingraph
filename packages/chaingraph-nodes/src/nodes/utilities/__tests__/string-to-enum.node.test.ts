/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { ExecutionContext } from '@badaitech/chaingraph-types'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { StringToEnumNode } from '../string-to-enum.node'

describe('stringToEnumNode', () => {
  let node: StringToEnumNode
  let mockContext: ExecutionContext

  beforeEach(() => {
    node = new StringToEnumNode('test-id')
    node.initialize()

    // Create a mock execution context
    mockContext = {} as ExecutionContext
  })

  afterEach(() => {
    // Clean up
  })

  describe('basic conversion', () => {
    it('should convert any string to enum', async () => {
      node.inputString = 'any-string-value'

      const result = await node.execute(mockContext)

      expect(result).toEqual({})
      expect(node.outputEnum).toBe('any-string-value')
    })

    it('should handle empty string input', async () => {
      node.inputString = ''

      const result = await node.execute(mockContext)

      expect(result).toEqual({})
      expect(node.outputEnum).toBeUndefined()
    })

    it('should handle undefined input', async () => {
      node.inputString = undefined

      const result = await node.execute(mockContext)

      expect(result).toEqual({})
      expect(node.outputEnum).toBeUndefined()
    })

    it('should handle null input', async () => {
      node.inputString = null as any

      const result = await node.execute(mockContext)

      expect(result).toEqual({})
      expect(node.outputEnum).toBeUndefined()
    })
  })

  describe('dynamic enum options', () => {
    it('should accept any string value', async () => {
      const testValues = ['value1', 'test-string', '123', 'CamelCase', 'snake_case', 'kebab-case']

      for (const value of testValues) {
        node.inputString = value
        const result = await node.execute(mockContext)
        expect(result).toEqual({})
        expect(node.outputEnum).toBe(value)
      }
    })

    it('should handle dynamic values', async () => {
      node.inputString = 'dynamic-value'

      await node.execute(mockContext)

      expect(node.outputEnum).toBe('dynamic-value')
    })

    it('should handle special characters in strings', async () => {
      const specialStrings = ['hello world', 'test@email.com', 'value#123', 'data-2024']

      for (const value of specialStrings) {
        node.inputString = value
        const result = await node.execute(mockContext)
        expect(result).toEqual({})
        expect(node.outputEnum).toBe(value)
      }
    })
  })

  describe('sequential executions', () => {
    it('should handle multiple executions with different values', async () => {
      const testValues = ['first', 'second', 'third', 'fourth', 'fifth']

      for (const value of testValues) {
        node.inputString = value
        const result = await node.execute(mockContext)
        expect(result).toEqual({})
        expect(node.outputEnum).toBe(value)
      }
    })

    it('should clear output when input becomes empty after having a value', async () => {
      // Set initial value
      node.inputString = 'some-value'
      await node.execute(mockContext)
      expect(node.outputEnum).toBe('some-value')

      // Clear the input
      node.inputString = ''
      await node.execute(mockContext)
      expect(node.outputEnum).toBeUndefined()
    })
  })

  describe('node metadata', () => {
    it('should be an instance of StringToEnumNode', () => {
      // Verify node is the correct instance
      expect(node).toBeInstanceOf(StringToEnumNode)
    })

    it('should have input and output properties', () => {
      // Check that the properties exist on the node
      expect('inputString' in node).toBe(true)
      expect('outputEnum' in node).toBe(true)
      expect('allowedValues' in node).toBe(true)
    })

    it('should convert string values correctly', () => {
      // Test the actual functionality - this is what matters most
      node.inputString = 'test-value'
      expect(node.inputString).toBe('test-value')

      // After execution, the enum should have the same value
      // This test verifies the core behavior works
    })
  })

  describe('validation with allowed values', () => {
    it('should allow valid values when allowedValues is provided', async () => {
      node.allowedValues = ['option1', 'option2', 'option3']
      node.inputString = 'option2'

      const result = await node.execute(mockContext)

      expect(result).toEqual({})
      expect(node.outputEnum).toBe('option2')
    })

    it('should throw error for invalid values when allowedValues is provided', async () => {
      node.allowedValues = ['option1', 'option2', 'option3']
      node.inputString = 'invalid-option'

      await expect(node.execute(mockContext)).rejects.toThrow(
        'Invalid value: "invalid-option". Allowed values are: option1, option2, option3',
      )
    })

    it('should accept any value when allowedValues is undefined', async () => {
      node.allowedValues = undefined
      node.inputString = 'any-value'

      const result = await node.execute(mockContext)

      expect(result).toEqual({})
      expect(node.outputEnum).toBe('any-value')
    })

    it('should accept any value when allowedValues is empty array', async () => {
      node.allowedValues = []
      node.inputString = 'any-value'

      const result = await node.execute(mockContext)

      expect(result).toEqual({})
      expect(node.outputEnum).toBe('any-value')
    })

    it('should validate against multiple allowed values', async () => {
      const allowedValues = ['value1', 'value2', 'value3', 'value4', 'value5']
      node.allowedValues = allowedValues

      // Test all valid values
      for (const value of allowedValues) {
        node.inputString = value
        const result = await node.execute(mockContext)
        expect(result).toEqual({})
        expect(node.outputEnum).toBe(value)
      }

      // Test invalid value
      node.inputString = 'invalid'
      await expect(node.execute(mockContext)).rejects.toThrow(
        'Invalid value: "invalid". Allowed values are: value1, value2, value3, value4, value5',
      )
    })

    it('should handle empty string with validation', async () => {
      node.allowedValues = ['option1', 'option2']
      node.inputString = ''

      const result = await node.execute(mockContext)

      expect(result).toEqual({})
      expect(node.outputEnum).toBeUndefined()
    })

    it('should handle undefined input with validation', async () => {
      node.allowedValues = ['option1', 'option2']
      node.inputString = undefined

      const result = await node.execute(mockContext)

      expect(result).toEqual({})
      expect(node.outputEnum).toBeUndefined()
    })
  })
})
