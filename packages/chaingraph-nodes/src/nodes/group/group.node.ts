/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { ExecutionContext, NodeExecutionResult } from '@badaitech/chaingraph-types'
import { BaseNode, Input, Node, NodeExecutionStatus, String } from '@badaitech/chaingraph-types'
import { NODE_CATEGORIES } from '../../categories'

@Node({
  title: 'Group',
  description: 'Group nodes',
  category: NODE_CATEGORIES.GROUP,
  tags: ['group'],
})
class GroupNode extends BaseNode {
  @Input()
  @String()
  a: string = ''

  async execute(context: ExecutionContext): Promise<NodeExecutionResult> {
    return {
      status: NodeExecutionStatus.Completed,
      startTime: context.startTime,
      endTime: new Date(),
      outputs: new Map(),
    }
  }
}

export default GroupNode
