import { NODE_CATEGORIES } from '@chaingraph/nodes/categories/constants'
import { nodeRegistry } from '@chaingraph/nodes/registry'
import {
  BaseNode,
  type ExecutionContext,
  Input,
  Node,
  type NodeExecutionResult,
  NodeExecutionStatus,
  Output,
  Port,
  PortKind,
  PortString,
} from '@chaingraph/types'

@Node({
  title: 'LLM Prompt',
  description: 'Sends prompt to Language Model and returns response',
  category: NODE_CATEGORIES.AI,
  tags: ['ai', 'llm', 'prompt', 'gpt'],
}, nodeRegistry)
export class LLMPromptNode extends BaseNode {
  @Input()
  @PortString({
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
    kind: PortKind.String,
  })
  response: string = ''

  async execute(context: ExecutionContext): Promise<NodeExecutionResult> {
    // Mock implementation
    this.response = `AI Response to: ${this.prompt}`

    return {
      status: NodeExecutionStatus.Completed,
      startTime: context.startTime,
      endTime: new Date(),
      outputs: new Map([['response', this.response]]),
    }
  }
}
