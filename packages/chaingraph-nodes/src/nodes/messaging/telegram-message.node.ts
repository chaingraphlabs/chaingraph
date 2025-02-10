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
  title: 'Telegram Message',
  description: 'Sends a message to Telegram',
  category: NODE_CATEGORIES.MESSAGING,
  tags: ['telegram', 'message', 'social'],
})
class TelegramMessageNode extends BaseNode {
  @Input()
  @String({
    title: 'Message',
    description: 'Message to send to Telegram',
  })
  message: string = ''

  @Output()
  @String({
    title: 'Result',
    description: 'Sending result status',
  })
  result: string = ''

  async execute(context: ExecutionContext): Promise<NodeExecutionResult> {
    // Mock implementation
    this.result = `Telegram message sent: ${this.message}`

    // delay 3 sec + 2 sec random time
    await new Promise(resolve => setTimeout(resolve, 3000 + Math.random() * 2000))

    return {
      status: NodeExecutionStatus.Completed,
      startTime: context.startTime,
      endTime: new Date(),
      outputs: new Map([['result', this.result]]),
    }
  }
}

export default TelegramMessageNode
