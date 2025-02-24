/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { ExecutionContext, NodeExecutionResult } from '@badaitech/chaingraph-types'
import { BaseNode, Input, Node, Output, PortObject } from '@badaitech/chaingraph-types'

@Node({
  title: 'Object Node',
  description: 'Node with example object input and output',
})
class ObjectNode extends BaseNode {
  @Input()
  @PortObject({
    title: 'Input Object',
    schema: {
      properties: {},
    },

    isSchemaMutable: true,
    ui: {
      hideEditor: false,
      addKeyFormHidden: false,
      addKeyFormSpoilerState: false,
      keyDeletable: true,
    },
  })
  input: { [key: string]: any } = {}

  @Output()
  @PortObject({
    title: 'Output Object',
    schema: {
      properties: {},
    },

    isSchemaMutable: true,
    ui: {
      hideEditor: false,
      addKeyFormHidden: false,
      addKeyFormSpoilerState: false,
      keyDeletable: true,
    },
  })
  output: { [key: string]: any } = {}

  async execute(context: ExecutionContext): Promise<NodeExecutionResult> {
    return {}
  }
}
