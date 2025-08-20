/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type {
  EncryptedSecretValue,
  ExecutionContext,
  NodeExecutionResult,
  SecretTypeMap,
} from '@badaitech/chaingraph-types'
import type { ChatOpenAIFields } from '@langchain/openai'

import {
  PortObject,
  PortVisibility,
} from '@badaitech/chaingraph-types'
import {
  BaseNode,
  Input,
  MultiChannel,
  Node,
  ObjectSchema,
  Output,
  PortEnumFromObject,
  PortNumber,
  PortSecret,
  PortStream,
  PortString,
} from '@badaitech/chaingraph-types'
import { ChatAnthropic } from '@langchain/anthropic'
import { HumanMessage } from '@langchain/core/messages'
import { ChatDeepSeek } from '@langchain/deepseek'
import { ChatOpenAI } from '@langchain/openai'
import { NODE_CATEGORIES } from '../../categories'

export enum LLMModels {
  // gpt-5 family
  Gpt5 = 'gpt-5',
  Gpt5Mini = 'gpt-5-mini',
  Gpt5Nano = 'gpt-5-nano',

  // GPT-4.1 Family
  Gpt41 = 'gpt-4.1',
  Gpt41Mini = 'gpt-4.1-mini',
  Gpt41Nano = 'gpt-4.1-nano',

  // GPT-4o Family
  Gpt4oMini = 'gpt-4o-mini',
  Gpt4o = 'gpt-4o',

  // O-Series Reasoning Models
  O1 = 'o1',
  O1Mini = 'o1-mini',
  O3 = 'o3',
  GptO3Mini = 'o3-mini',
  O3Pro = 'o3-pro',
  O4Mini = 'o4-mini',

  // Claude Models
  ClaudeSonnet4_20250514 = 'claude-sonnet-4-20250514',
  ClaudeOpus4_20250514 = 'claude-opus-4-20250514',
  Claude37Sonnet20250219 = 'claude-3-7-sonnet-20250219',
  Claude35Sonnet20241022 = 'claude-3-5-sonnet-20241022',

  // Deepseek Models
  DeepseekChat = 'deepseek-chat',
  DeepseekReasoner = 'deepseek-reasoner',

  // Groq Models
  GroqMetaLlamaLlama4Scout17b16eInstruct = 'groq/meta-llama/llama-4-scout-17b-16e-instruct',

  // Moonshot Models
  MoonshotV1128K = 'moonshot-v1-128k',
}

@ObjectSchema({
  description: 'LLM Model',
  category: 'LLM',
})
class LLMModel {
  @PortString({
    title: 'Model',
    description: 'Language Model',
  })
  model: LLMModels = LLMModels.Gpt5Mini

  @PortNumber({
    title: 'Temperature',
    description: 'Temperature for sampling',
  })
  temperature: number = 0

  constructor(model: LLMModels, temperature: number) {
    this.model = model
    this.temperature = temperature
  }
}

export const llmModels = Object.fromEntries(
  Object.entries(LLMModels).map(
    ([, m]) => [m, new LLMModel(m, 0)],
  ),
)

type ReasoningEffort = 'minimal' | 'low' | 'medium' | 'high' | null | 'disable'

@ObjectSchema({
  description: 'OpenAI Reasoning Configuration',
})
class OpenAIReasoning {
  @PortEnumFromObject({
    disable: 'disable',
    minimal: 'minimal',
    low: 'low',
    medium: 'medium',
    high: 'high',
  }, {
    title: 'Reasoning Effort',
    description: 'Constrain effort on reasoning for reasoning models. Reducing reasoning effort can result in faster responses and fewer tokens used on reasoning in a response.',
  })
  effort?: ReasoningEffort | null = null

  @PortEnumFromObject({
    auto: 'auto',
    concise: 'concise',
    detailed: 'detailed',
  }, {
    title: 'Summary',
    description: 'A summary of the reasoning performed by the model. This can be useful for debugging and understanding the model\'s reasoning process.',
  })
  summary?: 'auto' | 'concise' | 'detailed' | null = null
}

@Node({
  type: 'LLMCallNode',
  title: 'LLM Call',
  description: 'Sends prompt to Language Model and streams response',
  category: NODE_CATEGORIES.AI,
  tags: ['ai', 'llm', 'prompt', 'gpt'],
})
export class LLMCallNode extends BaseNode {
  @Input()
  @PortEnumFromObject(llmModels, {
    title: 'Model',
    description: 'Language Model',
  })
  model: LLMModels = LLMModels.Gpt5Mini

  @Input()
  @PortObject({
    title: 'OpenAI Reasoning',
    description: 'Configuration for OpenAI reasoning models',
    schema: OpenAIReasoning,
  })
  @PortVisibility({
    showIf: (node) => {
      const model = (node as LLMCallNode).model
      return model && isOpenAIThinkingModel(model)
    },
  })
  openaiReasoning?: OpenAIReasoning

