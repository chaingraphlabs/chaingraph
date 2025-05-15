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
import { Message } from './types'
import { Attachment } from './types'
import { Participant } from './types'
import { ChatMeta } from './types'

@Node({
  type: 'ArchAIChatMetaNode',
  title: 'ArchAI Chat Meta',
  description: 'Chat meta context for ArchAI',
  category: NODE_CATEGORIES.ARCHAI,
  tags: ['chat', 'meta', 'context'],
})
class ArchAIChatMetaNode extends BaseNode {
  @Output()
  @PortObject({
    schema: ChatMeta,
    title: 'Chat Meta',
    description: 'The chat meta data',
  })
  chatMeta?: ChatMeta

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

    const { getChatRoom } = await graphQLClient.request(GraphQL.GetChatRoomDocument, {
      session: agentSession,
      chat_id: chatID,
    })

    const chatMeta = getChatRoom as GraphQL.ChatRoom
    if (!chatMeta) {
      throw new Error('Failed to fetch message from ArchAI API')
    }

    // Transform participant data if available
    const participants = chatMeta.participants?.map((participant) => {
      const participantPort = new Participant()
      participantPort.participant_id = participant.participant_id
      participantPort.username = participant.username
      participantPort.first_name = participant.first_name
      participantPort.agent_id = participant.agent_id || ''
      participantPort.is_agent = Boolean(participant.is_agent)
      participantPort.avatar = participant.avatar || ''
      participantPort.last_name = participant.last_name || undefined
      participantPort.meta = typeof participant.meta === 'string'
        ? participant.meta
        : JSON.stringify(participant.meta || {})

      return participantPort
    }) ?? []

    let lastMessage: Message | undefined

    if (chatMeta.last_message) {
      let participant: Participant | undefined
      if (chatMeta.last_message.participant) {
        participant = new Participant()

        participant.participant_id = chatMeta.last_message.participant.participant_id
        participant.username = chatMeta.last_message.participant.username
        participant.first_name = chatMeta.last_message.participant.first_name
        participant.agent_id = chatMeta.last_message.participant.agent_id || ''
        participant.is_agent = Boolean(chatMeta.last_message.participant.is_agent)
        participant.avatar = chatMeta.last_message.participant.avatar || ''
        participant.last_name = chatMeta.last_message.participant.last_name || undefined
        participant.meta = typeof chatMeta.last_message.participant.meta === 'string'
          ? chatMeta.last_message.participant.meta
          : JSON.stringify(chatMeta.last_message.participant.meta || {})
      }

      // Transform attachments if available
      const attachments: Attachment[] = (chatMeta.last_message.attachments as GraphQL.Attachment[] | undefined)?.map((attachment) => {
        const attachmentPort = new Attachment()
        attachmentPort.id = attachment.id
        attachmentPort.filename = attachment.filename
        attachmentPort.url = attachment.url
        attachmentPort.mime_type = attachment.mime_type
        attachmentPort.size = attachment.size
        return attachmentPort
      }) || []

      lastMessage = new Message()
      lastMessage.message_id = chatMeta.last_message.id
      lastMessage.chat_id = chatMeta.last_message.chat_id
      lastMessage.text = chatMeta.last_message.text || ''
      lastMessage.author_id = chatMeta.last_message.author
      lastMessage.type = chatMeta.last_message.type || 'common'
      lastMessage.time = chatMeta.last_message.time
      lastMessage.participant = participant || undefined
      lastMessage.attachments = attachments || []
      lastMessage.finished = Boolean(chatMeta.last_message.finished)
      lastMessage.is_system = Boolean(chatMeta.last_message.is_system)
      lastMessage.need_answer = Boolean(chatMeta.last_message.need_answer)
      lastMessage.version = chatMeta.last_message.version || 1
      lastMessage.reply_to = chatMeta.last_message.reply_to || undefined
      lastMessage.error = chatMeta.last_message.error || ''
      lastMessage.meta = typeof chatMeta.last_message.meta === 'string'
        ? chatMeta.last_message.meta
        : JSON.stringify(chatMeta.last_message.meta || {})
    }

    this.chatMeta = new ChatMeta()
    this.chatMeta.author = chatMeta.author
    this.chatMeta.created_at = chatMeta.created_at || undefined
    this.chatMeta.id = chatMeta.id
    this.chatMeta.last_message = lastMessage || undefined
    this.chatMeta.last_message_time = chatMeta.last_message_time || undefined
    this.chatMeta.meta = chatMeta.meta || '{}'
    this.chatMeta.name = chatMeta.name
    this.chatMeta.updated_at = chatMeta.updated_at || undefined
    this.chatMeta.participants = participants

    return {}
  }
}

export default ArchAIChatMetaNode
