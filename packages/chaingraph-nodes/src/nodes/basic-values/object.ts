/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type {
  ExecutionContext,
  IPort,
  NodeEvent,
  NodeExecutionResult,
  NodeTitleChangeEvent,
  ObjectPort,
} from '@badaitech/chaingraph-types'
import {
  BaseNode,
  Node,
  NodeEventType,
  Passthrough,
  PortObject,
} from '@badaitech/chaingraph-types'
import { customAlphabet } from 'nanoid'
import { nolookalikes } from 'nanoid-dictionary'
import { NODE_CATEGORIES } from '../../categories'

@Node({
  type: 'ObjectNode',
  title: 'Object Node',
  description: 'A node that outputs an object',
  category: NODE_CATEGORIES.BASIC_VALUES,
})
class ObjectNode extends BaseNode {
  @Passthrough()
  @PortObject({
    title: 'Object',
    description: 'The output object.',
    schema: {
      properties: {},
    },
    isSchemaMutable: true,
    ui: {
      keyDeletable: true,
      hideEditor: false,
    },
  })
  public object: Record<string, any> = {}

  async execute(context: ExecutionContext): Promise<NodeExecutionResult> {
    // This node simply outputs the default number value.
    return {}
  }

  async onEvent(_event: NodeEvent): Promise<void> {
    await super.onEvent(_event)

    if (_event.type === NodeEventType.TitleChange) {
      const titleChangeEvent = _event as NodeTitleChangeEvent

      const objectPort = this.findPort(
        port =>
          port.key === 'object'
          && port.getConfig().type === 'object'
          && port.getConfig().direction === 'passthrough',
      ) as ObjectPort | undefined
      if (!objectPort) {
        console.warn('Object port not found for title change event')
        return
      }

      const typeName = this.makeTypeFromTitle(titleChangeEvent.newTitle)

      // Update the title of the object port to match the new title of the node
      objectPort.setConfig({
        ...objectPort.getConfig(),
        title: typeName,
        description: `The output object of type ${typeName}`,
        schema: {
          ...objectPort.getConfig().schema,
          type: typeName,
        },
      })

      await this.updatePort(objectPort as IPort, {
        sourceOfUpdate: 'ObjectNode:onEvent:titleChange',
      })
    }
  }

  private makeTypeFromTitle(title: string): string {
    if (!title || typeof title !== 'string') {
      return `UnnamedType${customAlphabet(nolookalikes, 8)()}`
    }

    // Normalize whitespace and trim
    const normalized = title.trim().replace(/\s+/g, ' ')

    // Convert to PascalCase: "my object node" -> "MyObjectNode"
    const pascalCase = normalized
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join('')

    // Remove non-alphanumeric characters
    const alphanumeric = pascalCase.replace(/[^a-z0-9]/gi, '')

    // Handle edge cases
    if (!alphanumeric) {
      return 'UnnamedType'
    }

    // Ensure it starts with a letter
    if (/^\d/.test(alphanumeric)) {
      return `Type${alphanumeric}`
    }

    return alphanumeric
  }
}

export default ObjectNode
