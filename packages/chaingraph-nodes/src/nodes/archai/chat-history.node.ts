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
  Number,
  Output,
  PortArray,
  PortEnum,
} from '@badaitech/chaingraph-types'
import { NODE_CATEGORIES } from '../../categories'
import { Attachment, Participant } from './types'
import { Message } from './types'

enum Order {
  ASC = 'ASC',
  DESC = 'DESC',
}

@Node({
  type: 'ArchAIChatHistoryNode',
  title: 'ArchAI Chat History',
  description: 'Retrieve chat history from ArchAI Chat',
  category: NODE_CATEGORIES.ARCHAI,
  tags: ['chat', 'history', 'context'],
})
class ArchAIChatHistoryNode extends BaseNode {
  @Input()
  @Number({
    title: 'From Message ID',
    description: 'ID of the message from which to start fetching history, which is 0 by default',
    defaultValue: 0,
  })
  fromMessageId: number = 0

  @Input()
  @Number({
    title: 'Limit',
    description: 'Number of messages to fetch from the chat history',
    defaultValue: 30,
  })
  limit: number = 30

  @Input()
  @PortEnum({
    title: 'Order',
    description: 'Order of the messages to fetch',
    defaultValue: Order.ASC,
    options: [
      { id: Order.ASC, type: 'string', defaultValue: Order.ASC, title: 'Ascending' },
      { id: Order.DESC, type: 'string', defaultValue: Order.DESC, title: 'Descending' },
    ],
  })
  order: Order = Order.ASC

  @Output()
  @PortArray({
    itemConfig: {
      type: 'object',
      schema: Message,
    },
    title: 'Chat History',
    description: 'Chat history messages list',
    defaultValue: [],
    ui: {
      hideEditor: false,
      hidePort: false,
    },
  })
  chatHistory: Message[] = []

  async execute(context: ExecutionContext): Promise<NodeExecutionResult> {
    const chatID = context.badAIContext?.chatID
    if (!chatID) {
      throw new Error('ArchAI chat ID is not available in the context')
    }

    const agentSession = context.badAIContext?.agentSession
    if (!agentSession) {
      throw new Error('ArchAI agent session is not available in the context')
    }

    const graphQLClient = createGraphQLClient(
      process.env.BADAI_API_URL || 'http://localhost:9151/graphql',
    )

    // const { messagesWithoutSystem } = await graphQLClient.request(GraphQL.GetMessagesWithoutSystemDocument, {
    const { messages } = await graphQLClient.request(GraphQL.GetMessagesDocument, {
      session: agentSession,
      chat_id: chatID,
      from: this.fromMessageId ?? 0,
      limit: this.limit ?? 100,
      order: Order.DESC,
    })

    let chatMessages = messages as GraphQL.Message[]
    if (!chatMessages) {
      return {}
    }

    chatMessages = chatMessages.filter((message) => {
      return !message.is_system
    })

    // sort messages by id depending on the order
    if (this.order === Order.ASC) {
      chatMessages.sort((a, b) => a.id - b.id)
    } else {
      chatMessages.sort((a, b) => b.id - a.id)
    }

    this.chatHistory = chatMessages?.map((message) => {
      // Transform participant data if available
      let participant: Participant | undefined
      if (message.participant) {
        participant = new Participant()
        participant.participant_id = message.participant.participant_id
        participant.username = message.participant.username
        participant.first_name = message.participant.first_name
        participant.agent_id = message.participant.agent_id || ''
        participant.is_agent = Boolean(message.participant.is_agent)
        participant.avatar = message.participant.avatar || ''
        participant.last_name = message.participant.last_name || undefined
        participant.meta = typeof message.participant.meta === 'string'
          ? message.participant.meta
          : JSON.stringify(message.participant.meta || {})
      }

      // Transform attachments if available
      const attachments: Attachment[] = (message.attachments as GraphQL.Attachment[] | undefined)?.map((attachment) => {
        const attachmentPort = new Attachment()
        attachmentPort.id = attachment.id
        attachmentPort.filename = attachment.filename
        attachmentPort.url = attachment.url
        attachmentPort.mime_type = attachment.mime_type
        attachmentPort.size = attachment.size
        return attachmentPort
      }) || []

      // Create the message object according to our schema
      const messagePort = new Message()
      messagePort.message_id = message.id
      messagePort.chat_id = message.chat_id
      messagePort.text = message.text || ''
      messagePort.author_id = message.author
      messagePort.type = message.type || 'common'
      messagePort.time = message.time
      messagePort.participant = participant
      messagePort.attachments = attachments
      messagePort.finished = Boolean(message.finished)
      messagePort.is_system = Boolean(message.is_system)
      messagePort.need_answer = Boolean(message.need_answer)
      messagePort.version = message.version || 1
      messagePort.reply_to = message.reply_to || undefined
      messagePort.error = message.error || ''
      messagePort.meta = typeof message.meta === 'string'
        ? message.meta
        : JSON.stringify(message.meta || {})

      return messagePort
    }) || []

    return {}
  }
}

export default ArchAIChatHistoryNode
