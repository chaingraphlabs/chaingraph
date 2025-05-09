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
  MultiChannel,
  Node,
  Number,
  ObjectSchema,
  Output,
  PortEnumFromObject,
  PortStream,
  String,
} from '@badaitech/chaingraph-types'
import { ChatAnthropic } from '@langchain/anthropic'
import { HumanMessage } from '@langchain/core/messages'
import { ChatDeepSeek } from '@langchain/deepseek'
import { ChatOpenAI } from '@langchain/openai'
import { NODE_CATEGORIES } from '../../categories'

export enum LLMModels {
  Gpt4oMini = 'gpt-4o-mini',
  Gpt4o = 'gpt-4o',
  GptO3Mini = 'o3-mini',
  Claude37Sonnet20250219 = 'claude-3-7-sonnet-20250219',
  Claude35Sonnet20241022 = 'claude-3-5-sonnet-20241022',
  DeepseekChat = 'deepseek-chat',
  DeepseekReasoner = 'deepseek-reasoner',
  GroqMetaLlamaLlama4Scout17b16eInstruct = 'groq/meta-llama/llama-4-scout-17b-16e-instruct',
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

export const llmModels = {
  [LLMModels.Gpt4oMini]: new LLMModel(LLMModels.Gpt4oMini, 0),
  [LLMModels.Gpt4o]: new LLMModel(LLMModels.Gpt4o, 0),
  [LLMModels.GptO3Mini]: new LLMModel(LLMModels.GptO3Mini, 0),
  [LLMModels.Claude37Sonnet20250219]: new LLMModel(LLMModels.Claude37Sonnet20250219, 0),
  [LLMModels.Claude35Sonnet20241022]: new LLMModel(LLMModels.Claude35Sonnet20241022, 0),
  [LLMModels.DeepseekChat]: new LLMModel(LLMModels.DeepseekChat, 0),
  [LLMModels.DeepseekReasoner]: new LLMModel(LLMModels.DeepseekReasoner, 0),
  [LLMModels.GroqMetaLlamaLlama4Scout17b16eInstruct]: new LLMModel(LLMModels.GroqMetaLlamaLlama4Scout17b16eInstruct, 0),
}

@Node({
  type: 'LLMCallNode',
  title: 'LLM Call',
  description: 'Sends prompt to Language Model and streams response',
  category: NODE_CATEGORIES.AI,
  tags: ['ai', 'llm', 'prompt', 'gpt'],
})
class LLMCallNode extends BaseNode {
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

  @Input()
  @Number({
    title: 'Temperature',
    description: 'Temperature for sampling',
    min: 0,
    max: 1,
    step: 0.01,
    ui: {
      isSlider: true,
      leftSliderLabel: 'More deterministic',
      rightSliderLabel: 'More creative',
    },
  })
  temperature: number = 0

  @Output()
  @PortStream({
    title: 'Output Stream',
    description: 'Output stream of the Language Model response',
    itemConfig: {
      type: 'string',
      defaultValue: '',
    },
  })
  outputStream: MultiChannel<string> = new MultiChannel<string>()

  async execute(context: ExecutionContext): Promise<NodeExecutionResult> {
    if (!this.apiKey) {
      throw new Error('API Key is required')
    }
    let llm: ChatDeepSeek | ChatOpenAI | ChatAnthropic

    if (this.model === LLMModels.DeepseekReasoner || this.model === LLMModels.DeepseekChat) {
      llm = new ChatDeepSeek({
        apiKey: this.apiKey,
        model: this.model,
        // temperature: this.temperature,
        streaming: true,
      })
    } else if (this.model === LLMModels.Claude35Sonnet20241022 || this.model === LLMModels.Claude37Sonnet20250219) {
      llm = new ChatAnthropic({
        apiKey: this.apiKey,
        model: this.model,
        temperature: this.temperature,
        streaming: true,
      })
    } else if (this.model === LLMModels.GroqMetaLlamaLlama4Scout17b16eInstruct) {
      llm = new ChatOpenAI({
        apiKey: this.apiKey,
        model: this.model.replace(/^groq\//, ''),
        temperature: this.temperature,
        streaming: true,
        configuration: {
          baseURL: 'https://api.groq.com/openai/v1',
        },
      })
    } else {
      llm = new ChatOpenAI({
        apiKey: this.apiKey,
        model: this.model,
        temperature: this.model !== LLMModels.GptO3Mini ? this.temperature : undefined,
        streaming: true,
      })
    }

    const messages = [
      // new SystemMessage(this.prompt),
      new HumanMessage(this.prompt),
    ]

    const stream = await llm.stream(messages, {
      signal: context.abortSignal,
    })

    // Start streaming in the background
    const streamingPromise = async () => {
      try {
        const buffer: string[] = []
        const bufferSize = 1 // TODO: consider if we really need this buffer

        for await (const chunk of stream) {
          // Check if execution was aborted
          if (context.abortSignal.aborted) {
            this.outputStream.close()
            this.outputStream.setError(new Error(`stream aborted`))
            return
          }

          // add chunk to buffer
          if (chunk.content) {
            buffer.push(chunk.content.toString())
          }

          if (buffer.length > bufferSize) {
            // Send chunk content to the output stream
            this.outputStream.send(buffer.join(''))

            // Clear buffer
            buffer.splice(0, buffer.length)
          }
        }

        // Send remaining content
        if (buffer.length > 0) {
          this.outputStream.send(buffer.join(''))
        }
      } catch (error: any) {
        this.outputStream.setError(new Error(error))
        throw error
      } finally {
        // Close the stream in any case
        this.outputStream.close()
      }
    }

    return {
      backgroundActions: [streamingPromise],
    }
  }
}

export default LLMCallNode
