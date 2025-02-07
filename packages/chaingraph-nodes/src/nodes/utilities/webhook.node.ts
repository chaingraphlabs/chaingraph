import type {
  ExecutionContext,
  NodeExecutionResult,
} from '@badaitech/chaingraph-types'
import { BaseNode, Input, Node, NodeExecutionStatus, Output, String } from '@badaitech/chaingraph-types'
import { NODE_CATEGORIES } from '../../categories/constants'

@Node({
  title: 'Webhook',
  description: 'Sends HTTP requests to external services',
  category: NODE_CATEGORIES.UTILITIES,
  tags: ['http', 'webhook', 'request'],
})
export class WebhookNode extends BaseNode {
  @Input()
  @String({
    title: 'URL',
    description: 'Webhook URL',
  })
  url: string = ''

  @Output()
  @String({
    title: 'Response',
    description: 'Webhook response',
  })
  response: string = ''

  async execute(context: ExecutionContext): Promise<NodeExecutionResult> {
    // Mock implementation
    this.response = `Webhook called: ${this.url}`

    return {
      status: NodeExecutionStatus.Completed,
      startTime: context.startTime,
      endTime: new Date(),
      outputs: new Map([['response', this.response]]),
    }
  }
}
