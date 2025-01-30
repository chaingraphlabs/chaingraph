import { NODE_CATEGORIES } from '@chaingraph/nodes/categories/constants'
import { nodeRegistry } from '@chaingraph/nodes/registry'
import {
  BaseNode,
  type ExecutionContext,
  Input,
  Node,
  type NodeExecutionResult,
  NodeExecutionStatus,
  PortString,
} from '@chaingraph/types'

@Node({
  title: 'Debug Log',
  description: 'Logs a message to the console',
  category: NODE_CATEGORIES.UTILITIES,
  tags: ['debug', 'log', 'console'],
}, nodeRegistry)
export class DebugLogNode extends BaseNode {
  @Input()
  @PortString({
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
