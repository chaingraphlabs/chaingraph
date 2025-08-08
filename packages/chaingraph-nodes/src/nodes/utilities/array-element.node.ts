/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type {
  AnyPort,

  ArrayPort,
  ExecutionContext,
  INode,
  IPort,
  NodeExecutionResult,
} from '@badaitech/chaingraph-types'
import {
  OnPortUpdate,
} from '@badaitech/chaingraph-types'
import {
  deepCopy,
} from '@badaitech/chaingraph-types'
import {
  PortArray,
} from '@badaitech/chaingraph-types'

import {
  BaseNode,
  Node,
  Output,
  Passthrough,
  PortAny,
  PortNumber,
} from '@badaitech/chaingraph-types'
import { NODE_CATEGORIES } from '../../categories'

@Node({
  type: 'ArrayElementNode',
  title: 'Array Element',
  description: 'Extracts an element from an array at the specified index',
  category: NODE_CATEGORIES.UTILITIES,
  tags: ['array', 'element', 'index', 'extract'],
})
class ArrayElementNode extends BaseNode {
  @Passthrough()
  @PortArray({
    title: 'Array',
    description: 'The array to extract an element from',
    itemConfig: {
      type: 'any',
      title: 'Item',
      description: 'The type of items in the array',
    },
    isMutable: true,
    isSchemaMutable: true,
  })
  @OnPortUpdate(async (node: INode, port: IPort) => {
    const elementPort = node.findPort(
      p => p.getConfig().key === 'element'
        && !p.getConfig().parentId
        && p.getConfig().direction === 'output',
    ) as AnyPort | undefined

    if (!elementPort) {
      return
    }

    // Get the item type from the array port
    const arrayPort = port as ArrayPort
    const itemConfig = arrayPort.getConfig().itemConfig

    elementPort.setUnderlyingType(deepCopy({
      ...itemConfig,
      direction: elementPort.getConfig().direction,
      ui: {
        ...itemConfig.ui,
        keyDeletable: false,
        hideEditor: true,
        collapsed: true,
        hidePropertyEditor: true,
      },
    }))
    node.refreshAnyPortUnderlyingPorts(elementPort as IPort, true)
  })
  array: any[] = []

  @Passthrough()
  @PortNumber({
    title: 'Index',
    description: 'The index of the element to extract',
    defaultValue: 0,
    integer: true,
  })
  index: number = 0

  @Output()
  @PortAny({
    title: 'Element',
    description: 'The extracted element from the array',
  })
  element: any = null

  async execute(context: ExecutionContext): Promise<NodeExecutionResult> {
    // Reset the element value
    this.element = null

    // Check if array is valid
    if (!Array.isArray(this.array)) {
      throw new TypeError('The "array" is empty or not an array')
    }

    // Check if index is within bounds
    if (this.index < 0 || this.index >= this.array.length) {
      throw new RangeError(`Index ${this.index} is out of bounds for array of length ${this.array.length}`)
    }

    // Extract the element
    this.element = this.array[this.index]

    return {}
  }
}

export default ArrayElementNode
