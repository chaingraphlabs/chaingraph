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
import { BaseNode, Node, Output, PortObject } from '@badaitech/chaingraph-types'
import { NODE_CATEGORIES } from '../../categories'
import { Attachment } from './types'
import { Participant } from './types'
import { Message } from './types'

@Node({
  type: 'OnNewMessageEventNode',
  title: 'ArchAI On New Message Event',
  description: 'Triggered when a new message is received in the chat',
  category: NODE_CATEGORIES.ARCHAI,
  tags: ['message', 'event', 'new'],
})
class OnNewMessageEventNode extends BaseNode {
  @Output()
  @PortObject({
    schema: Message,
    title: 'Message',
    description: 'The received message data from ArchAI chat',
  })
  message?: Message

  async execute(context: ExecutionContext): Promise<NodeExecutionResult> {
    const chatID = context.badAIContext?.chatID
    if (!chatID) {
      throw new Error('ArchAI chat ID is not available in the context')
    }

    const messageID = context.badAIContext?.messageID
    if (!messageID) {
      throw new Error('ArchAI message ID is not available in the context')
    }

    const agentSession = context.badAIContext?.agentSession
    if (!agentSession) {
      throw new Error('ArchAI agent session is not available in the context')
    }

    const graphQLClient = createGraphQLClient(
      process.env.BADAI_API_URL || 'http://localhost:9151/graphql',
    )

    const { message } = await graphQLClient.request(GraphQL.GetMessageDocument, {
      session: agentSession,
      chat_id: chatID,
      id: messageID,
    })

    const inputMessage = message as GraphQL.MessageFieldsFragment
    if (!inputMessage) {
      throw new Error('Failed to fetch message from ArchAI API')
    }

    // Transform participant data if available
    let participant: Participant | undefined
    if (inputMessage.participant) {
      participant = new Participant()
      participant.participant_id = inputMessage.participant.participant_id
      participant.username = inputMessage.participant.username
      participant.first_name = inputMessage.participant.first_name
      participant.agent_id = inputMessage.participant.agent_id || ''
      participant.is_agent = Boolean(inputMessage.participant.is_agent)
      participant.avatar = inputMessage.participant.avatar || ''
      participant.last_name = inputMessage.participant.last_name || undefined
      participant.meta = typeof inputMessage.participant.meta === 'string'
        ? inputMessage.participant.meta
        : JSON.stringify(inputMessage.participant.meta || {})
    }

    // Transform attachments if available
    const attachments: Attachment[] = (inputMessage.attachments as GraphQL.Attachment[] | undefined)?.map((attachment) => {
      const attachmentPort = new Attachment()

      attachmentPort.id = attachment.id
      attachmentPort.filename = attachment.filename
      attachmentPort.url = attachment.url
      attachmentPort.mime_type = attachment.mime_type
      attachmentPort.size = attachment.size

      return attachmentPort
    }) || []

    // Create the message object according to our schema
    this.message = new Message()
    this.message.message_id = inputMessage.id
    this.message.chat_id = inputMessage.chat_id
    this.message.text = inputMessage.text || ''
    this.message.author_id = inputMessage.author
    this.message.type = inputMessage.type || 'common'
    this.message.time = inputMessage.time
    this.message.participant = participant || undefined
    this.message.attachments = attachments || []
    this.message.finished = Boolean(inputMessage.finished)
    this.message.is_system = Boolean(inputMessage.is_system)
    this.message.need_answer = Boolean(inputMessage.need_answer)
    this.message.version = inputMessage.version || 1
    this.message.reply_to = inputMessage.reply_to || undefined
    this.message.error = inputMessage.error || ''
    this.message.meta = typeof inputMessage.meta === 'string'
      ? inputMessage.meta
      : JSON.stringify(inputMessage.meta || {})

    return {}
  }
}

export default OnNewMessageEventNode
