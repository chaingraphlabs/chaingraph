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
    isMutable: true,
    ui: {
      hideEditor: false,
      addItemFormHidden: false,
    },
  })
  allowedValues?: string[]

  /**
   * The output enum with the same value as the input string.
   *
   * Note: The empty options array is intentional. The Chaingraph framework
   * dynamically populates enum options at runtime based on the actual values
   * passed through the port. This allows the node to work with any string value
   * without predefined restrictions.
   */
  @Output()
  @PortEnum({
    title: 'Enum Output',
    description: 'The enum output with the same value as the input string',
    options: [], // Dynamic enum: populated at runtime by the framework
    defaultValue: undefined,
    required: false,
  })
  outputEnum?: string

  /**
   * Execute the node logic: convert the input string to an enum output
   */
  async execute(context: ExecutionContext): Promise<NodeExecutionResult> {
    // Handle empty input: undefined, null, or empty string all clear the output
    // Empty strings are treated as no value to prevent downstream issues
    if (this.inputString === undefined || this.inputString === null || this.inputString === '') {
      this.outputEnum = undefined
      return {}
    }

    // If allowed values are provided, validate the input
    if (this.allowedValues && this.allowedValues.length > 0) {
      // Use Set for O(1) lookup performance with large arrays
      const allowedSet = new Set(this.allowedValues)
      if (!allowedSet.has(this.inputString)) {
        // Limit displayed values to prevent overly long error messages
        const maxDisplay = 10
        const displayValues = this.allowedValues.length <= maxDisplay
          ? this.allowedValues.join(', ')
          : `${this.allowedValues.slice(0, maxDisplay).join(', ')}... (${this.allowedValues.length} total)`
        throw new Error(`Invalid value: "${this.inputString}". Allowed values are: ${displayValues}`)
      }
    }

    // Set the enum output to the input string value
    this.outputEnum = this.inputString

    return {}
  }
}
