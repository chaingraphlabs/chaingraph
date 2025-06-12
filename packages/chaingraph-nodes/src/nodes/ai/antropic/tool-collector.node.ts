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
import { NODE_CATEGORIES } from '../../../categories'
import { Tool } from './types'

@Node({
  type: 'AntropicToolCollectorNode',
  title: 'Anthropic Tool Collector',
  description: 'Collects multiple tools into an array for the Anthropic LLM Call',
  category: NODE_CATEGORIES.ANTHROPIC,
  tags: ['anthropic', 'tool', 'claude', 'collector'],
})
class AntropicToolCollectorNode extends BaseNode {
  @Input()
  @PortArray({
    title: 'Tools Input',
    description: 'List of tools to be collected',
    itemConfig: {
      type: 'object',
      schema: Tool,
      defaultValue: new Tool(),
    },
    isMutable: true,
    ui: {
      addItemFormHidden: false,
    },
    defaultValue: [],
  })
  toolsInput: Tool[] = []

  @Input()
  @PortArray({
    title: 'Tools Input',
    description: 'List of tools to be collected',
    itemConfig: {
      type: 'object',
      schema: Tool,
      defaultValue: new Tool(),
    },
    isMutable: true,
    ui: {
      addItemFormHidden: false,
    },
    defaultValue: [],
  })
  toolsInput2: Tool[] = []

  @Output()
  @PortArray({
    title: 'Tools',
    description: 'Collected tool definitions',
    itemConfig: {
      type: 'object',
      schema: Tool,
      defaultValue: new Tool(),
    },
    defaultValue: [],
  })
  tools: Tool[] = []

  async execute(context: ExecutionContext): Promise<NodeExecutionResult> {
    // Add all defined tools to the output array
    for (const tool of (this.toolsInput)) {
      if (tool !== undefined) {
        this.tools.push(tool)
      }
    }

    for (const tool of (this.toolsInput2)) {
      if (tool !== undefined) {
        this.tools.push(tool)
      }
    }

    return {}
  }
}

export default AntropicToolCollectorNode
