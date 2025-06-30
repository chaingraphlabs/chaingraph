/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { ExecutionContext, NodeExecutionResult } from '@badaitech/chaingraph-types'
import { Buffer } from 'node:buffer'
import {
  BaseNode,
  Input,
  Node,
  Output,
  PortArray,
  PortBoolean,
  PortEnum,
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
  type: 'ArchAIToAntropicConverterNode',
  title: 'ArchAI to Anthropic Converter',
  description: 'Converts ArchAI chat history messages to Anthropic message format',
  category: NODE_CATEGORIES.ARCHAI,
  tags: ['anthropic', 'archai', 'converter', 'message', 'history', 'claude'],
  ui: {
    state: {
      isHidden: true,
    }, // Hide from the UI by default
  },
})
// @deprecated
class ArchAIToAntropicConverterNode extends BaseNode {
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
  @PortEnum({
    title: 'Role Assignment',
    description: 'How to assign roles (user/assistant) to messages',
    options: [
      { id: RoleAssignment.AUTO, type: 'string', defaultValue: RoleAssignment.AUTO, title: 'Auto (by participant type)' },
      { id: RoleAssignment.BY_PARTICIPANT, type: 'string', defaultValue: RoleAssignment.BY_PARTICIPANT, title: 'By Participant (agent=assistant)' },
      { id: RoleAssignment.ALL_USER, type: 'string', defaultValue: RoleAssignment.ALL_USER, title: 'All User' },
      { id: RoleAssignment.ALL_ASSISTANT, type: 'string', defaultValue: RoleAssignment.ALL_ASSISTANT, title: 'All Assistant' },
    ],
    defaultValue: RoleAssignment.AUTO,
  })
  roleAssignment: RoleAssignment = RoleAssignment.AUTO

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
    description: 'Template for message prefix (use {username}, {timestamp}, {type})',
    defaultValue: '',
    ui: {
      placeholder: 'e.g., [{username} at {timestamp}]: ',
    },
  })
  messagePrefixTemplate: string = '[@{username} at {timestamp}]:'

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

    for (const archaiMessage of this.archaiMessages) {
      if (!this.shouldIncludeMessage(archaiMessage)) {
        continue
      }

      // Determine the role
      const role = this.determineMessageRole(archaiMessage)

      // Format the message text
      const formattedText = this.formatMessageText(archaiMessage)

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

        // For base64-encoded images
        async function getBase64Image(url: string): Promise<string> {
          const response = await fetch(url, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/octet-stream',
            },
          })

          const buffer = await response.arrayBuffer()
          return Buffer.from(buffer).toString('base64')
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

          const imageBlock = new ImageBlock()
          imageBlock.source.type = 'base64'
          imageBlock.source.media_type = attachment.mime_type
          imageBlock.source.data = await getBase64Image(attachment.url)

          console.log(`[ArchAIToAntropicConverterNode] Adding image block: ${attachment.filename} (${attachment.mime_type}) - ${attachment.url}`)

          anthropicMessage.content.push(imageBlock)
        }
      }

      this.anthropicMessages.push(anthropicMessage)
    }

    return {}
  }

  /**
   * Determine the role for a message based on the role assignment strategy
   */
  private determineMessageRole(archaiMessage: ArchAIMessage): 'user' | 'assistant' {
    switch (this.roleAssignment) {
      case RoleAssignment.ALL_USER:
        return 'user'

      case RoleAssignment.ALL_ASSISTANT:
        return 'assistant'

      case RoleAssignment.BY_PARTICIPANT:
        return archaiMessage.participant?.is_agent ? 'assistant' : 'user'

      case RoleAssignment.AUTO:
      default:
        // Auto logic: consider agents, system messages, and special types as assistant
        if (archaiMessage.participant?.is_agent) {
          return 'assistant'
        }
        if (archaiMessage.type === 'system' || archaiMessage.type === 'thoughts') {
          return 'assistant'
        }
        return 'user'
    }
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

    // Replace template variables
    prefix = prefix.replace('{username}', archaiMessage.participant?.username || 'Unknown')
    prefix = prefix.replace('{timestamp}', archaiMessage.time || '')
    prefix = prefix.replace('{type}', archaiMessage.type || 'common')

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

export default ArchAIToAntropicConverterNode
