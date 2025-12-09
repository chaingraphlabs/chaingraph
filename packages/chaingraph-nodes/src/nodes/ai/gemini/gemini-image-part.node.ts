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
import {
  detectMimeType,
  detectSourceType,
  GeminiMessagePart,
  parseDataUri,
} from './gemini-conversation-types'

/**
 * Gemini Image Part Builder
 *
 * Creates an image message part from base64 data or data URI.
 * For vision tasks and image analysis.
 *
 * NOTE: For URLs/YouTube, use Gemini File Part instead.
 */
@Node({
  type: 'GeminiImagePartNode',
  title: 'Gemini Image Part',
  description: `**Build an image message part**

For vision tasks and image analysis.

**Accepts:**
- Base64-encoded image data
- Data URI (\`data:image/png;base64,...\`)

**For URLs or YouTube:** Use **Gemini File Part** instead.

**Workflow:**
1. Provide image data
2. Connect output to Array Add
3. Build parts array for Gemini Message`,
  category: NODE_CATEGORIES.GEMINI,
  tags: ['gemini', 'message', 'part', 'image', 'vision', 'builder'],
})
export class GeminiImagePartNode extends BaseNode {
  @Passthrough()
  @PortString({
    title: 'Image Data',
    description: `**Base64 image or data URI**

Accepts:
- Raw base64: \`iVBORw0KGgo...\`
- Data URI: \`data:image/png;base64,...\`

Chain from image generation nodes or paste directly.`,
    required: true,
    ui: { isTextArea: true },
  })
  data: string = ''

  @Passthrough()
  @PortString({
    title: 'MIME Type',
    description: `**Image format (auto-detected)**

Common values:
- \`image/png\`
- \`image/jpeg\`
- \`image/webp\`

Leave empty for auto-detection.`,
    defaultValue: '',
  })
  mimeType: string = ''

  @Output()
  @PortObject({
    title: 'Part',
    description: `**Image part ready for use**

Connect to Array Add → Gemini Message.`,
    schema: GeminiMessagePart,
  })
  part: GeminiMessagePart = new GeminiMessagePart()

  async execute(context: ExecutionContext): Promise<NodeExecutionResult> {
    if (!this.data || this.data.trim().length === 0) {
      throw new Error('Image data is required')
    }

    let base64Data = this.data.trim()
    let resolvedMimeType = this.mimeType

    // Handle data URI format
    const sourceType = detectSourceType(base64Data)
    if (sourceType === 'dataUri') {
      const parsed = parseDataUri(base64Data)
      base64Data = parsed.base64
      if (!resolvedMimeType) {
        resolvedMimeType = parsed.mimeType
      }
    } else if (sourceType === 'url') {
      throw new Error('URLs are not supported. Use Gemini File Part for URLs.')
    }

    // Auto-detect MIME type if not provided
    if (!resolvedMimeType) {
      resolvedMimeType = detectMimeType(base64Data)
    }

    this.part = {
      inlineData: {
        data: base64Data,
        mimeType: resolvedMimeType,
      },
    }
    return {}
  }
}
