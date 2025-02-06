import type {
  ExecutionContext,
  NodeExecutionResult,
} from '@badaitech/chaingraph-types'
import { BaseNode, Input, Node, NodeExecutionStatus, String } from '@badaitech/chaingraph-types'
import { NODE_CATEGORIES } from '../../categories/constants'
import { nodeRegistry } from '../../registry'

@Node({
  title: 'Debug Log',
  description: 'Logs a message to the console',
  category: NODE_CATEGORIES.UTILITIES,
  tags: ['debug', 'log', 'console'],
}, nodeRegistry)
export class DebugLogNode extends BaseNode {
  @Input()
  @String({
    title: 'Message',
    description: 'Message to log',
  })
  message: string = ''

  async execute(context: ExecutionContext): Promise<NodeExecutionResult> {
    console.log(this.message)

    return {
      status: NodeExecutionStatus.Completed,
      startTime: context.startTime,
      endTime: new Date(),
      outputs: new Map(),
    }
  }
}
