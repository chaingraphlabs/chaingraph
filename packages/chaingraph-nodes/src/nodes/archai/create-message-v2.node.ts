/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { ArchAIContext, ExecutionContext, NodeExecutionResult } from '@badaitech/chaingraph-types'
import process from 'node:process'
import { createGraphQLClient, GraphQL } from '@badaitech/badai-api'
import {
  BaseNode,
  Input,
  Node,
  PortNumber as NumberPort,
  Output,
  PortArray,
  PortBoolean,
  PortString,
} from '@badaitech/chaingraph-types'
import { NODE_CATEGORIES } from '../../categories'

@Node({
  type: 'CreateMessageArchAIV2Node',
  title: 'ArchAI Create Message V2',
  description: 'Creates a new message with specified content and ability to trigger an agent',
  category: NODE_CATEGORIES.ARCHAI,
  tags: ['message', 'create', 'content'],
})
class CreateMessageArchAIV2Node extends BaseNode {
  @Input()
  @PortString({
    title: 'Text',
    description: 'Text content of the message to create',
  })
  text: string = ''

  @Input()
  @PortBoolean({
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

  @Input()
  @PortArray({
    title: 'Attachment IDs',
    description: 'List of attachment IDs to include with the message (from Upload Attachment node)',
    itemConfig: {
      type: 'string',
    },
    isMutable: true,
  })
  attachmentIds?: string[]

  @Input()
  @PortArray({
    title: 'Notify Agents',
    description: 'List of agents to notify about a message',
    itemConfig: {
      type: 'object',
      schema: {
        type: 'object',
        properties: {
          agent_id: {
            type: 'string',
            title: 'Agent ID',
            description: 'ID of the agent to notify',
            required: true,
          },
          message_id: {
            type: 'number',
            title: 'Message ID',
            description: 'ID of the message to notify about (0 or not provided will use the newly created message)',
            required: false,
          },
        },
      },
    },
    isMutable: true,
  })
  signals?: Array<{ agent_id: string, message_id?: number }>

  @Output()
  @NumberPort({
    title: 'Message ID',
    description: 'Created message ID',
  })
  messageID: number = 0

  async execute(context: ExecutionContext): Promise<NodeExecutionResult> {
    const archAIContext = context.getIntegration<ArchAIContext>('archai')

    const agentSession = archAIContext?.agentSession
    if (!agentSession) {
      throw new Error('ArchAI agent session is not available in the context')
    }

    const chatID = archAIContext?.chatID
    if (!chatID) {
      throw new Error('ArchAI chat ID is not available in the context')
    }

    const graphQLClient = createGraphQLClient(
      process.env.BADAI_API_URL || 'http://localhost:9151/graphql',
    )

    // Process signals to remove message_id if it's 0 or undefined
    const processedSignals = this.signals?.map((signal) => {
      if (!signal.message_id || signal.message_id === 0) {
        return { agent_id: signal.agent_id }
      }
      return signal
    })

    // Filter out empty attachment IDs
    const attachments = this.attachmentIds?.filter(id => id?.trim()) || undefined

    const { sendMessage } = await graphQLClient.request(GraphQL.SendMessageDocument, {
      session: agentSession,
      chat_id: chatID,
      message: {
        attachments: attachments?.length ? attachments : undefined,
        error: undefined,
        finished: this.finished,
        is_system: false,
        need_answer: false,
        reply_to: this.replyTo,
        text: this.text,
        signals: processedSignals,
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
    const parsedMessageID = Number.parseInt(createdMessageID, 10)
    if (Number.isNaN(parsedMessageID)) {
      throw new TypeError(`Failed to parse created message ID as a number: ${createdMessageID}`)
    }

    this.messageID = parsedMessageID

    return {}
  }
}

export default CreateMessageArchAIV2Node
