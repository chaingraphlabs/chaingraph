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
  Node,
  Output,
  PortObject,
} from '@badaitech/chaingraph-types'
import { NODE_CATEGORIES } from '../../categories'
import { ToolDefinition } from './tool'

/**
 * Tool Schema Node
 *
 * This node allows users to define a tool schema with parameters that can be used
 * by LLM models for tool/function calling. The output can be connected to nodes
 * like LLMCallWithToolsNode to provide tools for LLMs to use.
 */
@Node({
  type: 'ToolSchemaNode',
  title: 'Tool Schema',
  description: 'Define a tool schema with parameters that can be used by LLM models for tool calling',
  category: NODE_CATEGORIES.AI,
  tags: ['tool', 'schema', 'function', 'llm', 'agent'],
})
class ToolSchemaNode extends BaseNode {
  /**
   * Output port that provides the complete tool definition including
   * name, description, and parameters in a format ready to be used by
   * LLM tool calling functions.
   */
  @Output()
  @PortObject({
    title: 'Tool Definition',
    description: 'The complete tool definition to be used with LLM tool calling',
    schema: ToolDefinition,
    ui: {
      collapsed: false,
    },
  })
  toolDefinition: ToolDefinition = new ToolDefinition()

  /**
   * Execute the node logic - format the tool definition
   */
  async execute(context: ExecutionContext): Promise<NodeExecutionResult> {
    return {}
  }
}

export default ToolSchemaNode
