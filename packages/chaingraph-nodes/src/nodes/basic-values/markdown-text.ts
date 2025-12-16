/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { ExecutionContext, NodeExecutionResult } from '@badaitech/chaingraph-types'
import { Passthrough } from '@badaitech/chaingraph-types'
import { BaseNode, Node, PortString } from '@badaitech/chaingraph-types'
import { NODE_CATEGORIES } from '../../categories'

@Node({
  type: 'MarkdownTextNode',
  title: 'Markdown Text',
  description: 'A text node with live markdown preview. Supports GitHub Flavored Markdown including tables, strikethrough, and task lists.',
  category: NODE_CATEGORIES.BASIC_VALUES,
})
class MarkdownTextNode extends BaseNode {
  @Passthrough()
  @PortString({
    title: 'Markdown',
    description: 'Markdown content with live preview.',
    ui: {
      isTextArea: true,
      renderMarkdown: true,
      hideEditor: false,
    },
  })
  public text: string = ''

  async execute(_context: ExecutionContext): Promise<NodeExecutionResult> {
    // Pass-through node - no processing applied
    return {}
  }
}

export default MarkdownTextNode
