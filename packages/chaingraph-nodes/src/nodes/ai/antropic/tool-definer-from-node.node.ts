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
} from '@badaitech/chaingraph-types'
import { NODE_CATEGORIES } from '../../../categories'
import { Tool } from './types'

@Node({
  type: 'AntropicToolDefinerFromNodeNode',
  title: 'Anthropic Tool Definer From Node',
  description: 'Creates a tool definition for Claude to use',
  category: NODE_CATEGORIES.ANTHROPIC,
  tags: ['anthropic', 'tool', 'claude', 'function'],
})
class AntropicToolDefinerFromNodeNode extends BaseNode {
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
    metadata: {
      node_schema_mode: true,
    },
  })
  inputSchema: Record<string, any> = {}

  @Output()
  @PortObject({
    title: 'Tool',
    description: 'The defined tool',
    schema: Tool,
  })
  tool: Tool = new Tool()

  async execute(context: ExecutionContext): Promise<NodeExecutionResult> {
    return {}
  }
}

export default AntropicToolDefinerFromNodeNode
