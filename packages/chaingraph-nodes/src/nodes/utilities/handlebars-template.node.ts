/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type {
  ExecutionContext,
  NodeExecutionResult,
} from '@badaitech/chaingraph-types'
import {
  ExecutionEventEnum,
} from '@badaitech/chaingraph-types'
import {
  BaseNode,
  Input,
  Node,
  Output,
  PortObject,
  String,
} from '@badaitech/chaingraph-types'
import Handlebars from 'handlebars'
import { stringify } from 'yaml'
import { NODE_CATEGORIES } from '../../categories'

// Register some useful built-in helpers
Handlebars.registerHelper('json', (context) => {
  return JSON.stringify(context, null, 2)
})

Handlebars.registerHelper('yaml', (context) => {
  // Serialize the data to YAML
  return stringify(context)
})

Handlebars.registerHelper('yml', (context) => {
  // Serialize the data to YAML
  return stringify(context)
})

Handlebars.registerHelper('uppercase', (str) => {
  return str ? str.toString().toUpperCase() : ''
})

Handlebars.registerHelper('lowercase', (str) => {
  return str ? str.toString().toLowerCase() : ''
})

@Node({
  type: 'HandlebarsTemplateNode',
  title: 'Handlebars Template',
  description: 'Creates formatted text using Handlebars templates with support for conditionals, loops, and custom helpers. More powerful than basic template strings with advanced nesting capabilities.',
  category: NODE_CATEGORIES.UTILITIES,
  tags: ['template', 'handlebars', 'text', 'formatting', 'nested'],
})
class HandlebarsTemplateNode extends BaseNode {
  @Input()
  @String({
    title: 'Template',
    description: 'Handlebars template with variables in {{variable}} format',
    ui: {
      isTextArea: true,
      textareaDimensions: {
        width: 250,
        height: 200,
      },
    },
  })
  template: string = `Hello, {{{user.name}}}!

{{#if user.isPremium}}
  Premium features activated.
  Subscription: {{{uppercase user.subscription.tier}}} tier

  Your subscribed products:
  {{#each user.products}}
    - {{{this.name}}}: {{{this.description}}}
  {{else}}
    No products found.
  {{/each}}
{{else}}
  Consider upgrading to premium for more features.
{{/if}}

Profile details: {{{json user.profile}}}`

  @Input()
  @PortObject({
    title: 'Variables',
    description: 'Object containing variables to insert into the template',
    isSchemaMutable: true,
    schema: {
      type: 'object',
      properties: {},
    },
    ui: {
      keyDeletable: true,
    },
  })
  variables: Record<string, any> = {}

  @Output()
  @String({
    title: 'Rendered Text',
    description: 'The template with all variables replaced',
  })
  renderedText: string = ''

  async execute(context: ExecutionContext): Promise<NodeExecutionResult> {
    // Reset outputs
    try {
      if (!this.template) {
        throw new Error('Template string is required')
      }

      let compiledTemplate: HandlebarsTemplateDelegate<any>
      try {
        Handlebars.logger.log = (level: number, obj: string) => {
          console.log(`[Handlebars debug] ${obj}`)
          context.sendEvent({
            index: 0,
            type: ExecutionEventEnum.NODE_DEBUG_LOG_STRING,
            timestamp: new Date(),
            data: {
              node: this.clone(),
              log: `[Handlebars] [${level}] ${obj}`,
            },
          })
        }
        compiledTemplate = Handlebars.compile(this.template, {
          noEscape: true,
        })
      } catch (compileError) {
        throw new Error(
          `Template compilation failed: ${compileError instanceof Error ? compileError.message : JSON.stringify(compileError)}`,
        )
      }

      // Render the template with the variables
      this.renderedText = compiledTemplate(this.variables)

      return {}
    } catch (error) {
      throw new Error(`Handlebars template rendering failed: ${error}`)
    }
  }
}

export default HandlebarsTemplateNode
