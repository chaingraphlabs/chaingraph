import { NODE_CATEGORIES } from '@chaingraph/nodes/categories/constants'
import { nodeRegistry } from '@chaingraph/nodes/registry'
import {
  BaseNode,
  type ExecutionContext,
  Input,
  Node,
  type NodeExecutionResult,
  NodeExecutionStatus,
  String,
} from '@chaingraph/types'

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
