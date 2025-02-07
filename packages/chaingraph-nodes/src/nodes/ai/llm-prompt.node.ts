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
import { BaseNode, Input, Node, NodeExecutionStatus, Output, Port, String } from '@badaitech/chaingraph-types'
import { HumanMessage, SystemMessage } from '@langchain/core/messages'
import { ChatOpenAI } from '@langchain/openai'
import { NODE_CATEGORIES } from '../../categories'

@Node({
  title: 'LLM Prompt',
  description: 'Sends prompt to Language Model and returns response',
  category: NODE_CATEGORIES.AI,
  tags: ['ai', 'llm', 'prompt', 'gpt'],
})
export class LLMPromptNode extends BaseNode {
  @Input()
  @String({
    title: 'Prompt',
    description: 'Input prompt for the language model',
  })
  prompt: string = ''

  @Output()
  // @PortString({
  //   title: 'Response',
  //   description: 'Language model response',
  // })
  @Port({
    type: 'string',
  })
  response: string = ''

  async execute(context: ExecutionContext): Promise<NodeExecutionResult> {
    // Mock implementation

    const llm = new ChatOpenAI({
      model: 'gpt-4o-mini',
      temperature: 0,
    })

    const messages = [
      new SystemMessage('Translate the following from English into Italian'),
      new HumanMessage(this.prompt),
    ]

    const result = await llm.invoke(messages)

    this.response = result.content.toString()

    return {
      status: NodeExecutionStatus.Completed,
      startTime: context.startTime,
      endTime: new Date(),
      outputs: new Map([['response', this.response]]),
    }
  }
}
