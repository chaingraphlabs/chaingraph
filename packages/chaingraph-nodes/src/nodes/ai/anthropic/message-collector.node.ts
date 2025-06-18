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
} from '@badaitech/chaingraph-types'
import { NODE_CATEGORIES } from '../../../categories'
import { AntropicMessage } from './types'

@Node({
  type: 'AntropicMessageCollectorNode',
  title: 'Anthropic Message Collector',
  description: 'Collects multiple messages into an array for the Anthropic LLM Call',
  category: NODE_CATEGORIES.ANTHROPIC,
  tags: ['anthropic', 'message', 'claude', 'collector'],
})
class AntropicMessageCollectorNode extends BaseNode {
  // Define up to 10 input slots for messages
  @Input()
  @PortObject({
    title: 'Message 1',
    description: 'First message in the conversation',
    schema: AntropicMessage,
  })
  message1?: AntropicMessage = undefined

  @Input()
  @PortObject({
    title: 'Message 2',
    description: 'Second message in the conversation',
    schema: AntropicMessage,
  })
  message2?: AntropicMessage = undefined

  @Input()
  @PortObject({
    title: 'Message 3',
    description: 'Third message in the conversation',
    schema: AntropicMessage,
  })
  message3?: AntropicMessage = undefined

  @Input()
  @PortObject({
    title: 'Message 4',
    description: 'Fourth message in the conversation',
    schema: AntropicMessage,
  })
  message4?: AntropicMessage = undefined

  @Input()
  @PortObject({
    title: 'Message 5',
    description: 'Fifth message in the conversation',
    schema: AntropicMessage,
  })
  message5?: AntropicMessage = undefined

  @Input()
  @PortObject({
    title: 'Message 6',
    description: 'Sixth message in the conversation',
    schema: AntropicMessage,
  })
  message6?: AntropicMessage = undefined

  @Input()
  @PortObject({
    title: 'Message 7',
    description: 'Seventh message in the conversation',
    schema: AntropicMessage,
  })
  message7?: AntropicMessage = undefined

  @Input()
  @PortObject({
    title: 'Message 8',
    description: 'Eighth message in the conversation',
    schema: AntropicMessage,
  })
  message8?: AntropicMessage = undefined

  @Input()
  @PortObject({
    title: 'Message 9',
    description: 'Ninth message in the conversation',
    schema: AntropicMessage,
  })
  message9?: AntropicMessage = undefined

  @Input()
  @PortObject({
    title: 'Message 10',
    description: 'Tenth message in the conversation',
    schema: AntropicMessage,
  })
  message10?: AntropicMessage = undefined

  @Output()
  @PortArray({
    title: 'Messages',
    description: 'Collected messages in conversation order',
    itemConfig: {
      type: 'object',
      schema: AntropicMessage,
    },
  })
  messages: AntropicMessage[] = []

  async execute(context: ExecutionContext): Promise<NodeExecutionResult> {
    // Reset the messages array
    this.messages = []

    // Collect all connected messages in order
    const messageInputs = [
      this.message1,
      this.message2,
      this.message3,
      this.message4,
      this.message5,
      this.message6,
      this.message7,
      this.message8,
      this.message9,
      this.message10,
    ]

    // Add all defined messages to the output array
    for (const message of messageInputs) {
      if (message !== undefined) {
        this.messages.push(message)
      }
    }

    return {}
  }
}

export default AntropicMessageCollectorNode
