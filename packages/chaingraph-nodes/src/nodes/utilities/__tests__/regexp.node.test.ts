/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import RegExpNode, { RegExpFlags, RegExpMode } from '../regexp.node'

describe('regExpNode', () => {
  let node: RegExpNode
  let mockContext: any

  beforeEach(() => {
    node = new RegExpNode('test-id')
    node.initialize()
    // Create a mock execution context
    mockContext = {
      startTime: new Date(),
    }

    // Set default flag configuration
    node.flags = new RegExpFlags()
    node.flags.global = true
    node.flags.caseInsensitive = false
    node.flags.multiline = false
    node.flags.dotAll = false
    node.flags.unicode = false

    // Spy on console.error to verify error logging
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('input validation', () => {
    it('should throw error when pattern is empty', async () => {
      node.sourceText = 'test'
      node.pattern = ''

      await expect(node.execute(mockContext)).rejects.toThrow('RegExp pattern is required')
    })

    it('should throw error when source text is empty', async () => {
      node.pattern = '.*'
      node.sourceText = ''

      await expect(node.execute(mockContext)).rejects.toThrow('Source text is empty')
    })

    it('should throw error for invalid regular expression', async () => {
      node.sourceText = 'test'
      node.pattern = '[' // Invalid regex pattern

      await expect(node.execute(mockContext)).rejects.toThrow('Invalid regular expression')
    })
  })

  describe('flag handling', () => {
    it('should correctly generate flag string from flag object', async () => {
      // Test all flags enabled
      node.flags.global = true
      node.flags.caseInsensitive = true
      node.flags.multiline = true
      node.flags.dotAll = true
      node.flags.unicode = true

      node.sourceText = 'test TEST Test'
      node.pattern = 'test'
      node.mode = RegExpMode.MATCH

      await node.execute(mockContext)

      // With case-insensitive flag, all variants should match
      expect(node.matchCount).toBe(3)

      // Test flag combinations
      node.flags.caseInsensitive = false
      await node.execute(mockContext)
      expect(node.matchCount).toBe(1) // Only lowercase 'test' matches

      // Test without global flag
      node.flags.global = false
      node.flags.caseInsensitive = true
      await node.execute(mockContext)
      expect(node.matchCount).toBe(1) // Only first match due to no global flag
    })

    it('should handle multiline flag correctly', async () => {
      node.sourceText = 'First line\nSecond line\nThird line'
      node.pattern = '^\\w+'
      node.mode = RegExpMode.MATCH

      // Without multiline flag
      node.flags.multiline = false
      await node.execute(mockContext)
      expect(node.matchCount).toBe(1) // Only 'First' matches

      // With multiline flag
      node.flags.multiline = true
      await node.execute(mockContext)
      expect(node.matchCount).toBe(3) // 'First', 'Second', 'Third' match
    })

    it('should handle dotAll flag correctly', async () => {
      // Test with a regex pattern that explicitly requires dotAll to work
      node.sourceText = 'start\nend'
      node.pattern = 'start.end'
      node.mode = RegExpMode.TEST

      // Without dotAll flag, the dot won't match the newline character
      node.flags.dotAll = false
      await node.execute(mockContext)
      expect(node.result).toBe('false')

      // With dotAll flag, the dot will match the newline character
      node.flags.dotAll = true
      await node.execute(mockContext)
      expect(node.result).toBe('true')
    })
  })

  describe('match mode', () => {
    beforeEach(() => {
      node.mode = RegExpMode.MATCH
    })

    it('should match all occurrences of a pattern', async () => {
      node.sourceText = 'Contact us at support@example.com or sales@example.com'
      node.pattern = '[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}'

      await node.execute(mockContext)

      expect(node.result).toBe('support@example.com sales@example.com')
      expect(node.matchCount).toBe(2)
      expect(node.hasMatches).toBe(true)
    })

    it('should handle no matches', async () => {
      node.sourceText = 'Hello world'
      node.pattern = 'xyz'

      await node.execute(mockContext)

      expect(node.result).toBe('')
      expect(node.matchCount).toBe(0)
      expect(node.hasMatches).toBe(false)
    })

    it('should use specified join delimiter', async () => {
      node.sourceText = 'One Two Three'
      node.pattern = '\\w+'
      node.joinDelimiter = ', '

      await node.execute(mockContext)

      expect(node.result).toBe('One, Two, Three')
      expect(node.matchCount).toBe(3)
    })

    it('should use case insensitive flag', async () => {
      node.sourceText = 'Hello HELLO hello'
      node.pattern = 'hello'
      node.flags.caseInsensitive = true

      await node.execute(mockContext)

      expect(node.result).toBe('Hello HELLO hello')
      expect(node.matchCount).toBe(3)
    })
  })

  describe('replace mode', () => {
    beforeEach(() => {
      node.mode = RegExpMode.REPLACE
    })

    it('should replace matches with specified text', async () => {
      node.sourceText = 'Hello world'
      node.pattern = 'world'
      node.replacementText = 'universe'

      await node.execute(mockContext)

      expect(node.result).toBe('Hello universe')
      expect(node.matchCount).toBe(1)
      expect(node.hasMatches).toBe(true)
    })

    it('should replace multiple occurrences', async () => {
      node.sourceText = 'apple orange apple banana apple'
      node.pattern = 'apple'
      node.replacementText = 'fruit'

      await node.execute(mockContext)

      expect(node.result).toBe('fruit orange fruit banana fruit')
      expect(node.matchCount).toBe(3)
    })

    it('should handle capturing groups in replacement', async () => {
      node.sourceText = 'John Smith, Jane Doe'
      node.pattern = '(\\w+)\\s+(\\w+)'
      node.replacementText = '$2, $1'

      await node.execute(mockContext)

      expect(node.result).toBe('Smith, John, Doe, Jane')
    })

    it('should handle date format conversion', async () => {
      node.sourceText = 'Date: 12/25/2023'
      node.pattern = '(\\d{2})/(\\d{2})/(\\d{4})'
      node.replacementText = '$3-$1-$2'

      await node.execute(mockContext)

      expect(node.result).toBe('Date: 2023-12-25')
    })

    it('should work with special replacement patterns', async () => {
      node.sourceText = 'This is important'
      node.pattern = 'important'
      node.replacementText = '**$&**'

      await node.execute(mockContext)

      expect(node.result).toBe('This is **important**')
    })
  })

  describe('test mode', () => {
    beforeEach(() => {
      node.mode = RegExpMode.TEST
    })

    it('should return "true" when pattern matches', async () => {
      node.sourceText = 'Email: test@example.com'
      node.pattern = '@example\\.com'

      await node.execute(mockContext)

      expect(node.result).toBe('true')
      expect(node.matchCount).toBe(1)
      expect(node.hasMatches).toBe(true)
    })

    it('should return "false" when pattern does not match', async () => {
      node.sourceText = 'Email: test@example.com'
      node.pattern = '@invalid\\.com'

      await node.execute(mockContext)

      expect(node.result).toBe('false')
      expect(node.matchCount).toBe(0)
      expect(node.hasMatches).toBe(false)
    })

    it('should work with complex patterns and boundaries', async () => {
      node.sourceText = 'Credit card: 4111-1111-1111-1111'
      node.pattern = '^.*\\d{4}-\\d{4}-\\d{4}-\\d{4}$'

      await node.execute(mockContext)

      expect(node.result).toBe('true')
    })

    it('should handle lookahead assertions', async () => {
      // Password validation: at least 8 chars, one uppercase, one lowercase, one digit
      node.sourceText = 'Password123'
      node.pattern = '^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d).{8,}$'

      await node.execute(mockContext)

      expect(node.result).toBe('true')

      // Invalid password
      node.sourceText = 'password'
      await node.execute(mockContext)
      expect(node.result).toBe('false')
    })
  })

  describe('extract mode', () => {
    beforeEach(() => {
      node.mode = RegExpMode.EXTRACT
    })

    it('should extract capturing groups', async () => {
      node.sourceText = 'First: John, Last: Smith'
      node.pattern = 'First: (\\w+), Last: (\\w+)'

      await node.execute(mockContext)

      expect(node.result).toBe('John Smith')
      expect(node.matchCount).toBe(2)
      expect(node.hasMatches).toBe(true)
    })

    it('should extract multiple instances of groups', async () => {
      node.sourceText = 'Phone: (123) 456-7890, Phone: (555) 123-4567'
      node.pattern = '\\((\\d{3})\\)\\s*(\\d{3})-(\\d{4})'
      node.joinDelimiter = ', '

      await node.execute(mockContext)

      expect(node.result).toBe('123, 456, 7890, 555, 123, 4567')
      expect(node.matchCount).toBe(6)
    })

    it('should handle nested capturing groups', async () => {
      node.sourceText = 'Color: #FF5733 Size: 10px'
      node.pattern = 'Color: #(([0-9A-F]{2})([0-9A-F]{2})([0-9A-F]{2}))'

      await node.execute(mockContext)

      expect(node.result).toBe('FF5733 FF 57 33')
      expect(node.matchCount).toBe(4)
    })

    it('should return empty for no capturing groups', async () => {
      node.sourceText = 'This has no groups'
      node.pattern = 'has no'

      await node.execute(mockContext)

      expect(node.result).toBe('')
      expect(node.matchCount).toBe(0)
      expect(node.hasMatches).toBe(false)
    })

    it('should handle optional groups that are not matched', async () => {
      node.sourceText = 'Required and'
      node.pattern = 'Required(?: and)?(?: (optional))?'

      await node.execute(mockContext)

      // The optional capture group didn't match
      expect(node.result).toBe('')
      expect(node.matchCount).toBe(0)
    })
  })

  describe('complex real-world examples', () => {
    it('extracting URLs from text', async () => {
      node.mode = RegExpMode.MATCH
      node.sourceText = 'Visit https://example.com and http://test.org for more information.'
      node.pattern = 'https?://[\\w.-]+\\.[a-zA-Z]{2,}[\\w\\-._~:/?#[\\]@!$&\'()*+,;=]*'
      node.joinDelimiter = ', '

      await node.execute(mockContext)

      expect(node.result).toBe('https://example.com, http://test.org')
      expect(node.matchCount).toBe(2)
    })

    it('anonymizing personal information', async () => {
      node.mode = RegExpMode.REPLACE
      node.sourceText = 'Contact: John Doe (555-123-4567, john.doe@example.com)'
      node.pattern = '(\\d{3})-(\\d{3})-(\\d{4})'
      node.replacementText = 'XXX-XXX-$3'

      await node.execute(mockContext)

      expect(node.result).toBe('Contact: John Doe (XXX-XXX-4567, john.doe@example.com)')

      // Now replace the email - but we need to use the updated result as source text
      node.sourceText = node.result // Use the result from previous operation
      node.pattern = '[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}'
      node.replacementText = '[EMAIL REDACTED]'

      await node.execute(mockContext)

      expect(node.result).toBe('Contact: John Doe (XXX-XXX-4567, [EMAIL REDACTED])')
    })

    it('parsing CSV data', async () => {
      node.mode = RegExpMode.EXTRACT
      node.sourceText = 'John,Doe,42\nJane,Smith,38'
      node.pattern = '([^,\\n]+),([^,\\n]+),(\\d+)'
      node.joinDelimiter = '|'

      await node.execute(mockContext)

      expect(node.result).toBe('John|Doe|42|Jane|Smith|38')
      expect(node.matchCount).toBe(6)
    })

    it('markdown link extraction', async () => {
      node.mode = RegExpMode.EXTRACT
      node.sourceText = 'Check [this link](https://example.com) and [another one](https://test.org)'
      node.pattern = '\\[([^\\]]+)\\]\\(([^)]+)\\)'
      node.joinDelimiter = ', '

      await node.execute(mockContext)

      expect(node.result).toBe('this link, https://example.com, another one, https://test.org')
      expect(node.matchCount).toBe(4)
    })

    it('hTML tag stripping', async () => {
      node.mode = RegExpMode.REPLACE
      node.sourceText = '<p>This is <strong>important</strong> content</p>'
      node.pattern = '<[^>]+>'
      node.replacementText = ''

      await node.execute(mockContext)

      expect(node.result).toBe('This is important content')
    })
  })
  describe('getFlagString method', () => {
    it('should return correct flag string when all flags are enabled', () => {
      // This tests the private method via its effects
      node.flags.global = true
      node.flags.caseInsensitive = true
      node.flags.multiline = true
      node.flags.dotAll = true
      node.flags.unicode = true

      // Set up a test where we can see the effects of all flags
      node.sourceText = 'Hello\nWORLD'
      node.pattern = 'world'
      node.mode = RegExpMode.TEST

      return node.execute(mockContext)
        .then(() => {
          // With case-insensitive flag enabled, 'world' should match 'WORLD'
          expect(node.result).toBe('true')

          // Now disable case-insensitive flag and it should not match
          node.flags.caseInsensitive = false
          return node.execute(mockContext)
        })
        .then(() => {
          expect(node.result).toBe('false')
        })
    })

    it('should return an empty string when no flags are enabled', async () => {
      node.flags.global = false
      node.flags.caseInsensitive = false
      node.flags.multiline = false
      node.flags.dotAll = false
      node.flags.unicode = false

      // Set up a test with multiple matches but no global flag
      node.sourceText = 'test test test'
      node.pattern = 'test'
      node.mode = RegExpMode.MATCH

      await node.execute(mockContext)

      // Without global flag, only the first match should be returned
      expect(node.matchCount).toBe(1)
    })
  })

  describe('combined flag interactions', () => {
    it('should combine multiple flags correctly', async () => {
      // Test with multiline + case-insensitive
      node.sourceText = 'First LINE\nSecond LINE\nThird LINE'
      node.pattern = '^.*line'
      node.mode = RegExpMode.MATCH

      // Without proper flags, no matches
      node.flags.global = true
      node.flags.caseInsensitive = false
      node.flags.multiline = false
      await node.execute(mockContext)
      expect(node.matchCount).toBe(0)

      // With case-insensitive, but no multiline, only first line matches
      node.flags.caseInsensitive = true
      node.flags.multiline = false
      await node.execute(mockContext)
      expect(node.matchCount).toBe(1)

      // With both case-insensitive and multiline, all lines match
      node.flags.caseInsensitive = true
      node.flags.multiline = true
      await node.execute(mockContext)
      expect(node.matchCount).toBe(3)
    })

    it('should handle unicode flag correctly', async () => {
      // Test unicode flag with emojis
      node.sourceText = '😀 😃 😄 😁'
      node.pattern = '😀'
      node.mode = RegExpMode.MATCH

      // With unicode flag
      node.flags.unicode = true
      await node.execute(mockContext)
      expect(node.matchCount).toBe(1)
      expect(node.result).toBe('😀')
    })
  })

  describe('error handling', () => {
    describe('edge cases', () => {
      it('should handle empty source text with proper error', async () => {
        node.sourceText = ''
        node.pattern = '.*'

        await expect(node.execute(mockContext)).rejects.toThrow('Source text is empty')
      })

      it('should handle empty pattern with proper error', async () => {
        node.sourceText = 'test'
        node.pattern = ''

        await expect(node.execute(mockContext)).rejects.toThrow('RegExp pattern is required')
      })

      it('should handle undefined mode gracefully', async () => {
        node.sourceText = 'test'
        node.pattern = 'test'
        node.mode = 'invalid' as any

        await expect(node.execute(mockContext)).rejects.toThrow('Unsupported operation mode')
      })

      it('should handle very large input text', async () => {
        node.sourceText = 'a'.repeat(1000000)
        node.pattern = 'a{5}'
        node.mode = RegExpMode.TEST

        await node.execute(mockContext)
        expect(node.result).toBe('true')
      })

      it('should handle unicode characters properly', async () => {
        node.sourceText = 'こんにちは世界'
        node.pattern = '世界'
        node.mode = RegExpMode.MATCH

        await node.execute(mockContext)
        expect(node.result).toBe('世界')
        expect(node.matchCount).toBe(1)
      })
    })

    describe('object schema', () => {
      it('should initialize RegExpFlags object correctly', () => {
        const flags = new RegExpFlags()
        expect(flags.global).toBe(true)
        expect(flags.caseInsensitive).toBe(false)
        expect(flags.multiline).toBe(false)
        expect(flags.dotAll).toBe(false)
        expect(flags.unicode).toBe(false)
      })

      it('should handle modifications to RegExpFlags correctly', async () => {
      // Create a new flags object with non-default values
        const flags = new RegExpFlags()
        flags.global = false
        flags.caseInsensitive = true

        // Assign to node
        node.flags = flags

        // Test effects
        node.sourceText = 'Test TEST test'
        node.pattern = 'test'
        node.mode = RegExpMode.MATCH

        await node.execute(mockContext)

        // With case-insensitive but no global, only first match
        expect(node.result).toBe('Test')
        expect(node.matchCount).toBe(1)
      })
    })
  })
})
