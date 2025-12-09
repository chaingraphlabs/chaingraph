/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type {
  ArchAIContext,
  ExecutionContext,
  NodeExecutionResult,
} from '@badaitech/chaingraph-types'
import process from 'node:process'
import { createGraphQLClient, GraphQL } from '@badaitech/badai-api'
import {
  BaseNode,
  Node,
  PortNumber as NumberPort,
  Output,
  Passthrough,
  PortObject,
  PortString,
} from '@badaitech/chaingraph-types'
import { NODE_CATEGORIES } from '../../categories'
import { Message } from './types'

@Node({
  type: 'ArchAIAddMessageAttachmentNode',
  title: 'ArchAI Add Message Attachment',
  description: 'Attaches an uploaded file to an existing message',
  category: NODE_CATEGORIES.ARCHAI,
  tags: ['archai', 'attachment', 'message'],
})
class ArchAIAddMessageAttachmentNode extends BaseNode {
  @Passthrough()
  @NumberPort({
    title: 'Message ID',
    description: 'ID of the message to attach the file to',
    required: true,
  })
  messageId: number = 0

  @Passthrough()
  @PortString({
    title: 'Attachment ID',
    description: 'ID of the uploaded attachment',
    required: true,
  })
  attachmentId: string = ''

  @Output()
  @PortObject({
    schema: Message,
    title: 'Message',
    description: 'Updated message with attachments',
  })
  result: Message = new Message()

  async execute(context: ExecutionContext): Promise<NodeExecutionResult> {
    // 1. Get ArchAI context
    const archAIContext = context.getIntegration<ArchAIContext>('archai')
    if (!archAIContext?.agentSession) {
      throw new Error('ArchAI agent session is not available in the context')
    }

    const chatID = archAIContext?.chatID
    if (!chatID) {
      throw new Error('ArchAI chat ID is not available in the context')
    }

    // 2. Validate inputs
    if (!this.messageId) {
      throw new Error('Message ID is required')
    }
    if (!this.attachmentId?.trim()) {
      throw new Error('Attachment ID is required')
    }

    // 3. Create GraphQL client and add attachment
    const graphQLClient = createGraphQLClient(
      process.env.BADAI_API_URL || 'http://localhost:9151/graphql',
    )

    const { addMessageAttachment } = await graphQLClient.request(
      GraphQL.AddMessageAttachmentDocument,
      {
        session: archAIContext.agentSession,
        chat_id: chatID,
        id: this.messageId,
        attachment_id: this.attachmentId.trim(),
      },
    )

    if (!addMessageAttachment) {
      throw new Error('Failed to add attachment to message')
    }

    // 5. Set output
    const msg = addMessageAttachment as GraphQL.Message
    this.result = new Message()
    this.result.message_id = Number.parseInt(msg.id, 10) || 0
    this.result.chat_id = msg.chat_id
    this.result.text = msg.text
    this.result.author_id = msg.author
    this.result.finished = msg.finished
    this.result.is_system = msg.is_system || false
    this.result.need_answer = msg.need_answer || false
    this.result.time = msg.time || ''
    this.result.version = 1
    this.result.attachments = (msg.attachments || []).map(att => ({
      id: att.id,
      filename: att.filename,
      url: att.url,
      mime_type: att.mime_type,
      size: att.size,
    }))

    return {}
  }
}

export default ArchAIAddMessageAttachmentNode
