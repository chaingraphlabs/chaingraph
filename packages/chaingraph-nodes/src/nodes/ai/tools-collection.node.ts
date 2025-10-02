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
  PortArray,
} from '@badaitech/chaingraph-types'
import { NODE_CATEGORIES } from '../../categories'
import { ToolDefinition } from './tool'

/**
 * Tools Collection Node
 *
 * This node allows you to collect multiple tool definitions into a single array.
 * You can connect individual tool schema nodes or add tools directly in this node.
 * The resulting collection can be used with LLM models that support tool calling.
 */
@Node({
  type: 'ToolsCollectionNode',
  title: 'Tools Collection',
  description: 'Collect and manage multiple tool definitions for use with LLM models',
  category: NODE_CATEGORIES.AI,
  tags: ['tools', 'collection', 'agent', 'llm', 'function calling'],
  ui: {
    state: {
      isHidden: true,
    },
  },
})
class ToolsCollectionNode extends BaseNode {
  /**
   * Input port for connected tools
   *
   * This allows connecting other Tool Schema nodes or existing collections
   * to this node. The connected tools will be included in the output.
   */
  @Input()
  @PortArray({
    title: 'Connected Tools',
    description: 'Tools connected from other nodes in the flow',
    itemConfig: {
      type: 'object',
      schema: ToolDefinition,
    },
    defaultValue: [],
  })
  connectedTools: ToolDefinition[] = []

  /**
   * Directly editable tools collection
   *
   * These are tools that are defined directly in this node,
   * rather than being connected from other nodes.
   */
  @Input()
  @PortArray({
    title: 'Managed Tools',
    description: 'Tools defined and managed within this node',
    itemConfig: {
      type: 'object',
      schema: ToolDefinition,
      defaultValue: new ToolDefinition(),
    },
    defaultValue: [],
    isMutable: true,
    ui: {
      addItemFormHidden: false,
      itemDeletable: true,
    },
  })
  managedTools: ToolDefinition[] = []

  /**
   * Output port providing the complete tools collection
   *
   * This combines both the connected tools and the managed tools
   * into a single array that can be passed to LLM nodes.
   */
  @Output()
  @PortArray({
    title: 'Tools Collection',
    description: 'The complete collection of tools to be used with LLM tool calling',
    itemConfig: {
      type: 'object',
      schema: ToolDefinition,
    },
    defaultValue: [],
  })
  toolsCollection: ToolDefinition[] = []

  /**
   * Execute the node logic - combine tools from both sources
   */
  async execute(context: ExecutionContext): Promise<NodeExecutionResult> {
    // Start with an empty collection
    const toolsCollection: ToolDefinition[] = []

    // Add connected tools (if any)
    if (this.connectedTools && Array.isArray(this.connectedTools)) {
      // Deep clone to avoid reference issues
      toolsCollection.push(...this.connectedTools)
    }

    // Add managed tools (if any)
    if (this.managedTools && Array.isArray(this.managedTools)) {
      // Deep clone to avoid reference issues
      toolsCollection.push(...this.managedTools)
    }

    // Deduplicate tools by name (if there are duplicates, keep the last one)
    const toolMap = new Map<string, ToolDefinition>()
    for (const tool of toolsCollection) {
      if (tool && tool.name) {
        toolMap.set(tool.name, tool)
      }
    }

    // Convert map back to array
    const toolsToAdd = Array.from(toolMap.values())

    this.toolsCollection = toolsToAdd

    return {}
  }
}

export default ToolsCollectionNode
