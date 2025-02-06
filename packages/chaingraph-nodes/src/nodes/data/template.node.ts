import type {
  ExecutionContext,
  NodeExecutionResult,
} from '@badaitech/chaingraph-types'
import { BaseNode, Input, Node, NodeExecutionStatus, Output, String } from '@badaitech/chaingraph-types'
import { NODE_CATEGORIES } from '../../categories/constants'
import { nodeRegistry } from '../../registry'

@Node({
  title: 'Template',
  description: 'Processes text template with variables',
  category: NODE_CATEGORIES.DATA,
  tags: ['template', 'text', 'transform'],
}, nodeRegistry)
export class TemplateNode extends BaseNode {
  @Input()
  @String({
    title: 'Template',
    description: 'Template string with variables',
  })
  template: string = ''

  @Output()
  @String({
    title: 'Result',
    description: 'Processed template',
    ui: {
      hideEditor: false,
    },
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
