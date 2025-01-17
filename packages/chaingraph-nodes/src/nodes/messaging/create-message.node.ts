import { NODE_CATEGORIES } from '@chaingraph/nodes/categories/constants'
import { nodeRegistry } from '@chaingraph/nodes/registry'
import {
  BaseNode,
  type ExecutionContext,
  ExecutionStatus,
  Input,
  Node,
  type NodeExecutionResult,
  Output,
  PortString,
} from '@chaingraph/types'

@Node({
  title: 'Create Message',
  description: 'Creates a new message with specified content',
  category: NODE_CATEGORIES.MESSAGING,
  tags: ['message', 'create', 'content'],
}, nodeRegistry)
export class CreateMessageNode extends BaseNode {
  @Input()
  @PortString({
    title: 'Content',
    description: 'Message content to be sent',
  })
  content: string = ''

  @Output()
  @PortString({
    title: 'Message',
    description: 'Created message object',
  })
  message: string = ''

  async execute(context: ExecutionContext): Promise<NodeExecutionResult> {
    // Mock implementation
    this.message = `Message created: ${this.content}`

    return {
      status: ExecutionStatus.Completed,
      startTime: context.startTime,
      endTime: new Date(),
      outputs: new Map([['message', this.message]]),
    }
  }
}
