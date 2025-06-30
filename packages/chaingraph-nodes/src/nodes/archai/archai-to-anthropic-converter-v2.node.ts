/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { ExecutionContext, NodeExecutionResult } from '@badaitech/chaingraph-types'
import { Buffer } from 'node:buffer'
import { PortNumber } from '@badaitech/chaingraph-types'
import {
  BaseNode,
  Input,
  Node,
  Output,
  PortArray,
  PortBoolean,
  PortString,
} from '@badaitech/chaingraph-types'
import { NODE_CATEGORIES } from '../../categories'
import { AntropicMessage, ImageBlock, TextBlock } from './../ai/anthropic/types'
import { Message as ArchAIMessage } from './types'

enum RoleAssignment {
  AUTO = 'auto',
  ALL_USER = 'all_user',
  ALL_ASSISTANT = 'all_assistant',
  BY_PARTICIPANT = 'by_participant',
}

@Node({
  type: 'ArchAIMessagesToAnthropicConverterNode',
  title: 'ArchAI Messages to Anthropic Converter',
  description: 'Converts ArchAI chat history messages to Anthropic message format',
  category: NODE_CATEGORIES.ARCHAI,
  tags: ['anthropic', 'archai', 'converter', 'message', 'history', 'claude'],
})
class ArchAIMessagesToAnthropicConverterNode extends BaseNode {
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
  @PortBoolean({
    title: 'Include Attachments',
    description: 'Whether to include attachment information in message text',
    defaultValue: false,
  })
  includeAttachments: boolean = false

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
    description: 'If set, the message with this ID will be moved to the last position in the output to force LLM to answer it',
    defaultValue: undefined,
    ui: {
      placeholder: 'e.g., 123',
    },
  })
  messageIdToAnswer?: number

  @Input()
  @PortString({
    title: 'Assistant ID',
    description: 'ID of the assistant to mark messages as assistant, if empty, will be determined by message author participant type. Usually needed for muli-agent scenarios',
    defaultValue: '',
    ui: {
      placeholder: 'e.g., assistant-123',
    },
  })
  assistantId?: string

  @Output()
  @PortArray({
    title: 'Anthropic Messages',
    description: 'Array of converted Anthropic messages',
    itemConfig: {
      type: 'object',
      schema: AntropicMessage,
    },
    defaultValue: [],
  })
  anthropicMessages: AntropicMessage[] = []

  async execute(context: ExecutionContext): Promise<NodeExecutionResult> {
    this.anthropicMessages = []

    if (!this.archaiMessages || this.archaiMessages.length === 0) {
      return {}
    }

    // make sure messages are sorted by time from oldest to newest
    this.archaiMessages.sort((a, b) => {
      return new Date(a.time).getTime() - new Date(b.time).getTime()
    })

    let messageToAnswer: AntropicMessage | undefined

    for (const archaiMessage of this.archaiMessages) {
      if (!this.shouldIncludeMessage(archaiMessage)) {
        continue
      }

      // Determine the role
      const role = this.determineMessageRole(archaiMessage)

      // Format the message text
      const formattedText = role === 'user'
        ? this.formatMessageText(archaiMessage)
        : archaiMessage.text.trim()

      if (!formattedText) {
        continue
      }

      // Create Anthropic message
      const anthropicMessage = new AntropicMessage()
      anthropicMessage.role = role

      // Create text block with the message content
      const textBlock = new TextBlock()
      textBlock.text = formattedText

      anthropicMessage.content = [textBlock]

      // Add attachment information if requested
      if (this.includeAttachments && archaiMessage.attachments && archaiMessage.attachments.length > 0) {
        // const attachmentInfo = archaiMessage.attachments
        //   .map(att => `[Attachment: ${att.filename} (${att.mime_type})]`)
        //   .join('\n')
        // text = text + (text ? '\n\n' : '') + attachmentInfo

        // For base64-encoded images with SSRF protection
        async function getBase64Image(url: string): Promise<string> {
          // URL validation and allowlist
          const parsedUrl = new URL(url)

          // Define allowed domains/hosts
          const allowedHosts = [
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
            // Add other trusted domains as needed
          ]

          // Check if the host is in the allowlist
          if (!allowedHosts.some(host => parsedUrl.hostname === host || parsedUrl.hostname.endsWith(`.${host}`))) {
            throw new Error(`Untrusted image host: ${parsedUrl.hostname}`)
          }

          // Ensure HTTPS only
          if (parsedUrl.protocol !== 'https:') {
            throw new Error('Only HTTPS URLs are allowed for images')
          }

          // Prevent localhost and private IP addresses
          const hostname = parsedUrl.hostname
          if (hostname === 'localhost'
            || hostname === '127.0.0.1'
            || hostname.startsWith('192.168.')
            || hostname.startsWith('10.')
            || hostname.startsWith('172.16.')
            || hostname.endsWith('.local')) {
            throw new Error('Internal/private addresses are not allowed')
          }

          // Size limit (10MB)
          const MAX_IMAGE_SIZE = 10 * 1024 * 1024

          const controller = new AbortController()
          const timeout = setTimeout(() => controller.abort(), 5000) // 5 second timeout

          try {
            const response = await fetch(url, {
              method: 'GET',
              headers: {
                'Content-Type': 'application/octet-stream',
              },
              signal: controller.signal,
            })

            clearTimeout(timeout)

            if (!response.ok) {
              throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`)
            }

            // Check content length
            const contentLength = response.headers.get('content-length')
            if (contentLength && Number.parseInt(contentLength) > MAX_IMAGE_SIZE) {
              throw new Error(`Image too large: ${contentLength} bytes exceeds ${MAX_IMAGE_SIZE} bytes`)
            }

            const buffer = await response.arrayBuffer()

            // Double-check size after download
            if (buffer.byteLength > MAX_IMAGE_SIZE) {
              throw new Error(`Image too large: ${buffer.byteLength} bytes exceeds ${MAX_IMAGE_SIZE} bytes`)
            }

            return Buffer.from(buffer).toString('base64')
          } catch (error) {
            clearTimeout(timeout)
            if (error instanceof Error && error.name === 'AbortError') {
              throw new Error('Image fetch timeout after 5 seconds')
            }
            throw error
          }
        }

        const supportedImageTypes = [
          'image/jpeg',
          'image/png',
          'image/gif',
          'image/webp',
        ]

        for (const attachment of archaiMessage.attachments) {
          // attachment.mime_type
          if (!supportedImageTypes.includes(attachment.mime_type)) {
            continue
          }

          try {
            const imageBlock = new ImageBlock()
            imageBlock.source.type = 'base64'
            imageBlock.source.media_type = attachment.mime_type
            imageBlock.source.data = await getBase64Image(attachment.url)

            // console.log(`[ArchAIToAntropicConverterNode] Successfully added image: ${attachment.filename} (${attachment.mime_type})`)

            anthropicMessage.content.push(imageBlock)
          } catch (error) {
            // Log error but continue processing other attachments
            console.error(`[ArchAIToAntropicConverterNode] Failed to fetch image ${attachment.filename} from ${attachment.url}:`, error instanceof Error ? error.message : error)
            // Optionally add a text block mentioning the failed attachment
            const errorBlock = new TextBlock()
            errorBlock.text = `\n[Failed to load image: ${attachment.filename}]`
            anthropicMessage.content.push(errorBlock)
          }
        }
      }

      if (this.messageIdToAnswer && archaiMessage.message_id === this.messageIdToAnswer) {
        // If this is the message we want to answer, store it separately
        messageToAnswer = anthropicMessage
      } else {
        this.anthropicMessages.push(anthropicMessage)
      }
    }

    // If we have a message to answer, add it at the end
    if (messageToAnswer) {
      this.anthropicMessages.push(messageToAnswer)
    }

    return {}
  }

  /**
   * Determine the role for a message based on the role assignment strategy
   */
  private determineMessageRole(archaiMessage: ArchAIMessage): 'user' | 'assistant' {
    if (archaiMessage.message_id === this.messageIdToAnswer) {
      // If this message is the one we want to answer, treat it as user
      return 'user'
    }

    if (this.assistantId) {
      if (
        archaiMessage.participant?.agent_id === this.assistantId
        || archaiMessage.participant?.participant_id === this.assistantId
      ) {
        // If the participant matches the assistant ID, treat it as an assistant message
        return 'assistant'
      } else {
        // If the participant does not match the assistant ID, treat it as a user message
        return 'user'
      }
    } else if (archaiMessage.participant?.is_agent) {
      // If participant is an agent and we don't have a specific assistant ID,
      // treat it as an assistant message
      return 'assistant'
    }

    return 'user'
  }

  /**
   * Format message text with optional prefix and attachment info
   */
  private formatMessageText(archaiMessage: ArchAIMessage): string {
    let text = archaiMessage.text || ''

    // Apply message prefix template
    if (this.messagePrefixTemplate) {
      const prefix = this.applyMessagePrefixTemplate(archaiMessage)
      text = prefix + text
    }

    return text.trim()
  }

  /**
   * Apply message prefix template
   */
  private applyMessagePrefixTemplate(archaiMessage: ArchAIMessage): string {
    let prefix = this.messagePrefixTemplate

    // Replace all available message field template variables
    const templateData: Record<string, any> = {
      // Core message fields
      message_id: archaiMessage.message_id,
      chat_id: archaiMessage.chat_id,
      text: archaiMessage.text,
      author_id: archaiMessage.author_id,
      type: archaiMessage.type,
      time: archaiMessage.time,
      timestamp: archaiMessage.time, // Alias for backward compatibility

      // Participant fields
      username: archaiMessage.participant?.username,
      first_name: archaiMessage.participant?.first_name,
      last_name: archaiMessage.participant?.last_name,
      participant_id: archaiMessage.participant?.participant_id,
      agent_id: archaiMessage.participant?.agent_id,
      is_agent: archaiMessage.participant?.is_agent,
      avatar: archaiMessage.participant?.avatar,
      participant_meta: archaiMessage.participant?.meta,

      // Message metadata
      finished: archaiMessage.finished,
      is_system: archaiMessage.is_system,
      need_answer: archaiMessage.need_answer,
      version: archaiMessage.version,
      reply_to: archaiMessage.reply_to,
      error: archaiMessage.error,
      meta: archaiMessage.meta,

      // Attachment count (useful for templates)
      attachment_count: archaiMessage.attachments?.length || 0,
    }

    // Replace template variables using regex for better performance
    prefix = prefix.replace(/\{(\w+)\}/g, (match, key) => {
      const value = templateData[key]
      return value !== undefined && value !== null ? String(value) : match
    })

    return prefix
  }

  /**
   * Check if message should be included based on filters
   */
  private shouldIncludeMessage(archaiMessage: ArchAIMessage): boolean {
    // Skip system messages if requested
    if (this.skipSystemMessages && archaiMessage.is_system) {
      return false
    }

    // Skip empty messages if requested
    if (this.skipEmptyMessages && (!archaiMessage.text || archaiMessage.text.trim() === '')) {
      return false
    }

    // Skip error messages by default
    if (archaiMessage.type === 'error' && archaiMessage.error) {
      return false
    }

    return true
  }
}

export default ArchAIMessagesToAnthropicConverterNode
