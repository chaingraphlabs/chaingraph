/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { ExecutionContext, NodeExecutionResult } from '@badaitech/chaingraph-types'
import type { ObjectPort } from '@badaitech/chaingraph-types'
import { findPort } from '@badaitech/chaingraph-types'
import {
  BaseNode,
  Input,
  Node,
  Output,
  PortObject,
  PortString,
} from '@badaitech/chaingraph-types'
import { NODE_CATEGORIES } from '../../../categories'
import { Tool, ToolInputSchema, ToolSchemaProperty } from './types'

@Node({
  type: 'AntropicToolDefinerNode',
  title: 'Anthropic Tool Definer',
  description: 'Creates a tool definition for Claude to use',
  category: NODE_CATEGORIES.ANTHROPIC,
  tags: ['anthropic', 'tool', 'claude', 'function'],
})
class AntropicToolDefinerNode extends BaseNode {
  @Input()
  @PortString({
    title: 'Tool Name',
    description: 'Name of the tool (should be unique and reflect function)',
    required: true,
  })
  name: string = ''

  @Input()
  @PortString({
    title: 'Tool Description',
    description: 'Detailed explanation of what the tool does and when to use it',
    ui: {
      isTextArea: true,
    },
    required: true,
  })
  description: string = ''

  @Input()
  @PortObject({
    title: 'Input Schema',
    description: 'Definition of the inputs the tool accepts',
    schema: ToolInputSchema,
    isSchemaMutable: true,
    defaultValue: new ToolInputSchema(),
  })
  inputSchema: ToolInputSchema = new ToolInputSchema()

  @Output()
  @PortObject({
    title: 'Tool',
    description: 'The defined tool',
    schema: Tool,
    ui: {
      hidePropertyEditor: true,
    },
  })
  tool: Tool = new Tool()

  async execute(context: ExecutionContext): Promise<NodeExecutionResult> {
    // Create the tool
    this.tool = new Tool()
    this.tool.name = this.name
    this.tool.description = this.description
    this.tool.type = 'custom'

    // Set the input schema
    this.tool.input_schema.type = 'object'

    const inputSchemaPort = findPort(this, (port) => {
      return port.getConfig().key === 'inputSchema'
        && port.getConfig().type === 'object'
        && (port.getConfig().direction === 'input' || port.getConfig().direction === 'passthrough')
    })
    if (!inputSchemaPort) {
      throw new Error('Input schema port not found')
    }

    const inputSchemaPropertiesPort = findPort(this, (port) => {
      return port.getConfig().key === 'properties'
        && port.getConfig().type === 'object'
        && (port.getConfig().direction === 'input' || port.getConfig().direction === 'passthrough')
        && port.getConfig().parentId === inputSchemaPort.id
    })

    if (!inputSchemaPropertiesPort) {
      throw new Error('Input schema properties port not found')
    }

    for (const property of Object.entries((inputSchemaPropertiesPort as ObjectPort).getConfig().schema.properties)) {
      const [key, value] = property

      const schemaProperty = new ToolSchemaProperty()
      schemaProperty.type = value.type
      schemaProperty.description = value.description || ''

      this.tool.input_schema.properties[key] = schemaProperty
    }

    this.tool.input_schema.required = []
    for (const property of this.inputSchema.required) {
      if (this.tool.input_schema.properties[property]) {
        this.tool.input_schema.required.push(property)
      }
    }

    return {}
  }
}

export default AntropicToolDefinerNode
