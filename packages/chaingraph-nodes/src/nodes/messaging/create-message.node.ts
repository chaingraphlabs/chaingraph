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
  Input,
  Node,
  NodeExecutionStatus,
  Output,
  String,
} from '@badaitech/chaingraph-types'
import { NODE_CATEGORIES } from '../../categories'

@Node({
  title: 'Create Message',
  description: 'Creates a new message with specified content',
  category: NODE_CATEGORIES.MESSAGING,
  tags: ['message', 'create', 'content'],
})
class CreateMessageNode extends BaseNode {
  @Input()
  @String({
    title: 'Content',
    description: 'Message content to be sent',
  })
  content: string = ''

  @Output()
  @String({
    title: 'Message',
    description: 'Created message object',
  })
  message: string = ''

  async execute(context: ExecutionContext): Promise<NodeExecutionResult> {
    // Mock implementation
    this.message = `Message created: ${this.content}`

    return {
      status: NodeExecutionStatus.Completed,
      startTime: context.startTime,
      endTime: new Date(),
      outputs: new Map([['message', this.message]]),
    }
  }
}

export default CreateMessageNode
