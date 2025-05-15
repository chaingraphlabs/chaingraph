/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type {
  ExecutionContext,
  NodeEvent,
  NodeExecutionResult,
} from '@badaitech/chaingraph-types'
import process from 'node:process'
import { createGraphQLClient, GraphQL } from '@badaitech/badai-api'
import {
  findPortByKey,
} from '@badaitech/chaingraph-types'
import {
  Boolean,
} from '@badaitech/chaingraph-types'
import {
  PortVisibility,
} from '@badaitech/chaingraph-types'
import {
  Number as PortNumber,
} from '@badaitech/chaingraph-types'
import {
  BaseNode,
  Input,
  MultiChannel,
  Node,
  Output,
  PortStream,
  String,
} from '@badaitech/chaingraph-types'
import { NODE_CATEGORIES } from '../../categories'

@Node({
  type: 'ArchAIStreamMessageNode',
  title: 'ArchAI Stream Message',
  description: 'Streams message content to ArchAI by collecting input strings and sending them in chunks to update an existing message or create a new one.',
  category: NODE_CATEGORIES.ARCHAI,
})
class ArchAIStreamMessageNode extends BaseNode {
  @Input()
  @PortNumber({
    title: 'Message ID',
    description: 'ID of the message to stream. If not provided, a new message will be created.',
    ui: {
      hideEditor: true,
    },
    required: false,
  })
  @PortVisibility({
    showIf: (node) => {
      const replyToPort = findPortByKey(node, 'replyTo')
      if (!replyToPort) {
        return true
      }

      return (replyToPort.getConfig().connections?.length ?? 0) === 0
    },
  })
  messageID?: number

  @Input()
  @PortNumber({
    title: 'Reply To Message ID',
    description: 'ID of the message to reply to. If not provided, the message will not be a reply.',
    ui: {
      hideEditor: true,
    },
    required: false,
  })
  @PortVisibility({
    showIf: (node) => {
      const messageIDPort = findPortByKey(node, 'messageID')
      if (!messageIDPort) {
        return true
      }

      return (messageIDPort.getConfig().connections?.length ?? 0) === 0
    },
  })
  replyTo?: number

  // Input stream port that accepts strings
  @Input()
  @PortStream({
    title: 'Input Stream',
    description: 'Stream of strings to collect',
    itemConfig: {
      type: 'string',
    },
  })
  public inputStream: MultiChannel<string> = new MultiChannel<string>()

  @Input()
  @Boolean({
    title: 'Finish Message',
    description: 'Flag indicating if the message needs to be marked as finished after streaming is done',
    defaultValue: true,
  })
  public finishMessage: boolean = true

  @Output()
  @PortNumber({
    title: 'Message ID',
    description: 'ID of the message being streamed to',
    defaultValue: 0,
  })
  public messageIDOutput: number = 0

  // Output port for the concatenated result
  @Output()
  @String({
    title: 'Buffered Output',
    description: 'All received strings concatenated together',
    defaultValue: '',
  })
  public buffer: string = ''

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

    // check if the message ID is provided and exists
    if (this.messageID === undefined || this.messageID === null || this.messageID <= 0) {
      try {
      // create a new message
        const { sendMessage } = await graphQLClient.request(GraphQL.SendMessageDocument, {
          session: agentSession,
          chat_id: chatID,
          message: {
            text: '',
            finished: false,
            is_system: false,
            need_answer: true,
            attachments: [],
            reply_to: this.replyTo,
          },
        })

        if (!sendMessage) {
          throw new Error('Failed to send message')
        }

        this.messageID = (sendMessage as GraphQL.Message).id
      } catch (error) {
        throw new Error(`Failed to create message: ${error}`)
      }
    } else {
      try {
        const { message } = await graphQLClient.request(GraphQL.GetMessageDocument, {
          session: agentSession,
          chat_id: chatID,
          id: this.messageID,
        })

        if (!message) {
          throw new Error('Message not found')
        }
      } catch (error) {
        throw new Error(`Failed to fetch message: ${error}`)
      }
    }

    if (!this.messageID) {
      throw new Error('Message ID is not available')
    }

    const accumulated: string[] = []
    let chunk: string[] = []
    for await (const value of this.inputStream) {
      accumulated.push(value)
      chunk.push(value)

      if (chunk.length >= 1) {
        const { addDelta } = await graphQLClient.request(GraphQL.MessageAddDeltaDocument, {
          session: agentSession,
          chat_id: chatID,
          message_id: this.messageID,
          delta: chunk.join(''),
        })

        if (!addDelta) {
          throw new Error('Failed to add delta to message')
        }

        chunk = []
      }
    }

    if (chunk.length > 0) {
      const { addDelta } = await graphQLClient.request(GraphQL.MessageAddDeltaDocument, {
        session: agentSession,
        chat_id: chatID,
        message_id: this.messageID,
        delta: chunk.join(''),
      })

      if (!addDelta) {
        throw new Error('Failed to add delta to message')
      }
    }

    this.buffer = accumulated.join('')

    if (this.finishMessage) {
      try {
        const { finishMessage } = await graphQLClient.request(GraphQL.FinishMessageDocument, {
          session: agentSession,
          chat_id: chatID,
          id: this.messageID,
        })

        if (!finishMessage) {
          throw new Error('Failed to finish message')
        }
      } catch (error) {
        throw new Error(`Failed to finish message: ${error}`)
      }
    }

    this.messageIDOutput = this.messageID

    const streamError = this.inputStream.getError()
    if (streamError) {
      throw streamError
    }

    return {}
  }

  async onEvent(event: NodeEvent): Promise<void> {
    return super.onEvent(event)
  }
}

export default ArchAIStreamMessageNode
