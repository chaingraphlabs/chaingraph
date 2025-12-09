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
import { GeminiMessagePart } from './gemini-conversation-types'

/**
 * Gemini Text Part Builder
 *
 * Simple node to create a text-only message part.
 * The most common part type for prompts and instructions.
 */
@Node({
  type: 'GeminiTextPartNode',
  title: 'Gemini Text Part',
  description: `**Build a text message part**

Simple text content for prompts, questions, or instructions.

**Workflow:**
1. Enter your text
2. Connect output to Array Add
3. Build parts array for Gemini Message`,
  category: NODE_CATEGORIES.GEMINI,
  tags: ['gemini', 'message', 'part', 'text', 'builder'],
})
export class GeminiTextPartNode extends BaseNode {
  @Passthrough()
  @PortString({
    title: 'Text',
    description: `**Your text content**

Enter prompts, questions, or instructions.`,
    required: true,
    ui: { isTextArea: true },
  })
  text: string = ''

  @Output()
  @PortObject({
    title: 'Part',
    description: `**Text part ready for use**

Connect to Array Add → Gemini Message.`,
    schema: GeminiMessagePart,
  })
  part: GeminiMessagePart = new GeminiMessagePart()

  async execute(context: ExecutionContext): Promise<NodeExecutionResult> {
    this.part = {
      text: this.text,
    }
    return {}
  }
}
