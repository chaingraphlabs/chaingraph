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
  title: 'Branch',
  description: 'Controls flow based on condition',
  category: NODE_CATEGORIES.FLOW,
  tags: ['flow', 'condition', 'branch'],
}, nodeRegistry)
export class BranchNode extends BaseNode {
  @Input()
  @String({
    title: 'Condition',
    description: 'Condition to evaluate',
  })
  condition: string = ''

  @Output()
  @String({
    title: 'Result',
    description: 'Branch result',
  })
  result: string = ''

  async execute(context: ExecutionContext): Promise<NodeExecutionResult> {
    // Mock implementation
    this.result = `Branched on condition: ${this.condition}`

    return {
      status: NodeExecutionStatus.Completed,
      startTime: context.startTime,
      endTime: new Date(),
      outputs: new Map([['result', this.result]]),
    }
  }
}
