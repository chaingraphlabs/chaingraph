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
  Boolean,
  Input,
  Node,
  Number as NumberPort,
  Output,
  String,
} from '@badaitech/chaingraph-types'
import { NODE_CATEGORIES } from '../../categories'

@Node({
  type: 'CreateMessageArchAINode',
  title: 'ArchAI Create Message',
  description: 'Creates a new message with specified content',
  category: NODE_CATEGORIES.ARCHAI,
  tags: ['message', 'create', 'content'],
})
class CreateMessageArchAINode extends BaseNode {
  @Input()
  @String({
    title: 'Text',
    description: 'Text content of the message to create',
  })
  text: string = ''

  @Input()
  @Boolean({
    title: 'Finished',
    description: 'Flag indicating if the message is finished',
  })
  finished: boolean = false

  @Input()
  @NumberPort({
    title: 'Reply To',
    description: 'ID of the message to reply to',
    ui: {
      hideEditor: true,
    },
  })
  replyTo?: number

  @Output()
  @NumberPort({
    title: 'Message ID',
    description: 'Created message ID',
  })
  messageID: number = 0

  async execute(context: ExecutionContext): Promise<NodeExecutionResult> {
    const agentSession = context.badAIContext?.agentSession
    if (!agentSession) {
      throw new Error('ArchAI agent session is not available in the context')
    }

    const chatID = context.badAIContext?.chatID
    if (!chatID) {
      throw new Error('ArchAI chat ID is not available in the context')
    }

    const graphQLClient = createGraphQLClient(
      process.env.BADAI_API_URL || 'http://localhost:9151/graphql',
    )

    const { sendMessage } = await graphQLClient.request(GraphQL.SendMessageDocument, {
      session: agentSession,
      chat_id: chatID,
      message: {
        attachments: undefined,
        error: undefined,
        finished: this.finished,
        is_system: false,
        need_answer: true,
        reply_to: this.replyTo,
        text: this.text,
      },
    })

    if (!sendMessage) {
      throw new Error('Failed to create message, no response received')
    }

    const createdMessageID = (sendMessage as GraphQL.Message).id
    if (!createdMessageID) {
      throw new Error('Failed to create message, message ID is not available')
    }

    // check message id must be a number, try to parse it as well
    this.messageID = Number.parseInt(createdMessageID, 10)
    if (Number.isNaN(this.messageID)) {
      this.messageID = -1
      throw new TypeError('Failed to parse created message ID as a number')
    }

    return {}
  }
}

export default CreateMessageArchAINode
