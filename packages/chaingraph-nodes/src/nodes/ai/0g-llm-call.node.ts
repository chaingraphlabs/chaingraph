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
import { SystemMessage } from '@langchain/core/messages'
import {ChatOpenAI, OpenAI} from '@langchain/openai'
import { NODE_CATEGORIES } from '../../categories'

export enum LLMModels {
  LLama = 'llama-3.3-70b-instruct',
  DeepSeek = 'deepseek-r1-70b',
}

export enum LLMModelsProviderAddress {
  LLama = '0xf07240Efa67755B5311bc75784a061eDB47165Dd',
  DeepSeek = '0x3feE5a4dd5FDb8a32dDA97Bed899830605dBD9D3',
}

@ObjectSchema({
  description: '0G LLM Model',
  category: 'LLM',
})
class OGLLMModel {
  @String({
    title: 'Model',
    description: 'Language Model',
  })
  public model: LLMModels = LLMModels.LLama

  @String({
    title: 'Model',
    description: 'Language Model',
  })
  public providerAddress: LLMModelsProviderAddress = LLMModelsProviderAddress.LLama

  @Number({
    title: 'Temperature',
    description: 'Temperature for sampling',
  })
  public temperature: number = 0

  constructor(model: LLMModels, providerAddress: LLMModelsProviderAddress, temperature: number) {
    this.model = model
    this.temperature = temperature
    this.providerAddress = providerAddress
  }
}

const llmModels = {
  [LLMModels.LLama]: new OGLLMModel(LLMModels.LLama, LLMModelsProviderAddress.LLama, 0),
  [LLMModels.DeepSeek]: new OGLLMModel(LLMModels.DeepSeek, LLMModelsProviderAddress.DeepSeek, 0),
}

@Node({
  title: '0G LLM Call',
  description: 'Sends prompt to Language Model on 0G network and streams response',
  category: NODE_CATEGORIES.AI,
  tags: ['ai', 'llm', 'prompt', 'gpt', '0g'],
})
class OGLLMCallNode extends BaseNode {
  @Input()
  @PortEnumFromObject(llmModels, {
    title: 'Model',
    description: 'Language Model',
  })
  model: keyof typeof llmModels = LLMModels.LLama

  @Input()
  @String({
    title: 'Private Key',
    description: '0G private key',
    ui: {
      isPassword: true,
    },
  })
  privateKey: string = ''

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
    const { createZGComputeNetworkBroker } = require('@0glabs/0g-serving-broker')
    const { ethers } = require('ethers')

    if (!this.privateKey) {
      throw new Error('API Key is required')
    }
    const provider = new ethers.JsonRpcProvider('https://evmrpc-testnet.0g.ai')
    const wallet = new ethers.Wallet(this.privateKey, provider)
    const broker = await createZGComputeNetworkBroker(wallet)

    const { endpoint, model } = await broker.inference.getServiceMetadata(
      llmModels[this.model].providerAddress,
    )
    const headers = await broker.inference.getRequestHeaders(llmModels[this.model].providerAddress, prompt)
    const llm = new ChatOpenAI({
      configuration: {
        baseURL: endpoint,
      },
      apiKey: '',
      model: this.model,
      temperature: this.temperature,
      streaming: true,
    })

    const messages = [
      new SystemMessage(this.prompt),
    ]

    // Start streaming in the background
    const streamingPromise = async () => {
      console.log('Streaming started')
      try {
        const stream = await llm.stream(messages, {
          signal: context.abortSignal,
        })

        const buffer: string[] = []
        const bufferSize = 5

        for await (const chunk of stream) {
          // Check if execution was aborted
          if (context.abortSignal.aborted) {
            this.outputStream.close()
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

export default OGLLMCallNode
