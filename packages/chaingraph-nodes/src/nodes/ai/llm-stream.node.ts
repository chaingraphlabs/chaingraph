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
  MultiChannel,
  Node,
  NodeExecutionStatus,
  Output,
  PortStream,
  String,
} from '@badaitech/chaingraph-types'
import { HumanMessage, SystemMessage } from '@langchain/core/messages'
import { ChatOpenAI } from '@langchain/openai'
import { NODE_CATEGORIES } from '../../categories'

@Node({
  title: 'LLM Stream',
  description: 'Sends prompt to Language Model and streams response',
  category: NODE_CATEGORIES.AI,
  tags: ['ai', 'llm', 'prompt', 'gpt'],
})
export class LLMStreamNode extends BaseNode {
  @Input()
  @String({
    title: 'Prompt',
    description: 'Input prompt for the language model',
  })
  prompt: string = ''

  @Output()
  @PortStream({
    itemConfig: {
      type: 'string',
      defaultValue: '',
    },
  })
  outputStream: MultiChannel<string> = new MultiChannel<string>()

  @Input()
  @PortStream({
    itemConfig: {
      type: 'string',
      defaultValue: '',
    },
  })
  inputStream: MultiChannel<string> = new MultiChannel<string>()

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

    const stream = await llm.stream(messages, {
      signal: context.abortSignal,
    })

    // Start streaming in the background
    const streamingPromise = async () => {
      try {
        for await (const chunk of stream) {
          console.log('Chunk:', chunk)
          // Check if execution was aborted
          if (context.abortSignal.aborted) {
            this.outputStream.close()
            return
          }

          // Send chunk content to the output stream
          if (chunk.content) {
            this.outputStream.send(chunk.content.toString())
          }
        }

        // Close the stream when finished
        this.outputStream.close()
      } catch (error) {
        // Handle any errors and close the stream
        console.error('Streaming error:', error)
        this.outputStream.close()
      }
    }

    return {
      status: NodeExecutionStatus.Completed,
      startTime: context.startTime,
      endTime: new Date(),
      // outputs: this.getOutputs(),
      // backgroundTasks: [streamingPromise],
    }
  }
}
