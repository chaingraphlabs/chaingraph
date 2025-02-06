import type {
  ExecutionContext,
  NodeExecutionResult,
} from '@badaitech/chaingraph-types'
import { BaseNode, Input, Node, NodeExecutionStatus, Output, Port, String } from '@badaitech/chaingraph-types'
import { HumanMessage, SystemMessage } from '@langchain/core/messages'
import { ChatOpenAI } from '@langchain/openai'
import { NODE_CATEGORIES } from '../../categories/constants'
import { nodeRegistry } from '../../registry'

@Node({
  title: 'LLM Prompt',
  description: 'Sends prompt to Language Model and returns response',
  category: NODE_CATEGORIES.AI,
  tags: ['ai', 'llm', 'prompt', 'gpt'],
}, nodeRegistry)
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
      apiKey: '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',
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
