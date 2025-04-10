/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { ExecutionContext, NodeExecutionResult } from '@badaitech/chaingraph-types'
import { BaseNode, Input, Node, Output, String } from '@badaitech/chaingraph-types'
import { NODE_CATEGORIES } from '../../categories'

@Node({
  type: 'BranchNode',
  title: 'Branch',
  description: 'Controls flow based on condition',
  category: NODE_CATEGORIES.FLOW,
  tags: ['flow', 'condition', 'branch'],
})
class BranchNode extends BaseNode {
  @Input()
  @String({
    title: 'Condition',
    description: 'Condition to evaluate',
  })
  condition: string = ''

  @Output()
  @String({
    title: 'Result',
    description: 'Branch result',
  })
  result: string = ''

  async execute(context: ExecutionContext): Promise<NodeExecutionResult> {
    // Mock implementation
    this.result = `Branched on condition: ${this.condition}`

    return {}
  }
}

export default BranchNode
