/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { ExecutionContext, NodeExecutionResult } from '@badaitech/chaingraph-types'
import { BaseNode, Node, Output, PortBoolean } from '@badaitech/chaingraph-types'
import { NODE_CATEGORIES } from '../../categories'

@Node({
  type: 'IsRootExecutionNode',
  title: 'Is Root Execution',
  description: 'Outputs true if the current execution is the root execution (entrypoint), false otherwise. Useful for ensuring nodes execute only once in the root context.',
  category: NODE_CATEGORIES.FLOW,
  tags: ['flow', 'control', 'root', 'execution', 'check', 'condition', 'logic'],
})
class IsRootExecutionNode extends BaseNode {
  @Output()
  @PortBoolean({
    title: 'Is Root',
    description: 'True if this is the root execution, false if it is a child execution',
    defaultValue: false,
  })
  isRoot: boolean = false

  async execute(context: ExecutionContext): Promise<NodeExecutionResult> {
    // Determine if this is a root execution by checking:
    // 1. executionDepth is 0 (most reliable indicator)
    // 2. isChildExecution is false/undefined
    // 3. parentExecutionId is undefined
    //
    // A root execution is the entrypoint/initial execution of a flow,
    // not spawned by any other execution or event
    this.isRoot = context.executionDepth === 0
      && !context.isChildExecution
      && !context.parentExecutionId

    return {}
  }
}

export default IsRootExecutionNode
