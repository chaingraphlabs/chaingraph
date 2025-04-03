/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { ExecutionContext, NodeExecutionResult } from '@badaitech/chaingraph-types'
import { BaseNode, ExecutionEventEnum, Input, Node, String } from '@badaitech/chaingraph-types'
import { NODE_CATEGORIES } from '../../categories'

@Node({
  title: 'Debug Log',
  description: 'Logs a message to the console',
  category: NODE_CATEGORIES.UTILITIES,
  tags: ['debug', 'log', 'console'],
})
class DebugLogNode extends BaseNode {
  @Input()
  @String({
    title: 'Message',
    description: 'Message to log',
  })
  message: string = ''

  async execute(context: ExecutionContext): Promise<NodeExecutionResult> {
    await context.sendEvent({
      index: 0,
      type: ExecutionEventEnum.NODE_DEBUG_LOG_STRING,
      timestamp: new Date(),
      data: {
        node: this.clone(),
        log: this.message,
      },
    })
    return {}
  }
}

export default DebugLogNode
