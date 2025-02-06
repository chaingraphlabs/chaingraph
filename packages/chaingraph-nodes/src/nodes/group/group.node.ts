import type {
  ExecutionContext,
  NodeExecutionResult,
} from '@badaitech/chaingraph-types'
import { BaseNode, Input, Node, NodeExecutionStatus, String } from '@badaitech/chaingraph-types'
import { NODE_CATEGORIES } from '../../categories/constants'
import { nodeRegistry } from '../../registry'

@Node({
  title: 'Group',
  description: 'Group nodes',
  category: NODE_CATEGORIES.GROUP,
  tags: ['group'],
}, nodeRegistry)
export class GroupNode extends BaseNode {
  @Input()
  @String()
  a: string = ''

  async execute(context: ExecutionContext): Promise<NodeExecutionResult> {
    return {
      status: NodeExecutionStatus.Completed,
      startTime: context.startTime,
      endTime: new Date(),
      outputs: new Map(),
    }
  }
}
