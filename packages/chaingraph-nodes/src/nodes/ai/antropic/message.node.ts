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
  PortEnum,
  PortObject,
  String,
} from '@badaitech/chaingraph-types'
import { NODE_CATEGORIES } from '../../../categories'
import { AntropicMessage, TextBlock } from './types'

@Node({
  type: 'AntropicMessageNode',
  title: 'Anthropic Message',
  description: 'Creates a message for the Anthropic API',
  category: NODE_CATEGORIES.ANTHROPIC,
  tags: ['anthropic', 'message', 'claude'],
})
class AntropicMessageNode extends BaseNode {
  @Input()
  @PortEnum({
    title: 'Role',
    description: 'The role of the speaker for this message',
    options: [
      { id: 'user', type: 'string', defaultValue: 'user', title: 'User' },
      { id: 'assistant', type: 'string', defaultValue: 'assistant', title: 'Assistant' },
    ],
    defaultValue: 'user',
    required: true,
  })
  role: 'user' | 'assistant' = 'user'

  @Input()
  @String({
    title: 'Text',
    description: 'The text content of the message',
    ui: {
      isTextArea: true,
      textareaDimensions: { height: 150 },
    },
    required: true,
  })
  text: string = ''

  @Output()
  @PortObject({
    title: 'Message',
    description: 'The created Anthropic message',
    schema: AntropicMessage,
  })
  message: AntropicMessage = new AntropicMessage()

  async execute(context: ExecutionContext): Promise<NodeExecutionResult> {
    // Create a text block
    const textBlock = new TextBlock()
    textBlock.text = this.text

    // Create the message
    this.message = new AntropicMessage()
    this.message.role = this.role
    this.message.content = [textBlock]

    return {}
  }
}

export default AntropicMessageNode
