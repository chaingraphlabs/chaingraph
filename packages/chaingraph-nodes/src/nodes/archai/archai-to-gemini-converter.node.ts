/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { ExecutionContext, NodeExecutionResult } from '@badaitech/chaingraph-types'
import type { GeminiMessagePart } from '../ai/gemini/gemini-conversation-types'
import type { Attachment } from './types'
import { Buffer } from 'node:buffer'
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
 * Allowed hosts for attachment fetching (SSRF protection)
 */
const ALLOWED_ATTACHMENT_HOSTS = [
  'cdn.discordapp.com',
  'media.discordapp.net',
  'discord.com',
  'githubusercontent.com',
  's3.amazonaws.com',
  'storage.googleapis.com',
  'attachments-okx.chaingraph.io',
  'okx-attachments.thearch.ai',
  'thearch.ai',
  'app.thearch.ai',
  'attachments.badai.io',
  'app.badai.io',
]

/**
 * Supported image MIME types for Gemini
 */
const SUPPORTED_IMAGE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
]

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

  @Input()
  @PortBoolean({
    title: 'Include Attachments',
    description: `**Convert image attachments to Gemini inlineData parts**

Downloads attachments and embeds as base64.
Supported types: JPEG, PNG, GIF, WebP

Failed downloads show: \`[Attachment unavailable: filename (type)]\``,
    defaultValue: false,
  })
  includeAttachments: boolean = false

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

      // Build parts array
      const parts: GeminiMessagePart[] = []

      // Add text part if present
      if (formattedText) {
        parts.push({ text: formattedText })
      }

      // Add attachment parts if enabled
      if (this.includeAttachments && archaiMessage.attachments && archaiMessage.attachments.length > 0) {
        const attachmentParts = await this.processAttachments(archaiMessage.attachments)
        parts.push(...attachmentParts)
      }

      // Skip messages with no parts
      if (parts.length === 0) {
        continue
      }

      // Build Gemini message
      const geminiMessage: ConversationMessage = {
        role,
        parts,
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

  // ============================================================================
  // Attachment Processing
  // ============================================================================

  /**
   * Process attachments into Gemini message parts
   */
  private async processAttachments(attachments: Attachment[]): Promise<GeminiMessagePart[]> {
    const parts: GeminiMessagePart[] = []

    for (const attachment of attachments) {
      // Skip non-image attachments (only images supported)
      if (!SUPPORTED_IMAGE_TYPES.includes(attachment.mime_type)) {
        continue
      }

      // Validate URL (SSRF protection)
      if (!this.isAllowedAttachmentHost(attachment.url)) {
        continue
      }

      try {
        const base64 = await this.fetchAttachmentAsBase64(attachment.url)
        parts.push({
          inlineData: {
            data: base64,
            mimeType: attachment.mime_type,
          },
        })
      } catch (error) {
        // Add text placeholder so AI knows attachment existed but couldn't load
        parts.push({
          text: `[Attachment unavailable: ${attachment.filename} (${attachment.mime_type})]`,
        })
      }
    }

    return parts
  }

  /**
   * Check if URL host is allowed (SSRF protection)
   */
  private isAllowedAttachmentHost(url: string): boolean {
    try {
      const parsedUrl = new URL(url)

      // HTTPS only
      if (parsedUrl.protocol !== 'https:') {
        return false
      }

      // Block private IPs and localhost
      const hostname = parsedUrl.hostname.toLowerCase()
      if (
        hostname === 'localhost'
        || hostname.startsWith('127.')
        || hostname.startsWith('192.168.')
        || hostname.startsWith('10.')
        || hostname.startsWith('172.16.')
        || hostname.startsWith('172.17.')
        || hostname.startsWith('172.18.')
        || hostname.startsWith('172.19.')
        || hostname.startsWith('172.2')
        || hostname.startsWith('172.30.')
        || hostname.startsWith('172.31.')
      ) {
        return false
      }

      // Check allowed hosts
      return ALLOWED_ATTACHMENT_HOSTS.some(host => hostname.endsWith(host))
    } catch {
      return false
    }
  }

  /**
   * Fetch attachment from URL and return as base64
   */
  private async fetchAttachmentAsBase64(url: string): Promise<string> {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 5000) // 5s timeout

    try {
      const response = await fetch(url, {
        signal: controller.signal,
        headers: { 'User-Agent': 'ChainGraph/1.0' },
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      // Check size limit (10MB)
      const contentLength = response.headers.get('content-length')
      if (contentLength && Number.parseInt(contentLength) > 10 * 1024 * 1024) {
        throw new Error('Attachment too large (>10MB)')
      }

      const buffer = await response.arrayBuffer()
      return Buffer.from(buffer).toString('base64')
    } finally {
      clearTimeout(timeout)
    }
  }
}

export default ArchAIMessagesToGeminiConverterNode
