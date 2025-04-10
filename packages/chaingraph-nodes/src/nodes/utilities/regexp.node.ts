/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { ExecutionContext, INode, NodeExecutionResult } from '@badaitech/chaingraph-types'
import {
  BaseNode,
  Boolean,
  Input,
  Node,
  Number,
  ObjectSchema,
  Output,
  PortEnum,
  PortObject,
  PortVisibility,
  String,
} from '@badaitech/chaingraph-types'

/**
 * Schema for RegExp flags
 */
@ObjectSchema({
  description: 'Regular expression flags configuration',
})
export class RegExpFlags {
  @Boolean({
    title: 'Global (g)',
    description: 'Find all matches rather than stopping after the first match',
  })
  global: boolean = true

  @Boolean({
    title: 'Case-insensitive (i)',
    description: 'Make the pattern case-insensitive (matches both "Hello" and "hello")',
  })
  caseInsensitive: boolean = false

  @Boolean({
    title: 'Multi-line (m)',
    description: 'Make ^ and $ match the start/end of each line instead of the whole string',
  })
  multiline: boolean = false

  @Boolean({
    title: 'Dot-all (s)',
    description: 'Make . match newlines as well ("line1\\nline2" would match "line1.line2")',
  })
  dotAll: boolean = false

  @Boolean({
    title: 'Unicode (u)',
    description: 'Treat pattern as a sequence of Unicode code points (useful for emoji and special characters)',
  })
  unicode: boolean = false
}

/**
 * Regular expression operation modes
 */
export enum RegExpMode {
  MATCH = 'match',
  REPLACE = 'replace',
  TEST = 'test',
  EXTRACT = 'extract',
}

/**
 * Node for processing text with regular expressions
 */
@Node({
  type: 'RegExpNode',
  title: 'Regular Expression Processor',
  description: `Process text using regular expressions with different operation modes.

Common use cases:
• Extract emails, URLs, or phone numbers from text
• Validate input formats (emails, dates, credit cards)
• Replace or redact sensitive information
• Transform text formats (e.g., date formats, markdown to HTML)`,
  category: 'utilities',
  tags: ['regex', 'text', 'pattern', 'match', 'replace', 'extract', 'validation', 'parsing'],
})
class RegExpNode extends BaseNode {
  @Input()
  @String({
    title: 'Source Text',
    description: 'Text to process with the regular expression',
    required: true,
    ui: {
      isTextArea: true,
    },
  })
  sourceText: string = ''

  @Input()
  @String({
    title: 'RegExp Pattern',
    description: `The regular expression pattern to apply.

Examples:
• Email: [a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}
• Phone: \\(\\d{3}\\)\\s*\\d{3}-\\d{4}
• URL: https?://[\\w.-]+\\.[a-zA-Z]{2,}[\\w\\-._~:/?#[\\]@!$&'()*+,;=]*`,
    required: true,
  })
  pattern: string = ''

  @Input()
  @PortObject({
    title: 'Flags',
    description: 'Regular expression flags that modify how pattern matching works',
    schema: RegExpFlags,
  })
  flags: RegExpFlags = new RegExpFlags()

  @Input()
  @PortEnum({
    title: 'Operation Mode',
    description: `How to process the text with the regular expression:

• Match: Find all matching patterns in the text
• Replace: Replace matched patterns with new text
• Test: Check if the pattern exists in the text (true/false)
• Extract Groups: Extract only the parts captured in parentheses`,
    options: [
      { type: 'string', title: 'Match', id: RegExpMode.MATCH },
      { type: 'string', title: 'Replace', id: RegExpMode.REPLACE },
      { type: 'string', title: 'Test', id: RegExpMode.TEST },
      { type: 'string', title: 'Extract Groups', id: RegExpMode.EXTRACT },
    ],
    defaultValue: RegExpMode.MATCH,
  })
  mode: RegExpMode = RegExpMode.MATCH

