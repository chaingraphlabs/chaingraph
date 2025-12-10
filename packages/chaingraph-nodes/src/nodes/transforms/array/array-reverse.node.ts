/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type {
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
  PortArray,
} from '@badaitech/chaingraph-types'

import { NODE_CATEGORIES } from '../../../categories'

@Node({
  type: 'ArrayReverseNode',
  title: 'Array Reverse',
  description: 'Reverse the order of elements in an array. Type: Array<T> → Array<T>',
  category: NODE_CATEGORIES.TRANSFORMS,
  tags: ['array', 'reverse', 'flip', 'order', 'transform'],
})
class ArrayReverseNode extends BaseNode {
  @Passthrough()
  @PortArray({
    title: 'Array',
    description: 'The array to reverse',
    itemConfig: {
      type: 'any',
      title: 'Item',
    },
    isMutable: true,
    isSchemaMutable: true,
  })
  @OnPortUpdate(async (node: INode, port: IPort) => {
    const arrayPort = port as ArrayPort
    const resultPort = node.findPort(
      p => p.getConfig().key === 'result'
        && !p.getConfig().parentId
        && p.getConfig().direction === 'output',
    ) as ArrayPort | undefined

    if (!resultPort) {
      return
    }

    resultPort.setConfig({
      ...resultPort.getConfig(),
      itemConfig: deepCopy(arrayPort.getConfig().itemConfig),
    })
    node.updateArrayItemConfig(resultPort as IPort)
  })
  array: any[] = []

  @Output()
  @PortArray({
    title: 'Result',
    description: 'The reversed array',
    itemConfig: {
      type: 'any',
      title: 'Item',
    },
  })
  result: any[] = []

  async execute(context: ExecutionContext): Promise<NodeExecutionResult> {
    // Handle empty or invalid array
    if (!Array.isArray(this.array)) {
      this.result = []
      return {}
    }

    // Create a new reversed array (immutable operation)
    this.result = [...this.array].reverse()
    return {}
  }
}

export default ArrayReverseNode
