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
  title: 'Branch',
  description: 'Controls flow based on condition',
  category: NODE_CATEGORIES.FLOW,
  tags: ['flow', 'condition', 'branch'],
}, nodeRegistry)
export class BranchNode extends BaseNode {
  @Input()
  @PortString({
    title: 'Condition',
    description: 'Condition to evaluate',
  })
  condition: string = ''

  @Output()
  @PortString({
    title: 'Result',
    description: 'Branch result',
  })
  result: string = ''

  async execute(context: ExecutionContext): Promise<NodeExecutionResult> {
    // Mock implementation
    this.result = `Branched on condition: ${this.condition}`

    return {
      status: ExecutionStatus.Completed,
      startTime: context.startTime,
      endTime: new Date(),
      outputs: new Map([['result', this.result]]),
    }
  }
}
