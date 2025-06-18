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
  PortObject,
  PortString,
} from '@badaitech/chaingraph-types'
import { NODE_CATEGORIES } from '../../../categories'
import { AntropicMessage, ToolResultBlock, ToolUseResponseBlock } from './types'

@Node({
  type: 'AntropicToolResultNode',
  title: 'Anthropic Tool Result',
  description: 'Creates a tool result message from a tool use',
  category: NODE_CATEGORIES.ANTHROPIC,
  tags: ['anthropic', 'tool', 'claude', 'function'],
})
class AntropicToolResultNode extends BaseNode {
  @Input()
  @PortObject({
    title: 'Tool Use',
    description: 'The tool use response from Claude',
    schema: ToolUseResponseBlock,
  })
  toolUse: ToolUseResponseBlock = new ToolUseResponseBlock()

  @Input()
  @PortString({
    title: 'Result Content',
    description: 'The result content from the tool execution',
    ui: {
      isTextArea: true,
    },
    required: true,
  })
  resultContent: string = ''

  @Output()
  @PortObject({
    title: 'Message',
    description: 'The tool result message to send back to Claude',
    schema: AntropicMessage,
  })
  message: AntropicMessage = new AntropicMessage()

  async execute(context: ExecutionContext): Promise<NodeExecutionResult> {
    // Create a tool result block
    const toolResultBlock = new ToolResultBlock()
    toolResultBlock.tool_use_id = this.toolUse.id
    toolResultBlock.content = this.resultContent

    // Create the message
    this.message = new AntropicMessage()
    this.message.role = 'user'
    this.message.content = [toolResultBlock]

    return {}
  }
}

export default AntropicToolResultNode
