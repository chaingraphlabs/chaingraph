/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { ExecutionContext, NodeExecutionResult } from '@badaitech/chaingraph-types'
import { BaseNode, Input, Node, Output, PortBoolean, PortString } from '@badaitech/chaingraph-types'
import { NODE_CATEGORIES } from '../../categories'

@Node({
  type: 'TextSearchNode',
  title: 'Text Search',
  description: 'Search for a string in the source text (case-insensitive)',
  category: NODE_CATEGORIES.DATA,
  tags: ['text', 'search'],
})
class TextSearchNode extends BaseNode {
  @Input()
  @PortString({
    title: 'Source Text',
    description: 'Text to search in',
    minLength: 1,
  })
  sourceText: string = ''

  @Input()
  @PortString({
    title: 'Search String',
    description: 'String to search for',
  })
  searchText: string = ''

  @Output()
  @PortBoolean({
    title: 'Is Present',
    description: 'True if the search string is present in the source text',
    defaultValue: false,
  })
  result: boolean = false

  async execute(context: ExecutionContext): Promise<NodeExecutionResult> {
    this.result = this.sourceText.toLowerCase().includes(this.searchText.toLowerCase())

    return {}
  }
}

export default TextSearchNode
