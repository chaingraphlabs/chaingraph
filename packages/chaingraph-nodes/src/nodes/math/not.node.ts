/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { ExecutionContext, NodeExecutionResult } from '@badaitech/chaingraph-types'
import { BaseNode, Input, Node, Output, PortBoolean } from '@badaitech/chaingraph-types'
import { NODE_CATEGORIES } from '../../categories'

@Node({
  type: 'NotNode',
  title: 'Not',
  description: 'Performs logical NOT operation on a boolean value',
  category: NODE_CATEGORIES.MATH,
  tags: ['math', 'logic', 'boolean', 'not', 'inversion', 'negate'],
})
class NotNode extends BaseNode {
  @Input()
  @PortBoolean({
    title: 'Input',
    description: 'Boolean value to negate',
    defaultValue: false,
  })
  input: boolean = false

  @Output()
  @PortBoolean({
    title: 'Result',
    description: 'Negated (inverted) boolean value',
  })
  result: boolean = true

  async execute(context: ExecutionContext): Promise<NodeExecutionResult> {
    // Apply logical NOT operation
    this.result = !this.input
    return {}
  }
}

export default NotNode
