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
  Boolean,
  Input,
  Node,
  Number,
  Output,
  String as StringDecorator,
} from '@badaitech/chaingraph-types'
import { Decimal } from 'decimal.js'

@Node({
  title: 'Number to String',
  description: 'Converts a number to its string representation with precise decimal handling',
  category: 'data',
  tags: ['conversion', 'format', 'number', 'string', 'decimal', 'precision'],
})
export class NumberToStringNode extends BaseNode {
  /**
   * The input number that will be converted to a string
   */
  @Input()
  @Number({
    title: 'Number',
    description: 'The number to convert to a string',
    defaultValue: 0,
    required: false,
  })
  number?: number

  /**
   * Controls the decimal places in the output string
   */
  @Input()
  @Number({
    title: 'Decimal Places',
    description: 'Number of decimal places to include (-1 for automatic)',
    min: -1,
    integer: true,
    defaultValue: -1,
    required: true,
  })
  decimalPlaces: number = -1

  /**
   * Whether to use exponential notation for large or small numbers
   */
  @Input()
  @Boolean({
    title: 'Exponential Notation',
    description: 'Use scientific notation for very large or small numbers',
    defaultValue: false,
    required: false,
  })
  exponential?: boolean

  /**
   * The string representation of the input number
   */
  @Output()
  @StringDecorator({
    title: 'String',
    description: 'The string representation of the number',
    defaultValue: '',
    required: false,
  })
  text?: string

  /**
   * Execute the node logic: convert the input number to a string using Decimal.js
   */
  async execute(context: ExecutionContext): Promise<NodeExecutionResult> {
    if (this.number === undefined || this.number === null) {
      this.text = ''
      throw new Error('Expected a number to convert to a string')
    }

    // Create a Decimal instance from the input number
    const decimal = new Decimal(this.number)

    // Get the decimal places setting (default to -1 if undefined)
    const decimalPlaces = this.decimalPlaces ?? -1

    // Convert to string based on the settings
    if (this.exponential) {
      // Use exponential notation
      this.text = decimalPlaces === -1
        ? decimal.toExponential()
        : decimal.toExponential(decimalPlaces)
    } else if (decimalPlaces === -1) {
      // Use standard notation with automatic precision
      this.text = decimal.toString()
    } else {
      // Use fixed decimal places
      this.text = decimal.toFixed(decimalPlaces)
    }

    return {}
  }
}
