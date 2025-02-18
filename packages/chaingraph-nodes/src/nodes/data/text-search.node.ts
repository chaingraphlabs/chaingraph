/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { ExecutionContext, NodeExecutionResult } from '@badaitech/chaingraph-types'
import {
  BaseNode,
  Boolean,
  Input,
  Node,
  NodeExecutionStatus,
  Output,
  String,
} from '@badaitech/chaingraph-types'
import { NODE_CATEGORIES } from '../../categories'

@Node({
  title: 'Text Search',
  description: 'Search for a string in the source text (case-insensitive)',
  category: NODE_CATEGORIES.DATA,
  tags: ['text', 'search'],
})
class TextSearchNode extends BaseNode {
  @Input()
  @String({
    title: 'Source Text',
    description: 'Text to search in',
    minLength: 1,
  })
  sourceText: string = ''

  @Input()
  @String({
    title: 'Search String',
    description: 'String to search for',
  })
  searchText: string = ''

  @Output()
  @Boolean({
    title: 'Is Present',
    description: 'True if the search string is present in the source text',
    defaultValue: false,
  })
  result: boolean = false

  async execute(context: ExecutionContext): Promise<NodeExecutionResult> {
    // Mock implementation
    this.result = this.sourceText.toLowerCase().includes(this.searchText.toLowerCase())

    return {
      status: NodeExecutionStatus.Completed,
      startTime: context.startTime,
      endTime: new Date(),
      outputs: new Map([['result', this.result]]),
    }
  }
}

export default TextSearchNode
