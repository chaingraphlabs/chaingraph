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
  PortEnum,
} from '@badaitech/chaingraph-types'

import { NODE_CATEGORIES } from '../../../categories'

@Node({
  type: 'ArrayZipNode',
  title: 'Array Zip',
  description: 'Combine two arrays element-wise. Type: Array<A> × Array<B> → Array<{a: A, b: B}>',
  category: NODE_CATEGORIES.TRANSFORMS,
  tags: ['array', 'zip', 'combine', 'pair', 'merge', 'transform'],
})
class ArrayZipNode extends BaseNode {
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
  @OnPortUpdate(async (node: INode) => {
    (node as ArrayZipNode).updateResultType()
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
  @OnPortUpdate(async (node: INode) => {
    (node as ArrayZipNode).updateResultType()
  })
  arrayB: any[] = []

  @Input()
  @PortEnum({
    title: 'Length Strategy',
    description: 'How to handle arrays of different lengths',
    options: [
      { id: 'shortest', type: 'string', title: 'Shortest', defaultValue: 'shortest' },
      { id: 'longest', type: 'string', title: 'Longest (null for missing)', defaultValue: 'longest' },
      { id: 'first', type: 'string', title: 'Use first array length', defaultValue: 'first' },
      { id: 'second', type: 'string', title: 'Use second array length', defaultValue: 'second' },
    ],
    defaultValue: 'shortest',
  })
  lengthStrategy: 'shortest' | 'longest' | 'first' | 'second' = 'shortest'

  @Output()
  @PortArray({
    title: 'Result',
    description: 'The zipped array of pairs',
    itemConfig: {
      type: 'object',
      schema: {
        properties: {
          a: { type: 'any', title: 'A' },
          b: { type: 'any', title: 'B' },
        },
      },
    },
    isSchemaMutable: true,
  })
  result: Array<{ a: any, b: any }> = []

  private updateResultType() {
    const portA = this.findPort(
      p => p.getConfig().key === 'arrayA' && !p.getConfig().parentId,
    ) as ArrayPort | undefined

    const portB = this.findPort(
      p => p.getConfig().key === 'arrayB' && !p.getConfig().parentId,
    ) as ArrayPort | undefined

    const resultPort = this.findPort(
      p => p.getConfig().key === 'result'
        && !p.getConfig().parentId
        && p.getConfig().direction === 'output',
    ) as ArrayPort | undefined

    if (!resultPort) {
      return
    }

    const itemConfigA = portA?.getConfig().itemConfig || { type: 'any' }
    const itemConfigB = portB?.getConfig().itemConfig || { type: 'any' }

    // Compose types: {a: A, b: B}
    resultPort.setConfig({
      ...resultPort.getConfig(),
      itemConfig: {
        type: 'object',
        schema: {
          properties: {
            a: { ...deepCopy(itemConfigA), title: 'A', key: 'a' },
            b: { ...deepCopy(itemConfigB), title: 'B', key: 'b' },
          },
        },
        isSchemaMutable: false,
      },
    })
    this.updateArrayItemConfig(resultPort as IPort)
  }

  async execute(context: ExecutionContext): Promise<NodeExecutionResult> {
    const a = Array.isArray(this.arrayA) ? this.arrayA : []
    const b = Array.isArray(this.arrayB) ? this.arrayB : []

    let length: number
    switch (this.lengthStrategy) {
      case 'shortest':
        length = Math.min(a.length, b.length)
        break
      case 'longest':
        length = Math.max(a.length, b.length)
        break
      case 'first':
        length = a.length
        break
      case 'second':
        length = b.length
        break
      default:
        length = Math.min(a.length, b.length)
    }

    this.result = []
    for (let i = 0; i < length; i++) {
      this.result.push({
        a: a[i] ?? null,
        b: b[i] ?? null,
      })
    }

    return {}
  }
}

export default ArrayZipNode
