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
} from '@badaitech/chaingraph-types'
import { NODE_CATEGORIES } from '../../categories'

@Node({
  type: 'FinishMessageArchAINode',
  title: 'ArchAI Finish Message',
  description: 'Controls the finished state of a message',
  category: NODE_CATEGORIES.ARCHAI,
  tags: ['message', 'finish', 'status'],
})
class FinishMessageArchAINode extends BaseNode {
  @Input()
  @NumberPort({
    title: 'Message ID',
    description: 'ID of the message to update',
    ui: {
      hideEditor: true,
    },
  })
  messageID: number = 0

  @Input()
  @Boolean({
    title: 'Finish',
    description: 'Whether to mark the message as finished (true) or unfinished (false)',
    defaultValue: true,
  })
  finish: boolean = true

  @Output()
  @NumberPort({
    title: 'Message ID',
    description: 'ID of the processed message',
    defaultValue: 0,
  })
  messageIDOutput: number = 0

  async execute(context: ExecutionContext): Promise<NodeExecutionResult> {
    // Validate message ID
    if (!this.messageID) {
      throw new Error('Message ID is required to update a message')
    }

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

    // First, fetch the message to ensure it exists
    const { message } = await graphQLClient.request(GraphQL.GetMessageDocument, {
      session: agentSession,
      chat_id: chatID,
      id: this.messageID,
    })

    if (!message) {
      throw new Error(`Message with ID ${this.messageID} not found`)
    }

    if (this.finish) {
      // If finish is true, use the dedicated FinishMessage operation
      const { finishMessage } = await graphQLClient.request(GraphQL.FinishMessageDocument, {
        session: agentSession,
        chat_id: chatID,
        id: this.messageID,
      })

      if (!finishMessage) {
        throw new Error('Failed to finish message, response is empty')
      }
    } else {
      // If finish is false, we need to use EditMessage to set finished=false
      const messageData = message as GraphQL.Message

      const { editMessage } = await graphQLClient.request(GraphQL.EditMessageDocument, {
        session: agentSession,
        chat_id: chatID,
        id: this.messageID,
        message: {
          attachments: messageData.attachments,
          finished: false, // Set finished to false
          is_system: messageData.is_system,
          need_answer: messageData.need_answer,
          reply_to: messageData.reply_to,
          text: messageData.text || '',
        },
      })

      if (!editMessage) {
        throw new Error('Failed to unfinish message, response is empty')
      }
    }

    // Set the output message ID
    this.messageIDOutput = this.messageID

    return {}
  }
}

export default FinishMessageArchAINode
