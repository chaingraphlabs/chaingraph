/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { ExecutionContext, NodeExecutionResult } from '@badaitech/chaingraph-types'
import { PortObject } from '@badaitech/chaingraph-types'
import { BaseNode, Node, Output } from '@badaitech/chaingraph-types'
import { NODE_CATEGORIES } from '../../categories'

@Node({
  type: 'ObjectNode',
  title: 'Object Node',
  description: 'A node that outputs an object',
  category: NODE_CATEGORIES.BASIC_VALUES,
})
class ObjectNode extends BaseNode {
  @Output()
  @PortObject({
    schema: {
      properties: {},
    },
    isSchemaMutable: true,
    ui: {
      keyDeletable: true,
      hideEditor: false,
    },
  })
  public object: Record<string, any> = {}

  async execute(context: ExecutionContext): Promise<NodeExecutionResult> {
    // This node simply outputs the default number value.
    return {}
  }
}

export default ObjectNode
