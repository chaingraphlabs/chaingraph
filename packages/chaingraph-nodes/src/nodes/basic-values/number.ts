/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { ExecutionContext, NodeExecutionResult } from '@badaitech/chaingraph-types'
import { BaseNode, Node, Number, Output } from '@badaitech/chaingraph-types'
import { NODE_CATEGORIES } from '../../categories'

@Node({
  type: 'NumberNode',
  title: 'Number Node',
  description: 'A node that outputs a number value.',
  category: NODE_CATEGORIES.BASIC_VALUES,
})
class NumberNode extends BaseNode {
  @Output()
  @Number({
    title: 'Number',
    description: 'The output number.',
    ui: {
      hideEditor: false,
    },
  })
  public num: number = 0

  async execute(context: ExecutionContext): Promise<NodeExecutionResult> {
    // This node simply outputs the default number value.
    return {}
  }
}

export default NumberNode
