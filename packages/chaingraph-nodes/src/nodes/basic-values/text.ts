/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { ExecutionContext, NodeExecutionResult } from '@badaitech/chaingraph-types'
import { BaseNode, Node, Output, PortString } from '@badaitech/chaingraph-types'
import { NODE_CATEGORIES } from '../../categories'

@Node({
  type: 'TextNode',
  title: 'Text Node',
  description: 'A node that outputs a text string.',
  category: NODE_CATEGORIES.BASIC_VALUES,
})
class TextNode extends BaseNode {
  @Output()
  @PortString({
    title: 'Text',
    description: 'The output text string.',
    ui: {
      isTextArea: true,
      hideEditor: false,
    },
  })
  public text: string = ''

  async execute(context: ExecutionContext): Promise<NodeExecutionResult> {
    // In this simple node, no processing is applied – it only passes the default string.
    return {}
  }
}

export default TextNode
