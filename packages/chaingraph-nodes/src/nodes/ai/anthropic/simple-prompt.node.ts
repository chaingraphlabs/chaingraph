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
  PortString,
} from '@badaitech/chaingraph-types'
import { NODE_CATEGORIES } from '../../../categories'
import { AntropicMessage, TextBlock } from './types'

@Node({
  type: 'AntropicSimplePromptNode',
  title: 'Anthropic Simple Prompt',
  description: 'Creates a simple user message array from a prompt string',
  category: NODE_CATEGORIES.ANTHROPIC,
  tags: ['anthropic', 'message', 'prompt', 'simple'],
})
class AntropicSimplePromptNode extends BaseNode {
  @Input()
  @PortString({
    title: 'Prompt',
    description: 'The prompt text to send to Claude',
    ui: {
      isTextArea: true,
      textareaDimensions: { height: 200 },
    },
    required: true,
  })
  prompt: string = ''

  @Output()
  @PortArray({
    title: 'Messages',
    description: 'Array with a single user message',
    itemConfig: {
      type: 'object',
      schema: AntropicMessage,
    },
  })
  messages: AntropicMessage[] = []

  async execute(context: ExecutionContext): Promise<NodeExecutionResult> {
    // Create a text block
    const textBlock = new TextBlock()
    textBlock.text = this.prompt

    // Create a user message
    const message = new AntropicMessage()
    message.role = 'user'
    message.content = [textBlock]

    // Add to the messages array
    this.messages = [message]

    return {}
  }
}

export default AntropicSimplePromptNode
