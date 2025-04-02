/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { ExecutionContext, NodeExecutionResult } from '@badaitech/chaingraph-types'
import { BaseNode, Input, Node, Output, String } from '@badaitech/chaingraph-types'
import { NODE_CATEGORIES } from '../../categories/constants'

@Node({
  title: 'Webhook',
  description: 'Sends HTTP requests to external services',
  category: NODE_CATEGORIES.UTILITIES,
  tags: ['http', 'webhook', 'request'],
})
class WebhookNode extends BaseNode {
  @Input()
  @String({
    title: 'URL',
    description: 'Webhook URL',
  })
  url: string = ''

  @Output()
  @String({
    title: 'Response',
    description: 'Webhook response',
  })
  response: string = ''

  async execute(context: ExecutionContext): Promise<NodeExecutionResult> {
    // Mock implementation
    this.response = `Webhook called: ${this.url}`

    return {}
  }
}

export default WebhookNode
