import type { ExecutionContext, NodeExecutionResult } from '@badaitech/chaingraph-types'
import { BaseNode, Node, Number, Output } from '@badaitech/chaingraph-types'
import { NODE_CATEGORIES } from '../../categories'

@Node({
  title: 'Number Node',
  description: 'A node that outputs a number value.',
  category: NODE_CATEGORIES.BASIC_VALUES,
})
class NumberNode extends BaseNode {
  @Output()
  @Number({
    title: 'Number',
    description: 'The output number.',
    ui: {
      hideEditor: false,
    },
  })
  public num: number = 0

  async execute(context: ExecutionContext): Promise<NodeExecutionResult> {
    // This node simply outputs the default number value.
    return {}
  }
}

export default NumberNode
