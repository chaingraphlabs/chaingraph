/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { ExecutionContext, NodeExecutionResult } from '@badaitech/chaingraph-types'
import {
  BaseNode,
  Input,
  Node,
  Output,
  PortObject,
  String,
} from '@badaitech/chaingraph-types'
import { PromptTemplate } from '@langchain/core/prompts'
import { NODE_CATEGORIES } from '../../categories'

@Node({
  type: 'LangchainTemplateNode',
  title: 'Langchain Template',
  description: 'Renders a template string using Langchain PromptTemplate',
  category: NODE_CATEGORIES.UTILITIES,
  tags: ['template', 'prompt', 'langchain', 'text'],
})
class LangchainTemplateNode extends BaseNode {
  @Input()
  @PortObject({
    title: 'Variables',
    description: 'Object containing variables to insert into the template',
    isSchemaMutable: true,
    ui: {
      keyDeletable: true,
    },
    schema: {
      type: 'object',
      properties: {},
    },
  })
  variables: Record<string, any> = {}

  @Input()
  @String({
    title: 'Template',
    description: 'Template string with variables in {variable_name} format',
    ui: {
      isTextArea: true,
      textareaDimensions: { height: 150 },
    },
    defaultValue: 'Tell me a joke about {topic}',
  })
  template: string = 'Tell me a joke about {topic}'

  @Output()
  @String({
    title: 'Rendered Text',
    description: 'The template with all variables replaced',
  })
  renderedText: string = ''

  async execute(context: ExecutionContext): Promise<NodeExecutionResult> {
    try {
      if (!this.template) {
        throw new Error('Template string is required')
      }

      // Create a prompt template from the template string
      const promptTemplate = PromptTemplate.fromTemplate(this.template)

      // Check if we have all required variables
      const inputVariables = promptTemplate.inputVariables
      const missingVariables = inputVariables.filter(v => !(v in this.variables))

      if (missingVariables.length > 0) {
        throw new Error(`Missing required variables: ${missingVariables.join(', ')}`)
      }

      // Invoke the template with the variables
      const result = await promptTemplate.invoke(this.variables)

      // Get the rendered text
      this.renderedText = result.value

      return {}
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : JSON.stringify(error)
      throw new Error(`Template rendering failed: ${errorMessage}`)
    }
  }
}

export default LangchainTemplateNode
