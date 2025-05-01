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
  Number,
  Output,
  PortArray,
} from '@badaitech/chaingraph-types'

@Node({
  type: 'ArrayLengthNode',
  title: 'Array Length',
  description: 'Get the length of an array',
  category: 'data',
  tags: ['array', 'length', 'count', 'size'],
})
export class ArrayLengthNode extends BaseNode {
  /**
   * The input array to count the elements of
   */
  @Input()
  @PortArray({
    itemConfig: {
      type: 'any',
    },
    title: 'Array',
    description: 'The array to count elements of',
    defaultValue: [],
    required: false,
  })
  array?: any[]

  /**
   * The number of elements in the array
   */
  @Output()
  @Number({
    title: 'Length',
    description: 'The number of elements in the array',
    defaultValue: 0,
    required: true,
  })
  length: number = 0

  /**
   * Count the number of elements in the input array
   */
  async execute(context: ExecutionContext): Promise<NodeExecutionResult> {
    // Handle invalid inputs by returning 0
    if (!this.array || !Array.isArray(this.array)) {
      this.length = 0
      return {}
    }

    // Calculate and return the array length
    this.length = this.array.length || 0

    return {}
  }
}
