/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { ExecutionContext, NodeExecutionResult } from '@badaitech/chaingraph-types'
import { BaseNode, Node, Output, PortArray } from '@badaitech/chaingraph-types'
import { NODE_CATEGORIES } from '../../categories'

@Node({
  type: 'ArrayNode',
  title: 'Array Node',
  description: 'A node that outputs an array',
  category: NODE_CATEGORIES.BASIC_VALUES,
})
class ArrayNode extends BaseNode {
  @Output()
  @PortArray({
    title: 'Array',
    description: 'The output array.',
    defaultValue: [],
    itemConfig: {
      type: 'any',
    },
    isMutable: true,
    ui: {
      hideEditor: false,
      addItemFormHidden: false,
    },
  })
  array: any[] = []

  async execute(context: ExecutionContext): Promise<NodeExecutionResult> {
    // This node simply outputs the default number value.
    return {}
  }
}

export default ArrayNode
