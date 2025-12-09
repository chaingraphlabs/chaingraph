/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { ExecutionContext, NodeExecutionResult } from '@badaitech/chaingraph-types'
import {
  BaseNode,
  Input,
  Node,
  Output,
  PortArray,
  PortBoolean,
  PortNumber,
  PortString,
} from '@badaitech/chaingraph-types'
import { NODE_CATEGORIES } from '../../categories'
import { ConversationMessage } from '../ai/gemini/gemini-conversation-types'
import { Message as ArchAIMessage } from './types'

/**
 * Archai to Gemini Messages Converter
 *
 * Converts ArchAI chat history to Gemini's ConversationMessage format.
 * Based on archai-to-anthropic-converter-v2 but adapted for Gemini's structure.
 */
@Node({
  type: 'ArchAIMessagesToGeminiConverterNode',
  title: 'ArchAI → Gemini Converter',
  description: `**Convert ArchAI chat history to Gemini messages**

Transforms ArchAI messages to Gemini's ConversationMessage format for:
- Multi-turn conversations
- Chat history replay
- Context-aware generation

**Role mapping:**
- Assistant → "model"
- User → "user"

**Chain output to:**
- Gemini Multimodal Call (previousMessages)
- Gemini Multimodal Image (previousMessages)`,
  category: NODE_CATEGORIES.ARCHAI,
  tags: ['gemini', 'archai', 'converter', 'message', 'history'],
})
export class ArchAIMessagesToGeminiConverterNode extends BaseNode {
  @Input()
  @PortArray({
    title: 'ArchAI Messages',
    description: 'Array of ArchAI chat history messages to convert',
    itemConfig: {
      type: 'object',
      schema: ArchAIMessage,
    },
    defaultValue: [],
    required: true,
  })
  archaiMessages: ArchAIMessage[] = []

  @Input()
  @PortBoolean({
    title: 'Skip System Messages',
    description: 'Whether to skip system messages in the conversion',
    defaultValue: true,
  })
  skipSystemMessages: boolean = true

  @Input()
  @PortBoolean({
    title: 'Skip Empty Messages',
    description: 'Whether to skip messages with empty text content',
    defaultValue: true,
  })
  skipEmptyMessages: boolean = true

  @Input()
  @PortString({
    title: 'Message Prefix Template',
    description: 'Template for message prefix (use {username}, {time}, {type}, etc. as placeholders)',
    defaultValue: '[@{username} at {time}]:',
    ui: {
      placeholder: 'e.g., [{username} at {time}]: ',
    },
  })
  messagePrefixTemplate: string = '[@{username} at {time}]:'

  @Input()
  @PortNumber({
    title: 'Message ID to Answer',
    description: 'If set, the message with this ID will be moved to the last position',
    ui: {
      placeholder: 'e.g., 123',
    },
  })
  messageIdToAnswer?: number

  @Input()
  @PortString({
    title: 'Assistant ID',
    description: 'ID of the assistant to mark messages as model role',
    defaultValue: '',
    ui: {
      placeholder: 'e.g., assistant-123',
    },
  })
  assistantId?: string

  @Output()
  @PortArray({
    title: 'Gemini Messages',
    description: 'Array of converted Gemini ConversationMessages',
    itemConfig: {
      type: 'object',
      schema: ConversationMessage,
    },
    defaultValue: [],
  })
  geminiMessages: ConversationMessage[] = []

  async execute(context: ExecutionContext): Promise<NodeExecutionResult> {
    this.geminiMessages = []

    if (!this.archaiMessages || this.archaiMessages.length === 0) {
      return {}
    }

    // Sort messages by time (oldest to newest)
    this.archaiMessages.sort((a, b) => {
      return new Date(a.time).getTime() - new Date(b.time).getTime()
    })

    let messageToAnswer: ConversationMessage | undefined

    for (const archaiMessage of this.archaiMessages) {
      if (!this.shouldIncludeMessage(archaiMessage)) {
        continue
      }

      // Determine role (assistant → "model", user → "user")
      const role = this.determineMessageRole(archaiMessage)

      // Format text with prefix template for user messages
      const formattedText = role === 'user'
        ? this.formatMessageText(archaiMessage)
        : archaiMessage.text.trim()

      if (!formattedText) {
        continue
      }

      // Build Gemini message
      const geminiMessage: ConversationMessage = {
        role,
        parts: [{ text: formattedText }],
      }

      // Check if this is the message to answer (defer to end)
      if (this.messageIdToAnswer && archaiMessage.message_id === this.messageIdToAnswer) {
        messageToAnswer = geminiMessage
      } else {
        this.geminiMessages.push(geminiMessage)
      }
    }

    // Add deferred message at the end if present
    if (messageToAnswer) {
      this.geminiMessages.push(messageToAnswer)
    }

    return {}
  }

  /**
   * Determine if message should be included
   */
  private shouldIncludeMessage(message: ArchAIMessage): boolean {
    if (this.skipSystemMessages && message.is_system) {
      return false
    }

    if (this.skipEmptyMessages && (!message.text || message.text.trim().length === 0)) {
      return false
    }

    return true
  }

  /**
   * Determine message role (user or model)
   */
  private determineMessageRole(message: ArchAIMessage): 'user' | 'model' {
    // If checking messageIdToAnswer, force it to be user
    if (this.messageIdToAnswer && message.message_id === this.messageIdToAnswer) {
      return 'user'
    }

    // If assistantId is set, check if this message's author matches
    if (this.assistantId && this.assistantId.trim().length > 0) {
      if (message.participant?.agent_id === this.assistantId) {
        return 'model'
      }
    }

    // Otherwise, check if participant is an agent
    if (message.participant?.is_agent) {
      return 'model'
    }

    // Default to user
    return 'user'
  }

  /**
   * Format message text with prefix template
   */
  private formatMessageText(message: ArchAIMessage): string {
    let formattedText = message.text.trim()

    // Apply prefix template for user messages
    if (this.messagePrefixTemplate && this.messagePrefixTemplate.trim().length > 0) {
      const prefix = this.applyMessagePrefixTemplate(message)
      formattedText = `${prefix} ${formattedText}`
    }

    return formattedText
  }

  /**
   * Apply template substitution for message prefix
   */
  private applyMessagePrefixTemplate(message: ArchAIMessage): string {
    let template = this.messagePrefixTemplate

    // Replace all placeholders with actual values
    template = template.replace(/\{(\w+)\}/g, (match, key) => {
      // Check message fields
      if (key in message && message[key as keyof ArchAIMessage] !== undefined && message[key as keyof ArchAIMessage] !== null) {
        const value = message[key as keyof ArchAIMessage]
        return String(value)
      }

      // Check participant fields
      if (message.participant && key in message.participant) {
        const value = message.participant[key as keyof typeof message.participant]
        if (value !== undefined && value !== null) {
          return String(value)
        }
      }

      // Return original placeholder if no match
      return match
    })

    return template
  }
}

export default ArchAIMessagesToGeminiConverterNode
