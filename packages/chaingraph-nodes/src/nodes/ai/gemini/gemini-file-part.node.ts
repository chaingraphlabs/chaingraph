/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type {
  ExecutionContext,
  NodeExecutionResult,
} from '@badaitech/chaingraph-types'
import {
  BaseNode,
  Node,
  Output,
  Passthrough,
  PortObject,
  PortString,
} from '@badaitech/chaingraph-types'
import { NODE_CATEGORIES } from '../../../categories'
import { GeminiMessagePart, VideoMetadataConfig } from './gemini-conversation-types'

/**
 * Gemini File Part Builder
 *
 * Creates a file reference message part for URLs, GCS URIs, or YouTube.
 * Gemini fetches the content directly - no base64 encoding needed.
 */
@Node({
  type: 'GeminiFilePartNode',
  title: 'Gemini File Part',
  description: `**Build a file reference part**

For external content that Gemini fetches directly:
- **URLs**: Images, PDFs, documents
- **YouTube**: Video analysis
- **GCS**: \`gs://bucket/file\`

**For base64 images:** Use **Gemini Image Part** instead.

**Workflow:**
1. Provide file URI
2. Connect output to Array Add
3. Build parts array for Gemini Message`,
  category: NODE_CATEGORIES.GEMINI,
  tags: ['gemini', 'message', 'part', 'file', 'url', 'youtube', 'builder'],
})
export class GeminiFilePartNode extends BaseNode {
  @Passthrough()
  @PortString({
    title: 'File URI',
    description: `**URL or file reference**

Accepts:
- \`https://example.com/image.jpg\`
- \`https://youtube.com/watch?v=...\`
- \`gs://bucket/file.pdf\``,
    required: true,
    ui: { placeholder: 'https://...' },
  })
  fileUri: string = ''

  @Passthrough()
  @PortString({
    title: 'MIME Type',
    description: `**File type (optional)**

Usually auto-detected. Specify for ambiguous files:
- \`video/mp4\`
- \`application/pdf\`
- \`image/jpeg\``,
    defaultValue: '',
  })
  mimeType: string = ''

  @Passthrough()
  @PortObject({
    title: 'Video Metadata',
    description: `**Video sampling options (optional)**

For video files only:
- FPS for frame sampling
- Start/end time offsets`,
    schema: VideoMetadataConfig,
    ui: { collapsed: true },
  })
  videoMetadata?: VideoMetadataConfig

  @Output()
  @PortObject({
    title: 'Part',
    description: `**File part ready for use**

Connect to Array Add → Gemini Message.`,
    schema: GeminiMessagePart,
  })
  part: GeminiMessagePart = new GeminiMessagePart()

  async execute(context: ExecutionContext): Promise<NodeExecutionResult> {
    if (!this.fileUri || this.fileUri.trim().length === 0) {
      throw new Error('File URI is required')
    }

    const part: GeminiMessagePart = {
      fileData: {
        fileUri: this.fileUri.trim(),
        mimeType: this.mimeType || undefined,
      },
    }

    // Add video metadata if provided
    if (this.videoMetadata && (this.videoMetadata.fps || this.videoMetadata.startOffset || this.videoMetadata.endOffset)) {
      part.videoMetadata = this.videoMetadata
    }

    this.part = part
    return {}
  }
}
