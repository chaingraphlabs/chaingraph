/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { ExecutionContext, NodeExecutionResult } from '@badaitech/chaingraph-types'
import type { GeminiMessagePart } from '../ai/gemini/gemini-conversation-types'
import { Buffer } from 'node:buffer'
import {
  BaseNode,
  Input,
  Node,
  Output,
  PortArray,
} from '@badaitech/chaingraph-types'
import { NODE_CATEGORIES } from '../../categories'
import { GeminiMessagePart as GeminiMessagePartClass } from '../ai/gemini/gemini-conversation-types'
import { Attachment } from './types'

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
 * ArchAI Attachments to Gemini Parts Converter
 *
 * Standalone node for converting ArchAI attachments to Gemini message parts.
 * Useful for building custom message structures or processing attachments separately.
 */
@Node({
  type: 'ArchAIAttachmentsToGeminiPartsNode',
  title: 'ArchAI Attachments → Gemini Parts',
  description: `**Convert ArchAI attachments to Gemini message parts**

**Transforms:**
- Image attachments → \`inlineData\` parts (base64-encoded)
- Failed downloads → text placeholder parts
- Unsupported types → text warning parts

**Supported image formats:**
JPEG, PNG, GIF, WebP

**Chain output to:**
- Array Add node (to build parts array)
- Gemini Message Part (to create complete message)
- Gemini Multimodal Image (directly to previousMessages)

**Use cases:**
- Build custom Gemini messages from ArchAI data
- Process attachments independently from chat history
- Filter/transform attachments before sending to Gemini`,
  category: NODE_CATEGORIES.ARCHAI,
  tags: ['archai', 'gemini', 'converter', 'attachments', 'image', 'parts'],
})
export class ArchAIAttachmentsToGeminiPartsNode extends BaseNode {
  @Input()
  @PortArray({
    title: 'ArchAI Attachments',
    description: `**Array of ArchAI attachment objects to convert**

Each attachment should have:
- \`url\`: HTTPS URL to the attachment
- \`mime_type\`: Content type (e.g., "image/png")
- \`filename\`: Original filename

Only image attachments (JPEG, PNG, GIF, WebP) are converted to inlineData.
Other types become text warning parts.`,
    itemConfig: {
      type: 'object',
      schema: Attachment,
    },
    defaultValue: [],
    required: true,
  })
  attachments: Attachment[] = []

  @Output()
  @PortArray({
    title: 'Gemini Parts',
    description: `**Array of Gemini message parts**

Output format:
- Valid images → \`{ inlineData: { data: "base64...", mimeType: "image/png" } }\`
- Errors → \`{ text: "[Attachment unavailable: ...]" }\`
- Unsupported types → \`{ text: "[Attachment type not supported: ...]" }\`

Chain these parts to Gemini nodes for image generation/editing.`,
    itemConfig: {
      type: 'object',
      schema: GeminiMessagePartClass,
    },
    defaultValue: [],
  })
  parts: GeminiMessagePart[] = []

  async execute(context: ExecutionContext): Promise<NodeExecutionResult> {
    this.parts = []

    if (!this.attachments || this.attachments.length === 0) {
      return {}
    }

    for (const attachment of this.attachments) {
      // Skip non-image attachments (only images supported by Gemini image models)
      if (!SUPPORTED_IMAGE_TYPES.includes(attachment.mime_type)) {
        this.parts.push({
          text: `[Attachment type not supported: ${attachment.filename} (${attachment.mime_type}). Only image formats are supported: ${SUPPORTED_IMAGE_TYPES.join(', ')}]`,
        })
        continue
      }

      // Validate URL (SSRF protection)
      if (!this.isAllowedAttachmentHost(attachment.url)) {
        this.parts.push({
          text: `[Attachment host not allowed: ${attachment.filename}. Only trusted hosts are permitted for security.]`,
        })
        continue
      }

      try {
        const base64 = await this.fetchAttachmentAsBase64(attachment.url)
        this.parts.push({
          inlineData: {
            data: base64,
            mimeType: attachment.mime_type,
          },
        })
      } catch (error) {
        // Fallback to text placeholder so AI knows attachment existed but couldn't load
        const errorMsg = error instanceof Error ? error.message : 'Unknown error'
        this.parts.push({
          text: `[Attachment unavailable: ${attachment.filename} (${attachment.mime_type}) - ${errorMsg}]`,
        })
      }
    }

    return {}
  }

  // ============================================================================
  // Attachment Security & Fetching Helpers
  // ============================================================================

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

export default ArchAIAttachmentsToGeminiPartsNode
