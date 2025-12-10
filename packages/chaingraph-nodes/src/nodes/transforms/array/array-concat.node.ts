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
  type: 'ArrayConcatNode',
  title: 'Array Concat',
  description: 'Concatenate two arrays. Type: Array<A> × Array<B> → Array<A|B>',
  category: NODE_CATEGORIES.TRANSFORMS,
  tags: ['array', 'concat', 'merge', 'combine', 'join', 'transform'],
})
class ArrayConcatNode extends BaseNode {
  @Passthrough()
  @PortArray({
    title: 'Array A',
    description: 'The first array',
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

    // Use first array's itemConfig for the result
    resultPort.setConfig({
      ...resultPort.getConfig(),
      itemConfig: deepCopy(arrayPort.getConfig().itemConfig),
    })
    node.updateArrayItemConfig(resultPort as IPort)
  })
  arrayA: any[] = []

  @Passthrough()
  @PortArray({
    title: 'Array B',
    description: 'The second array',
    itemConfig: {
      type: 'any',
      title: 'Item',
    },
    isMutable: true,
    isSchemaMutable: true,
  })
  arrayB: any[] = []

  @Output()
  @PortArray({
    title: 'Result',
    description: 'The concatenated array',
    itemConfig: {
      type: 'any',
      title: 'Item',
    },
    isSchemaMutable: true,
  })
  result: any[] = []

  async execute(context: ExecutionContext): Promise<NodeExecutionResult> {
    const a = Array.isArray(this.arrayA) ? this.arrayA : []
    const b = Array.isArray(this.arrayB) ? this.arrayB : []

    this.result = [...a, ...b]
    return {}
  }
}

export default ArrayConcatNode
