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
  Output,
  Passthrough,
  PortObject,
} from '@badaitech/chaingraph-types'
import { NODE_CATEGORIES } from '../../categories'
import { resolveAttachmentData } from './attachment-utils'
import { Attachment, AttachmentInput } from './types'

@Node({
  type: 'ArchAIUploadAttachmentNode',
  title: 'ArchAI Upload Attachment',
  description: 'Uploads a file to ArchAI. Accepts base64, data URI, or URL.',
  category: NODE_CATEGORIES.ARCHAI,
  tags: ['archai', 'attachment', 'file', 'upload'],
})
class ArchAIUploadAttachmentNode extends BaseNode {
  // === INPUT ===
  @Passthrough()
  @PortObject({
    schema: AttachmentInput,
    title: 'Attachment',
    description: 'File to upload (source + filename)',
    ui: {
      collapsed: true,
    },
  })
  attachment: AttachmentInput = new AttachmentInput()

  // === OUTPUT ===
  @Output()
  @PortObject({
    schema: Attachment,
    title: 'Attachment',
    description: 'Uploaded attachment with id, url, mime_type, filename',
    isSchemaMutable: false,
    ui: {
      hidePropertyEditor: true,
    },
  })
  result: Attachment = new Attachment()

  async execute(context: ExecutionContext): Promise<NodeExecutionResult> {
    // 1. Get ArchAI context
    const archAIContext = context.getIntegration<ArchAIContext>('archai')
    if (!archAIContext?.agentSession) {
      throw new Error('ArchAI agent session is not available in the context')
    }

    // 2. Validate input
    if (!this.attachment.source?.trim()) {
      throw new Error('Attachment source is required')
    }
    if (!this.attachment.filename?.trim()) {
      throw new Error('Attachment filename is required')
    }

    // 3. Resolve source to base64 (handles URL fetch, data URI parsing, etc.)
    const resolved = await resolveAttachmentData(this.attachment)

    // 4. Create GraphQL client and upload
    const graphQLClient = createGraphQLClient(
      process.env.BADAI_API_URL || 'http://localhost:9151/graphql',
    )

    const { uploadAttachment } = await graphQLClient.request(
      GraphQL.UploadAttachmentDocument,
      {
        session: archAIContext.agentSession,
        attachment: {
          blob: resolved.base64,
          filename: this.attachment.filename.trim(),
        },
      },
    )

    if (!uploadAttachment) {
      throw new Error('Failed to upload attachment')
    }

    // 5. Set output
    this.result = new Attachment()
    this.result.id = uploadAttachment.id
    this.result.url = uploadAttachment.url
    this.result.mime_type = uploadAttachment.mime_type
    this.result.filename = this.attachment.filename.trim()
    this.result.size = 0 // Size is not returned by the mutation

    return {}
  }
}

export default ArchAIUploadAttachmentNode
