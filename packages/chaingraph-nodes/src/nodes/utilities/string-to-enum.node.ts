/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { ExecutionContext, NodeExecutionResult } from '@badaitech/chaingraph-types'
import {
  BaseNode,
  Input,
  Node,
  Output,
  PortArray,
  PortEnum,
  PortString,
} from '@badaitech/chaingraph-types'
import { NODE_CATEGORIES } from '../../categories'

@Node({
  type: 'StringToEnumNode',
  title: 'String to Enum',
  description: 'Converts a string input to an enum output with optional validation against allowed values.',
  category: NODE_CATEGORIES.UTILITIES,
  tags: ['conversion', 'string', 'enum', 'type', 'transform', 'validation'],
})
export class StringToEnumNode extends BaseNode {
  /**
   * The input string that will be converted to an enum
   */
  @Input()
  @PortString({
    title: 'String Input',
    description: 'The string value to convert to an enum',
    defaultValue: '',
    required: false,
  })
  inputString?: string

  /**
   * Optional array of allowed values for validation
   */
  @Input()
  @PortArray({
    title: 'Allowed Values',
    description: 'Optional array of allowed string values. If provided, the input will be validated against these values.',
    itemConfig: { type: 'string' },
    defaultValue: undefined,
    required: false,
  })
  allowedValues?: string[]

  /**
   * The output enum with the same value as the input string
   */
  @Output()
  @PortEnum({
    title: 'Enum Output',
    description: 'The enum output with the same value as the input string',
    options: [], // Start with empty options - will be populated dynamically
    defaultValue: undefined,
    required: false,
  })
  outputEnum?: string

  /**
   * Execute the node logic: convert the input string to an enum output
   */
  async execute(context: ExecutionContext): Promise<NodeExecutionResult> {
    // If no input string is provided, clear the output
    if (this.inputString === undefined || this.inputString === null || this.inputString === '') {
      this.outputEnum = undefined
      return {}
    }

    // If allowed values are provided, validate the input
    if (this.allowedValues && this.allowedValues.length > 0) {
      if (!this.allowedValues.includes(this.inputString)) {
        throw new Error(`Invalid value: "${this.inputString}". Allowed values are: ${this.allowedValues.join(', ')}`)
      }
    }

    // Set the enum output to the input string value
    this.outputEnum = this.inputString

    return {}
  }
}
