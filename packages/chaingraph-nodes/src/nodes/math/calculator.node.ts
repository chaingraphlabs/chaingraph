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
  NodeExecutionStatus,
  Output,
  String,
} from '@badaitech/chaingraph-types'
import { NODE_CATEGORIES } from '../../categories'

@Node({
  title: 'Calculator',
  description: 'Performs basic mathematical operations',
  category: NODE_CATEGORIES.MATH,
  tags: ['math', 'calculation', 'arithmetic'],
})
class CalculatorNode extends BaseNode {
  @Input()
  @String({
    title: 'Expression',
    description: 'Mathematical expression to evaluate',
  })
  expression: string = ''

  @Output()
  @String({
    title: 'Result',
    description: 'Calculation result',
  })
  result: string = ''

  async execute(context: ExecutionContext): Promise<NodeExecutionResult> {
    // Mock implementation
    this.result = `Calculated: ${this.expression} = 42`

    return {
      status: NodeExecutionStatus.Completed,
      startTime: context.startTime,
      endTime: new Date(),
      outputs: new Map([['result', this.result]]),
    }
  }
}

export default CalculatorNode
