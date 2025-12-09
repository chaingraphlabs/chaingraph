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
  Input,
  Node,
  Output,
  PortArray,
  PortObject,
  PortString,
} from '@badaitech/chaingraph-types'
import { NODE_CATEGORIES } from '../../../categories'
import { ConversationMessage, GeminiMessagePart } from './gemini-conversation-types'

/**
 * Gemini Message Builder Node
 *
 * Builds a single ConversationMessage with role and parts.
 * Used to construct conversation history visually in flows.
 *
 * WORKFLOW:
 * 1. Set role (user or model)
 * 2. Add parts using Array Add node (text, images, files, code, etc.)
 * 3. Output message to Array Add → build conversation history
 */
@Node({
  type: 'GeminiMessageNode',
  title: 'Gemini Message',
  description: `**Build a Gemini conversation message**

Construct a message with role and multimodal parts.

**Use for:**
- Building static conversation history
- Creating user/model messages manually
- Combining with Array Add to build message arrays

**Role:**
- \`user\` — User input message
- \`model\` — Model response message

**Parts:**
Add parts using Array Add node (text, images, files, tools, code).`,
  category: NODE_CATEGORIES.GEMINI,
  tags: ['gemini', 'message', 'conversation', 'builder', 'helper'],
})
export class GeminiMessageNode extends BaseNode {
  @Input()
  @PortString({
    title: 'Role',
    description: `**Message sender**

- \`user\` — User/human message
- \`model\` — AI assistant response

Note: Gemini uses "model" instead of "assistant"`,
    defaultValue: 'user',
  })
  role: 'user' | 'model' = 'user'

  @Input()
  @PortArray({
    title: 'Parts',
    description: `**Message content parts**

Add parts using Array Add node:
- Text parts
- Inline data (base64 images)
- File data (URLs, GCS, YouTube)
- Function calls/responses
- Executable code/results

Leave empty for empty message (will be ignored by API).`,
    itemConfig: {
      type: 'object',
      schema: GeminiMessagePart,
    },
    isMutable: true,
    defaultValue: [],
  })
  parts: GeminiMessagePart[] = []

  @Output()
  @PortObject({
    title: 'Message',
    description: `**Built conversation message**

Use with Array Add to build conversation history:
- Connect to Gemini Multimodal Call's "Previous Messages"
- Connect to Gemini Multimodal Image's "Previous Messages"
- Chain multiple messages for multi-turn conversations`,
    schema: ConversationMessage,
  })
  message: ConversationMessage = new ConversationMessage()

  async execute(context: ExecutionContext): Promise<NodeExecutionResult> {
    this.message = {
      role: this.role as 'user' | 'model',
      parts: this.parts,
    }
    return {}
  }
}