  @Input()
  @String({
    title: 'Replacement Text',
    description: `Text to use for replacement (only in replace mode).

Special references:
• $& - The matched text
• $1, $2, etc. - Capturing groups
• $$ - Literal $

Example: "Name: $1" for pattern "(\\w+)" would replace "John" with "Name: John"`,
    defaultValue: '',
    ui: {
      hidden: false,
      isTextArea: true,
    },
  })
  @PortVisibility({
    showIf: (instance: INode) => (instance as RegExpNode).mode === RegExpMode.REPLACE,
  })
  replacementText: string = ''

  @Input()
  @String({
    title: 'Join Delimiter',
    description: 'String used to join multiple matches or groups together',
    defaultValue: ' ',
  })
  @PortVisibility({
    showIf: (instance: INode) =>
      (instance as RegExpNode).mode === RegExpMode.MATCH || (instance as RegExpNode).mode === RegExpMode.EXTRACT,
  })
  joinDelimiter: string = ' '

  @Output()
  @String({
    title: 'Result Text',
    description: 'Processed text based on the regular expression and selected mode',
  })
  result: string = ''

  @Output()
  @Number({
    title: 'Match Count',
    description: 'Number of matches found or capturing groups extracted',
  })
  matchCount: number = 0

  @Output()
  @Boolean({
    title: 'Has Matches',
    description: 'Whether any matches were found in the text',
  })
  hasMatches: boolean = false

  /**
   * Generate flag string from flag object
   */
  private getFlagString(): string {
    let flagString = ''
    if (this.flags.global)
      flagString += 'g'
    if (this.flags.caseInsensitive)
      flagString += 'i'
    if (this.flags.multiline)
      flagString += 'm'
    if (this.flags.dotAll)
      flagString += 's'
    if (this.flags.unicode)
      flagString += 'u'
    return flagString
  }

  async execute(context: ExecutionContext): Promise<NodeExecutionResult> {
    try {
      // Validate inputs
      if (!this.pattern) {
        throw new Error('RegExp pattern is required.')
      }

      if (!this.sourceText) {
        throw new Error('Source text is empty.')
      }

      // Get flag string from flag object
      const flagString = this.getFlagString()

      let regex: RegExp
      try {
        regex = new RegExp(this.pattern, flagString)
      } catch (syntaxError) {
        if (syntaxError instanceof SyntaxError) {
          throw new TypeError(`Invalid regular expression: ${syntaxError.message}`)
        }
        throw syntaxError
      }

      // Process based on the selected mode
      switch (this.mode) {
        case RegExpMode.MATCH: {
          const matches = this.sourceText.match(regex) || []
          this.result = matches.join(this.joinDelimiter)
          this.matchCount = matches.length
          this.hasMatches = matches.length > 0
          break
        }

        case RegExpMode.REPLACE: {
          this.result = this.sourceText.replace(regex, this.replacementText)
          // Count matches by first executing match
          const testRegex = new RegExp(
            this.pattern,
            flagString.includes('g') ? flagString : `${flagString}g`,
          )
          const matches = this.sourceText.match(testRegex) || []
          this.matchCount = matches.length
          this.hasMatches = matches.length > 0
          break
        }

        case RegExpMode.TEST: {
          const isMatch = regex.test(this.sourceText)
          this.result = isMatch.toString()
          this.matchCount = isMatch ? 1 : 0
          this.hasMatches = isMatch
          break
        }

        case RegExpMode.EXTRACT: {
          const allMatches: string[] = []
          let match: RegExpExecArray | null

          // Need to ensure we have global flag for multiple matches
          const extractRegex = flagString.includes('g')
            ? regex
            : new RegExp(this.pattern, `${flagString}g`)

          while (true) {
            const match = extractRegex.exec(this.sourceText)
            if (match === null)
              break
            // Skip the full match (at index 0) and only include capturing groups
            if (match.length > 1) {
              allMatches.push(...match.slice(1).filter(group => group !== undefined))
            }
          }

          this.result = allMatches.join(this.joinDelimiter)
          this.matchCount = allMatches.length
          this.hasMatches = allMatches.length > 0
          break
        }

        default:
          throw new Error(`Unsupported operation mode: ${this.mode}`)
      }

      return {}
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : error
      console.error('RegExpNode error:', error)
      throw new Error(`RegExpNode execution failed: ${errorMessage}`)
    }
  }
}

export default RegExpNode
