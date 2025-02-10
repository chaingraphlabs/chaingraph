import type { ExecutionContext, NodeExecutionResult } from '@badaitech/chaingraph-types'
import { BaseNode, Node, Output, String } from '@badaitech/chaingraph-types'
import { NODE_CATEGORIES } from '../../categories'

@Node({
  title: 'Text Node',
  description: 'A node that outputs a text string.',
  category: NODE_CATEGORIES.BASIC_VALUES,
})
class TextNode extends BaseNode {
  @Output()
  @String({
    title: 'Text',
    description: 'The output text string.',
    ui: {
      isTextArea: true,
      hideEditor: false,
    },
  })
  public text: string = ''

  async execute(context: ExecutionContext): Promise<NodeExecutionResult> {
    // In this simple node, no processing is applied – it only passes the default string.
    return {}
  }
}

export default TextNode
