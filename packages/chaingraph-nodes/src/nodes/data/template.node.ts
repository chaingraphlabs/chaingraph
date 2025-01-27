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
  title: 'Template',
  description: 'Processes text template with variables',
  category: NODE_CATEGORIES.DATA,
  tags: ['template', 'text', 'transform'],
}, nodeRegistry)
export class TemplateNode extends BaseNode {
  @Input()
  @PortString({
    title: 'Template',
    description: 'Template string with variables',
  })
  template: string = ''

  @Output()
  @PortString({
    title: 'Result',
    description: 'Processed template',
  })
  result: string = ''

  async execute(context: ExecutionContext): Promise<NodeExecutionResult> {
    // Mock implementation
    this.result = `Template processed: ${this.template}`

    return {
      status: NodeExecutionStatus.Completed,
      startTime: context.startTime,
      endTime: new Date(),
      outputs: new Map([['result', this.result]]),
    }
  }
}
