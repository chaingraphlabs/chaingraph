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
  BaseNode,
  deepCopy,
  Node,
  OnPortUpdate,
  Output,
  Passthrough,
  PortAny,
  PortArray,
  PortBoolean,
} from '@badaitech/chaingraph-types'

import { NODE_CATEGORIES } from '../../../categories'

@Node({
  type: 'ArrayLastNode',
  title: 'Array Last',
  description: 'Extract the last element from an array. Type: Array<T> → T',
  category: NODE_CATEGORIES.TRANSFORMS,
  tags: ['array', 'last', 'extract', 'tail', 'transform'],
})
class ArrayLastNode extends BaseNode {
  @Passthrough()
  @PortArray({
    title: 'Array',
    description: 'The array to extract the last element from',
    itemConfig: {
      type: 'any',
      title: 'Item',
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

    const arrayPort = port as ArrayPort
    const itemConfig = arrayPort.getConfig().itemConfig

    elementPort.setUnderlyingType(deepCopy({
      ...itemConfig,
      direction: 'output',
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

  @Output()
  @PortAny({
    title: 'Element',
    description: 'The last element from the array',
  })
  element: any = null

  @Output()
  @PortBoolean({
    title: 'Is Empty',
    description: 'True if the array is empty or undefined',
    defaultValue: true,
  })
  isEmpty: boolean = true

  async execute(context: ExecutionContext): Promise<NodeExecutionResult> {
    // Handle empty or invalid array
    if (!Array.isArray(this.array) || this.array.length === 0) {
      this.element = null
      this.isEmpty = true
      return {}
    }

    this.element = this.array[this.array.length - 1]
    this.isEmpty = false
    return {}
  }
}

export default ArrayLastNode
