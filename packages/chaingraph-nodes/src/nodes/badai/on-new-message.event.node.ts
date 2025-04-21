/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { ExecutionContext, NodeExecutionResult } from '@badaitech/chaingraph-types'
import type { Attachment, Participant } from './types'
import { GraphQL, graphQLClient } from '@badaitech/badai-api'
import { BaseNode, Node, Output, PortObject } from '@badaitech/chaingraph-types'
import { NODE_CATEGORIES } from '../../categories'
import { Message } from './types'

@Node({
  type: 'OnNewMessageEventNode',
  title: 'On New Message Event',
  description: 'Triggered when a new message is received in the chat',
  category: NODE_CATEGORIES.BADAI,
  tags: ['message', 'event', 'new'],
})
class OnNewMessageEventNode extends BaseNode {
  @Output()
  @PortObject({
    schema: Message,
    title: 'Message',
    description: 'The received message data',
  })
  message?: Message

  async execute(context: ExecutionContext): Promise<NodeExecutionResult> {
    const chatID = context.badAIContext?.chatID
    if (!chatID) {
      throw new Error('BadAI chat ID is not available in the context')
    }

    const messageID = context.badAIContext?.messageID
    if (!messageID) {
      throw new Error('BadAI message ID is not available in the context')
    }

    const agentSession = context.badAIContext?.agentSession
    if (!agentSession) {
      throw new Error('BadAI agent session is not available in the context')
    }

    const { message } = await graphQLClient.request(GraphQL.GetMessageDocument, {
      session: agentSession,
      chat_id: chatID,
      id: messageID,
    })

    const inputMessage = message as any
    if (!inputMessage) {
      throw new Error('Failed to fetch message from BadAI API')
    }

    // Transform participant data if available
    let participant: Participant | undefined
    if (inputMessage.participant) {
      participant = {
        participant_id: inputMessage.participant.participant_id,
        username: inputMessage.participant.username,
        first_name: inputMessage.participant.first_name,
        agent_id: inputMessage.participant.agent_id || '',
        is_agent: Boolean(inputMessage.participant.is_agent),
        avatar: inputMessage.participant.avatar || '',
        last_name: inputMessage.participant.last_name || undefined,
        meta: typeof inputMessage.participant.meta === 'string'
          ? inputMessage.participant.meta
          : JSON.stringify(inputMessage.participant.meta || {}),
      }
    }

    // Transform attachments if available
    const attachments: Attachment[] = inputMessage.attachments?.map(attachment => ({
      id: attachment.id,
      filename: attachment.filename,
      url: attachment.url,
      mime_type: attachment.mime_type,
      size: attachment.size,
    })) || []

    // Create the message object according to our schema
    this.message = {
      message_id: inputMessage.message_id,
      chat_id: inputMessage.chat_id,
      text: inputMessage.text || '',
      author_id: inputMessage.author_id,
      type: inputMessage.type || 'common',
      time: inputMessage.time,
      participant,
      attachments,
      finished: Boolean(inputMessage.finished),
      is_system: Boolean(inputMessage.is_system),
      need_answer: Boolean(inputMessage.need_answer),
      version: inputMessage.version || 1,
      reply_to: inputMessage.reply_to || undefined,
      error: inputMessage.error || undefined,
      meta: typeof inputMessage.meta === 'string'
        ? inputMessage.meta
        : JSON.stringify(inputMessage.meta || {}),
    }

    return {}
  }
}

export default OnNewMessageEventNode
