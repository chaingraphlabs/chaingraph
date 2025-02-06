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
  String,
} from '@chaingraph/types'

@Node({
  title: 'Create Message',
  description: 'Creates a new message with specified content',
  category: NODE_CATEGORIES.MESSAGING,
  tags: ['message', 'create', 'content'],
}, nodeRegistry)
export class CreateMessageNode extends BaseNode {
  @Input()
  @String({
    title: 'Content',
    description: 'Message content to be sent',
  })
  content: string = ''

  @Output()
  @String({
    title: 'Message',
    description: 'Created message object',
  })
  message: string = ''

  async execute(context: ExecutionContext): Promise<NodeExecutionResult> {
    // Mock implementation
    this.message = `Message created: ${this.content}`

    return {
      status: NodeExecutionStatus.Completed,
      startTime: context.startTime,
      endTime: new Date(),
      outputs: new Map([['message', this.message]]),
    }
  }
}
