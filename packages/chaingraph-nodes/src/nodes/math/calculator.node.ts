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
  title: 'Calculator',
  description: 'Performs basic mathematical operations',
  category: NODE_CATEGORIES.MATH,
  tags: ['math', 'calculation', 'arithmetic'],
}, nodeRegistry)
export class CalculatorNode extends BaseNode {
  @Input()
  @PortString({
    title: 'Expression',
    description: 'Mathematical expression to evaluate',
  })
  expression: string = ''

  @Output()
  @PortString({
    title: 'Result',
    description: 'Calculation result',
  })
  result: string = ''

  async execute(context: ExecutionContext): Promise<NodeExecutionResult> {
    // Mock implementation
    this.result = `Calculated: ${this.expression} = 42`

    return {
      status: NodeExecutionStatus.Completed,
      startTime: context.startTime,
      endTime: new Date(),
      outputs: new Map([['result', this.result]]),
    }
  }
}
