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
  Input,
  Node,
  OnPortUpdate,
  Output,
  Passthrough,
  PortArray,
  PortNumber,
} from '@badaitech/chaingraph-types'

import { NODE_CATEGORIES } from '../../../categories'

@Node({
  type: 'ArraySliceNode',
  title: 'Array Slice',
  description: 'Extract a portion of an array. Type: Array<T> → Array<T>',
  category: NODE_CATEGORIES.TRANSFORMS,
  tags: ['array', 'slice', 'subset', 'range', 'transform'],
})
class ArraySliceNode extends BaseNode {
  @Passthrough()
  @PortArray({
    title: 'Array',
    description: 'The array to slice',
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

  @Input()
  @PortNumber({
    title: 'Start',
    description: 'The starting index (inclusive). Negative values count from the end.',
    defaultValue: 0,
    integer: true,
  })
  start: number = 0

  @Input()
  @PortNumber({
    title: 'End',
    description: 'The ending index (exclusive). Use -1 or leave empty for end of array.',
    defaultValue: -1,
    integer: true,
  })
  end: number = -1

  @Output()
  @PortArray({
    title: 'Result',
    description: 'The sliced array',
    itemConfig: {
      type: 'any',
      title: 'Item',
    },
    isSchemaMutable: true,
  })
  result: any[] = []

  async execute(context: ExecutionContext): Promise<NodeExecutionResult> {
    // Handle empty or invalid array
    if (!Array.isArray(this.array)) {
      this.result = []
      return {}
    }

    // Use -1 as sentinel for "to the end"
    const endIndex = this.end === -1 ? undefined : this.end
    this.result = this.array.slice(this.start, endIndex)
    return {}
  }
}

export default ArraySliceNode
