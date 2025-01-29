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
  PortString,
} from '@chaingraph/types'

@Node({
  title: 'Telegram Message',
  description: 'Sends a message to Telegram',
  category: NODE_CATEGORIES.MESSAGING,
  tags: ['telegram', 'message', 'social'],
}, nodeRegistry)
export class TelegramMessageNode extends BaseNode {
  @Input()
  @PortString({
    title: 'Message',
    description: 'Message to send to Telegram',
  })
  message: string = ''

  @Output()
  @PortString({
    title: 'Result',
    description: 'Sending result status',
  })
  result: string = ''

  async execute(context: ExecutionContext): Promise<NodeExecutionResult> {
    // Mock implementation
    this.result = `Telegram message sent: ${this.message}`

    // delay 3 sec + 2 sec random time
    await new Promise(resolve => setTimeout(resolve, 3000 + Math.random() * 2000))

    return {
      status: NodeExecutionStatus.Completed,
      startTime: context.startTime,
      endTime: new Date(),
      outputs: new Map([['result', this.result]]),
    }
  }
}
