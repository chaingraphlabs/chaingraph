/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { ExecutionContext, NodeExecutionResult } from '@badaitech/chaingraph-types'
import { BaseNode, Boolean, Node, Output } from '@badaitech/chaingraph-types'
import { NODE_CATEGORIES } from '../../categories'

@Node({
  title: 'Boolean Node',
  description: 'A node that outputs a boolean value.',
  category: NODE_CATEGORIES.BASIC_VALUES,
})
class BooleanNode extends BaseNode {
  @Output()
  @Boolean({
    title: 'Boolean',
    description: 'The output boolean flag.',
    ui: {
      hideEditor: false,
    },
  })
  public flag: boolean = false

  async execute(context: ExecutionContext): Promise<NodeExecutionResult> {
    // This node outputs the default boolean value.
    return {}
  }
}

export default BooleanNode
