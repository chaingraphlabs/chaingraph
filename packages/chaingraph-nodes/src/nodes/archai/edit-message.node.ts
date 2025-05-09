/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type {
  ExecutionContext,
  NodeExecutionResult,
} from '@badaitech/chaingraph-types'
import process from 'node:process'
import { createGraphQLClient, GraphQL } from '@badaitech/badai-api'

import {
  BaseNode,
  Input,
  Node,
  Number as NumberPort,
  Output,
  Boolean as PortBoolean,
  String,
} from '@badaitech/chaingraph-types'
import { NODE_CATEGORIES } from '../../categories'

@Node({
  type: 'EditMessageArchAINode',
  title: 'ArchAI Edit Message',
  description: 'Edits an existing message with updated content',
  category: NODE_CATEGORIES.ARCHAI,
  tags: ['message', 'edit', 'content'],
})
class EditMessageArchAINode extends BaseNode {
  @Input()
  @NumberPort({
    title: 'Message ID',
    description: 'ID of the message to edit',
    ui: {
      hideEditor: true,
    },
  })
  messageID: number = 0

  @Input()
  @String({
    title: 'Text',
    description: 'Updated text content of the message',
  })
  text: string = ''

  @Input()
  @PortBoolean({
    title: 'Finished',
    description: 'Flag indicating if the message is finished',
  })
  finished: boolean = true

  @Output()
  @NumberPort({
    title: 'Message ID',
    description: 'ID of the message being edited',
    defaultValue: 0,
  })
  public messageIDOutput: number = 0

  async execute(context: ExecutionContext): Promise<NodeExecutionResult> {
    // Validate message ID
    if (!this.messageID) {
      throw new Error('Message ID is required to edit a message')
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

    const { message } = await graphQLClient.request(GraphQL.GetMessageDocument, {
      session: agentSession,
      chat_id: chatID,
      id: this.messageID,
    })

    if (!message) {
      throw new Error(`Message with ID ${this.messageID} not found`)
    }

    const messageData = message as GraphQL.Message

    const { editMessage } = await graphQLClient.request(GraphQL.EditMessageDocument, {
      session: agentSession,
      chat_id: chatID,
      id: this.messageID,
      message: {
        attachments: messageData.attachments,
        finished: this.finished,
        is_system: messageData.is_system,
        need_answer: messageData.need_answer,
        reply_to: messageData.reply_to,
        text: this.text,
      },
    })

    const editMessageResponse = editMessage as GraphQL.MessageFieldsFragment
    if (!editMessageResponse) {
      throw new Error('Failed to edit message, response is empty')
    }

    // Create message object according to schema
    this.messageIDOutput = editMessageResponse.id

    return {}
  }
}

export default EditMessageArchAINode
