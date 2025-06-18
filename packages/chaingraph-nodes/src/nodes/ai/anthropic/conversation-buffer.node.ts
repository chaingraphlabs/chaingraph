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
  PortBoolean,
  PortNumber,
  PortObject,
} from '@badaitech/chaingraph-types'
import { NODE_CATEGORIES } from '../../../categories'
import { AntropicMessage, AntropicResponseContent } from './types'

@Node({
  type: 'AntropicConversationBufferNode',
  title: 'Anthropic Conversation Buffer',
  description: 'Maintains conversation history across turns',
  category: NODE_CATEGORIES.ANTHROPIC,
  tags: ['anthropic', 'message', 'claude', 'conversation', 'memory'],
})
class AntropicConversationBufferNode extends BaseNode {
  @Input()
  @PortObject({
    title: 'New Message',
    description: 'New user message to add to the conversation',
    schema: AntropicMessage,
  })
  newMessage?: AntropicMessage = undefined

  @Input()
  @PortObject({
    title: 'Assistant Response',
    description: 'Response content from Claude to add to the conversation',
    schema: AntropicResponseContent,
  })
  assistantResponse?: AntropicResponseContent = undefined

  @Input()
  @PortNumber({
    title: 'Max History',
    description: 'Maximum number of messages to keep in the history (0 for unlimited)',
    min: 0,
    integer: true,
  })
  maxHistory: number = 10

  @Input()
  @PortBoolean({
    title: 'Reset',
    description: 'Clear the conversation history when true',
  })
  resetConversation: boolean = false

  @Output()
  @PortArray({
    title: 'Conversation',
    description: 'Complete conversation history',
    itemConfig: {
      type: 'object',
      schema: AntropicMessage,
    },
  })
  conversation: AntropicMessage[] = []

  // Internal state to store conversation history
  private history: AntropicMessage[] = []

  async execute(context: ExecutionContext): Promise<NodeExecutionResult> {
    // If reset is true, clear the history
    if (this.resetConversation) {
      this.history = []
    }

    // Add the new message if provided
    if (this.newMessage) {
      this.history.push(this.newMessage)
    }

    // Add the assistant response if provided
    if (this.assistantResponse) {
      // Convert the response content to an assistant message
      const assistantMessage = new AntropicMessage()
      assistantMessage.role = 'assistant'

      // Create a content array from text blocks
      assistantMessage.content = this.assistantResponse.textBlocks.map((block) => {
        // Clone the block for the message
        const clonedBlock = JSON.parse(JSON.stringify(block))
        return clonedBlock
      })

      // Add to history if there are text blocks
      if (assistantMessage.content.length > 0) {
        this.history.push(assistantMessage)
      }
    }

    // Trim history if needed
    if (this.maxHistory > 0 && this.history.length > this.maxHistory) {
      this.history = this.history.slice(this.history.length - this.maxHistory)
    }

    // Update the output conversation
    this.conversation = [...this.history]

    return {}
  }
}

export default AntropicConversationBufferNode
