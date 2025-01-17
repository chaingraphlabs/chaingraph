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
  title: 'Webhook',
  description: 'Sends HTTP requests to external services',
  category: NODE_CATEGORIES.UTILITIES,
  tags: ['http', 'webhook', 'request'],
}, nodeRegistry)
export class WebhookNode extends BaseNode {
  @Input()
  @PortString({
    title: 'URL',
    description: 'Webhook URL',
  })
  url: string = ''

  @Output()
  @PortString({
    title: 'Response',
    description: 'Webhook response',
  })
  response: string = ''

  async execute(context: ExecutionContext): Promise<NodeExecutionResult> {
    // Mock implementation
    this.response = `Webhook called: ${this.url}`

    return {
      status: ExecutionStatus.Completed,
      startTime: context.startTime,
      endTime: new Date(),
      outputs: new Map([['response', this.response]]),
    }
  }
}
