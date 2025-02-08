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
  NodeExecutionStatus,
  Number,
  ObjectSchema,
  Output,
  Port,
  PortEnumFromObject,
  String,
} from '@badaitech/chaingraph-types'
import { HumanMessage, SystemMessage } from '@langchain/core/messages'
import { ChatOpenAI } from '@langchain/openai'
import { NODE_CATEGORIES } from '../../categories'

enum LLMModels {
  Gpt4oMini = 'gpt-4o-mini',
  Gpt4o = 'gpt-4o',
  GptO3Mini = 'o3-mini',
  Claude35Sonnet20241022 = 'claude-3-5-sonnet-20241022',
}

@ObjectSchema({
  description: 'LLM Model',
  category: 'LLM',
})
class LLMModel {
  @String({
    title: 'Model',
    description: 'Language Model',
  })
  model: LLMModels = LLMModels.Gpt4oMini

  @Number({
    title: 'Temperature',
    description: 'Temperature for sampling',
  })
  temperature: number = 0

  constructor(model: LLMModels, temperature: number) {
    this.model = model
    this.temperature = temperature
  }
}

const llmModels = {
  [LLMModels.Gpt4oMini]: new LLMModel(LLMModels.Gpt4oMini, 0),
  [LLMModels.Gpt4o]: new LLMModel(LLMModels.Gpt4o, 0),
  [LLMModels.GptO3Mini]: new LLMModel(LLMModels.GptO3Mini, 0),
  [LLMModels.Claude35Sonnet20241022]: new LLMModel(LLMModels.Claude35Sonnet20241022, 0),
}

@Node({
  title: 'LLM Prompt',
  description: 'Sends prompt to Language Model and returns response',
  category: NODE_CATEGORIES.AI,
  tags: ['ai', 'llm', 'prompt', 'gpt'],
})
export class LLMPromptNode extends BaseNode {
  @Input()
  @PortEnumFromObject(llmModels, {
    title: 'Model',
    description: 'Language Model',
  })
  model: keyof typeof llmModels = LLMModels.Gpt4oMini

  @Input()
  @String({
    title: 'API Key',
    description: 'LLM provider API Key',
    ui: {
      isPassword: true,
    },
  })
  apiKey: string = ''

  @Input()
  @String({
    title: 'Prompt',
    description: 'Input prompt for the language model',
    ui: {
      isTextArea: true,
    },
  })
  prompt: string = ''

  @Output()
  @Port({
    title: 'LLM Response',
    description: 'Response from the Language Model',
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
