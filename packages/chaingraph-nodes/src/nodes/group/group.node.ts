/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { ExecutionContext, NodeExecutionResult } from '@badaitech/chaingraph-types'
import { BaseNode, Node } from '@badaitech/chaingraph-types'
import { NODE_CATEGORIES } from '../../categories'

@Node({
  type: 'GroupNode',
  title: 'Group',
  description: 'Nodes group',
  category: NODE_CATEGORIES.GROUP,
  tags: ['group'],
})
class GroupNode extends BaseNode {
  async execute(context: ExecutionContext): Promise<NodeExecutionResult> {
    return {}
  }
}

export default GroupNode