  @Input()
  @PortSecret<SupportedProviders>({
    title: 'API Key',
    description: 'LLM provider API Key',
    secretType: 'openai',
    ui: {
      ispassword: true,
    },
  })
  apiKey?: EncryptedSecretValue<SupportedProviders>

  @Input()
  @PortString({
    title: 'Prompt',
    description: 'Input prompt for the language model',
    ui: {
      isTextArea: true,
    },
  })
  prompt: string = ''

  @Input()
  @PortNumber({
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

    const { apiKey } = await this.apiKey.decrypt(context)

    let llm: ChatDeepSeek | ChatOpenAI | ChatAnthropic

    if (isDeepSeek(this.model)) {
      llm = new ChatDeepSeek({
        apiKey,
        model: this.model,
        // temperature: this.temperature,
        streaming: true,
      })
    } else if (isAnthropic(this.model)) {
      llm = new ChatAnthropic({
        apiKey,
        model: this.model,
        temperature: this.temperature,
        streaming: true,
        thinking: {
          type: 'disabled',
        },
      })
    } else if (isGroq(this.model)) {
      llm = new ChatOpenAI({
        apiKey,
        model: this.model.replace(/^groq\//, ''),
        temperature: this.temperature,
        streaming: true,
        configuration: {
          baseURL: 'https://api.groq.com/openai/v1',
        },
      })
    } else if (isMoonshot(this.model)) {
      llm = new ChatOpenAI({
        apiKey,
        model: this.model,
        temperature: this.temperature,
        streaming: true,
        configuration: {
          baseURL: 'https://api.moonshot.ai/v1',
        },
      })
    } else {
      const isThinkingModel = isOpenAIThinkingModel(this.model)

      const config: ChatOpenAIFields = {
        apiKey,
        model: this.model,
        temperature: !isThinkingModel ? this.temperature : undefined,
        streaming: true,
        // reasoning: {
        //   effort: 'high',
        // },
      }

      if (isThinkingModel && this.openaiReasoning) {
        if (this.openaiReasoning.effort && this.openaiReasoning.effort !== 'disable') {
          config.reasoning = {
            effort: this.openaiReasoning.effort,
            summary: this.openaiReasoning.summary || 'auto',
          }
        }
      }

      llm = new ChatOpenAI(config)
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

/**
 * Type alias for supported provider names used in the system.
 */
export type SupportedProviders = 'openai' | 'anthropic' | 'deepseek' | 'groq' | 'moonshot'

/**
 * Represents an API key type that maps to a secret type defined for supported providers.
 */
export type APIkey = SecretTypeMap[SupportedProviders]['apiKey']

/**
 * Determines whether the given model belongs to the DeepSeek category of models.
 */
export function isDeepSeek(model: LLMModels): boolean {
  return [
    LLMModels.DeepseekReasoner,
    LLMModels.DeepseekChat,
  ].includes(model)
}

/**
 * Determines whether the given model belongs to the Anthropic category of models.
 */
export function isAnthropic(model: LLMModels): boolean {
  return [
    LLMModels.Claude35Sonnet20241022,
    LLMModels.Claude37Sonnet20250219,
    LLMModels.ClaudeSonnet4_20250514,
  ].includes(model)
}

/**
 * Determines whether the given model belongs to the Groq category of models.
 */
export function isGroq(model: LLMModels): boolean {
  return model === LLMModels.GroqMetaLlamaLlama4Scout17b16eInstruct
}

/**
 * Determines if the given model is one of the Moonshot models.
 */
export function isMoonshot(model: LLMModels): boolean {
  return model === LLMModels.MoonshotV1128K
}

/**
 * Determines whether the given model belongs to the OpenAI category of models.
 */
export function isOpenAI(model: LLMModels): boolean {
  return [
    // gpt-5 family
    LLMModels.Gpt5,
    LLMModels.Gpt5Mini,
    LLMModels.Gpt5Nano,

    // GPT-4.1 Family
    LLMModels.Gpt41,
    LLMModels.Gpt41Mini,
    LLMModels.Gpt41Nano,
    // GPT-4o Family
    LLMModels.Gpt4oMini,
    LLMModels.Gpt4o,
    // O-Series Reasoning Models
    LLMModels.O1,
    LLMModels.O1Mini,
    LLMModels.O3,
    LLMModels.GptO3Mini,
    LLMModels.O3Pro,
    LLMModels.O4Mini,
  ].includes(model)
}

/**
 * Determines whether the given model is an OpenAI thinking/reasoning model (O-series).
 */
export function isOpenAIThinkingModel(model: LLMModels): boolean {
  return [
    LLMModels.Gpt5,
    LLMModels.Gpt5Mini,
    LLMModels.Gpt5Nano,
    LLMModels.O1,
    LLMModels.O1Mini,
    LLMModels.O3,
    LLMModels.GptO3Mini,
    LLMModels.O3Pro,
    LLMModels.O4Mini,
  ].includes(model)
}
