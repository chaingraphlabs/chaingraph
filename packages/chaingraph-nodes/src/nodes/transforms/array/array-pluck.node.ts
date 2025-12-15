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
  PortString,
} from '@badaitech/chaingraph-types'

import { NODE_CATEGORIES } from '../../../categories'
import { getByPath, getTypeAtPath } from '../utils'

@Node({
  type: 'ArrayPluckNode',
  title: 'Array Pluck',
  description: 'Extract a property from each object in an array using a path. Type: Array<T> × Path → Array<T[Path]>',
  category: NODE_CATEGORIES.TRANSFORMS,
  tags: ['array', 'pluck', 'extract', 'property', 'path', 'map', 'transform'],
})
class ArrayPluckNode extends BaseNode {
  @Passthrough()
  @PortArray({
    title: 'Array',
    description: 'The array to pluck from',
    itemConfig: {
      type: 'any',
      title: 'Item',
    },
    isMutable: true,
    isSchemaMutable: true,
  })
  @OnPortUpdate(async (node: INode, port: IPort) => {
    const pluckNode = node as ArrayPluckNode
    const arrayPort = port as ArrayPort
    const itemConfig = arrayPort.getConfig().itemConfig

    const resultPort = node.findPort(
      p => p.getConfig().key === 'result'
        && !p.getConfig().parentId
        && p.getConfig().direction === 'output',
    ) as ArrayPort | undefined

    if (!resultPort) {
      return
    }

    // Try to infer type at path
    if (pluckNode.path && itemConfig) {
      const typeAtPath = getTypeAtPath(itemConfig, pluckNode.path)
      if (typeAtPath) {
        resultPort.setConfig({
          ...resultPort.getConfig(),
          itemConfig: deepCopy(typeAtPath),
        })
        node.updateArrayItemConfig(resultPort as IPort)
        return
      }
    }

    // Fallback: any type
    resultPort.setConfig({
      ...resultPort.getConfig(),
      itemConfig: { type: 'any' },
    })
    node.updateArrayItemConfig(resultPort as IPort)
  })
  array: any[] = []

  @Input()
  @PortString({
    title: 'Path',
    description: 'Property path (e.g., "user.email", "items[0].name")',
    defaultValue: '',
  })
  @OnPortUpdate(async (node: INode) => {
    // Re-trigger type inference when path changes
    const arrayPort = node.findPort(
      p => p.getConfig().key === 'array'
        && !p.getConfig().parentId,
    ) as ArrayPort | undefined

    if (!arrayPort) {
      return
    }

    const pluckNode = node as ArrayPluckNode
    const itemConfig = arrayPort.getConfig().itemConfig

    const resultPort = node.findPort(
      p => p.getConfig().key === 'result'
        && !p.getConfig().parentId
        && p.getConfig().direction === 'output',
    ) as ArrayPort | undefined

    if (!resultPort) {
      return
    }

    // Try to infer type at path
    if (pluckNode.path && itemConfig) {
      const typeAtPath = getTypeAtPath(itemConfig, pluckNode.path)
      if (typeAtPath) {
        resultPort.setConfig({
          ...resultPort.getConfig(),
          itemConfig: deepCopy(typeAtPath),
        })
        node.updateArrayItemConfig(resultPort as IPort)
        return
      }
    }

    // Fallback: any type
    resultPort.setConfig({
      ...resultPort.getConfig(),
      itemConfig: { type: 'any' },
    })
    node.updateArrayItemConfig(resultPort as IPort)
  })
  path: string = ''

  @Output()
  @PortArray({
    title: 'Result',
    description: 'Array of plucked values',
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

    // Handle empty path - return items as-is
    if (!this.path) {
      this.result = [...this.array]
      return {}
    }

    // Pluck the value at the path from each item
    this.result = this.array.map(item => getByPath(item, this.path))
    return {}
  }
}

export default ArrayPluckNode
