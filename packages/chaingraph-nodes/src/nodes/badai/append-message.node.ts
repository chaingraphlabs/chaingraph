/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { ExecutionContext, NodeExecutionResult } from '@badaitech/chaingraph-types'
import process from 'node:process'
import { createGraphQLClient, GraphQL } from '@badaitech/badai-api'
import {
  BaseNode,
  Input,
  Node,
  Number as NumberPort,
  Output,
  String,
} from '@badaitech/chaingraph-types'
import { NODE_CATEGORIES } from '../../categories'

@Node({
  type: 'AppendMessageBadAINode',
  title: 'BadAI Append Message',
  description: 'Appends text content to an existing message',
  category: NODE_CATEGORIES.BADAI,
  tags: ['message', 'append', 'content', 'delta'],
})
class AppendMessageBadAINode extends BaseNode {
  @Input()
  @NumberPort({
    title: 'Message ID',
    description: 'ID of the message to append content to',
    required: true,
    ui: {
      hideEditor: true,
    },
  })
  messageID: number = 0

  @Input()
  @String({
    title: 'Content',
    description: 'Text content to append to the message',
    required: true,
    ui: {
      isTextArea: true,
    },
  })
  content: string = ''

  @Output()
  @NumberPort({
    title: 'Message ID',
    description: 'ID of the message that was updated',
    defaultValue: 0,
  })
  messageIDOutput: number = 0

  async execute(context: ExecutionContext): Promise<NodeExecutionResult> {
    // Validate inputs
    if (!this.messageID) {
      throw new Error('Message ID is required')
    }

    if (!this.content) {
      throw new Error('Content to append is required')
    }

    const agentSession = context.badAIContext?.agentSession
    if (!agentSession) {
      throw new Error('BadAI agent session is not available in the context')
    }

    const chatID = context.badAIContext?.chatID
    if (!chatID) {
      throw new Error('BadAI chat ID is not available in the context')
    }

    const graphQLClient = createGraphQLClient(
      process.env.BADAI_API_URL || 'http://localhost:9151/graphql',
    )

    try {
      // Call the MessageAddDelta mutation to append content to the message
      const { addDelta } = await graphQLClient.request(GraphQL.MessageAddDeltaDocument, {
        session: agentSession,
        chat_id: chatID,
        message_id: this.messageID,
        delta: this.content,
      })

      if (!addDelta) {
        throw new Error('Failed to append content to message')
      }

      // Set the output message ID
      this.messageIDOutput = addDelta.id

      return {}
    } catch (error: any) {
      throw new Error(`Failed to append message content: ${error.message || JSON.stringify(error)}`)
    }
  }
}

export default AppendMessageBadAINode
