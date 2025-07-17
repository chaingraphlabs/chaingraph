/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { ExecutionContext, NodeExecutionResult, ObjectPort } from '@badaitech/chaingraph-types'
import {
  BaseNode,
  Input,
  Node,
  Output,
  PortObject,
} from '@badaitech/chaingraph-types'
import { NODE_CATEGORIES } from '../../../categories'
import { Tool, ToolInputSchema, ToolSchemaProperty } from './types'
import { extractNodeSchema } from './utils'

@Node({
  type: 'NodeAsAnthropicToolNode',
  title: 'Node as Anthropic Tool',
  description: 'Creates a tool definition for Claude to use based on a ChainGraph node schema.\n\nThis node captures the schema of a ChainGraph node and generates a tool definition that can be used with Anthropic\'s Claude AI. It extracts metadata from the node to create a meaningful tool name and description, and converts the node properties into a structured input schema for the tool.',
  category: NODE_CATEGORIES.ANTHROPIC,
  tags: ['anthropic', 'tool', 'claude', 'function'],
  ui: {
    dimensions: {
      width: 300,
      height: 0,
    },
  },
})
class NodeAsAnthropicToolNode extends BaseNode {
  @Input()
  @PortObject({
    title: 'Node Schema',
    description: 'Definition of the Node Schema to generate tool definition',
    schema: {
      type: 'object',
      properties: {},
    },
    isSchemaMutable: true,
    defaultValue: {},
    ui: {
      collapsed: true,
      hidePort: true,
      hideEditor: true,
      nodeSchemaCapture: {
        enabled: true,
        capturedNodeId: undefined,
      },
    },
  })
  inputSchema: Record<string, any> = {}

  @Output()
  @PortObject({
    title: 'Tool',
    description: 'The defined tool',
    schema: Tool,
    ui: {
      hideEditor: true,
      hidePropertyEditor: true,
    },
  })
  tool: Tool = new Tool()

  async execute(context: ExecutionContext): Promise<NodeExecutionResult> {
    const inputSchemaPort = this.findPortByKey('inputSchema') as ObjectPort | undefined
    if (!inputSchemaPort) {
      throw new Error('Input schema port not found. Please ensure the input schema is connected.')
    }

    const nodeId = inputSchemaPort.getConfig().ui?.nodeSchemaCapture?.capturedNodeId
    if (!nodeId) {
      throw new Error('No node ID captured. Please drop a node onto the Input Schema port first.')
    }

    const schemaNode = context.getNodeById(nodeId) as BaseNode | undefined
    if (!schemaNode) {
      throw new Error(`Node with ID ${nodeId} not found in the context.`)
    }

    // Create tool name (sanitize for Claude API)
    const toolName = (schemaNode.metadata.title || schemaNode.metadata.type || `Node_${nodeId}`)
      .toLowerCase()
      .replace(/\s+/g, '_')
      .replace(/[^a-z0-9]/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '')
      .substring(0, 64) // Claude tool names have length limits

    // Create the tool input schema
    const toolInputSchema = new ToolInputSchema()
    toolInputSchema.type = 'object'
    toolInputSchema.properties = {}
    toolInputSchema.required = []

    const schema = extractNodeSchema(schemaNode)

    const outputProperties = schema?.outputProperties || {}

    // Convert schema properties to tool schema properties
    if (schema.properties) {
      for (const [key, prop] of Object.entries(schema.properties)) {
        // Type guard to ensure prop has the expected structure
        if (prop && typeof prop === 'object') {
          const originalPort = schemaNode.findPortByKey(key)
          if (!originalPort) {
            continue
          }

          const toolProp = new ToolSchemaProperty()

          // iterate over the properties of the schema and set them in the tool schema
          for (const propKey of Object.keys(prop)) {
            (toolProp as any)[propKey] = (prop as any)[propKey]
          }

          toolInputSchema.properties[key] = toolProp
        } else {
          toolInputSchema.properties[key] = {
            type: 'string', // Default to string if type is not specified
            description: `Property ${key} has an invalid schema definition.`,
          }
        }
      }
    }

    // Set required fields
    if (schema.required && Array.isArray(schema.required)) {
      toolInputSchema.required = schema.required
    }

    // Create the final tool definition
    const tool = new Tool()
    tool.name = toolName
    tool.type = 'custom'
    tool.description = `${schema.metadata.nodeDescription}\n\nOriginal node: ${schema.metadata.nodeTitle}\n\nOutput schema:\n\n${JSON.stringify(outputProperties, null, 2)}`
    tool.input_schema = toolInputSchema
    tool.chaingraph_node_id = nodeId
    tool.chaingraph_node_type = schemaNode.metadata.type || 'unknown-node-type'

    // Set the output
    this.tool = tool

    return {}
  }
}

export default NodeAsAnthropicToolNode
