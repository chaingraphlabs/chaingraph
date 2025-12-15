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
  PortAny,
  PortArray,
  PortEnum,
  PortString,
} from '@badaitech/chaingraph-types'

import { NODE_CATEGORIES } from '../../../categories'
import { getByPath } from '../utils'

@Node({
  type: 'ArrayPartitionNode',
  title: 'Array Partition',
  description: 'Split an array into two based on a predicate. Type: Array<T> × Predicate → (Array<T>, Array<T>)',
  category: NODE_CATEGORIES.TRANSFORMS,
  tags: ['array', 'partition', 'split', 'filter', 'separate', 'transform'],
})
class ArrayPartitionNode extends BaseNode {
  @Passthrough()
  @PortArray({
    title: 'Array',
    description: 'The array to partition',
    itemConfig: {
      type: 'any',
      title: 'Item',
    },
    isMutable: true,
    isSchemaMutable: true,
  })
  @OnPortUpdate(async (node: INode, port: IPort) => {
    const arrayPort = port as ArrayPort
    const itemConfig = arrayPort.getConfig().itemConfig

    // Update both output arrays with the same itemConfig
    const matchingPort = node.findPort(
      p => p.getConfig().key === 'matching'
        && !p.getConfig().parentId
        && p.getConfig().direction === 'output',
    ) as ArrayPort | undefined

    const nonMatchingPort = node.findPort(
      p => p.getConfig().key === 'nonMatching'
        && !p.getConfig().parentId
        && p.getConfig().direction === 'output',
    ) as ArrayPort | undefined

    if (matchingPort) {
      matchingPort.setConfig({
        ...matchingPort.getConfig(),
        itemConfig: deepCopy(itemConfig),
      })
      node.updateArrayItemConfig(matchingPort as IPort)
    }

    if (nonMatchingPort) {
      nonMatchingPort.setConfig({
        ...nonMatchingPort.getConfig(),
        itemConfig: deepCopy(itemConfig),
      })
      node.updateArrayItemConfig(nonMatchingPort as IPort)
    }
  })
  array: any[] = []

  @Input()
  @PortString({
    title: 'Path',
    description: 'Property path to test (e.g., "status", "user.active"). Leave empty to test the item itself.',
    defaultValue: '',
  })
  path: string = ''

  @Input()
  @PortEnum({
    title: 'Operator',
    description: 'Comparison operator',
    options: [
      { id: 'eq', type: 'string', title: 'Equals (==)', defaultValue: 'eq' },
      { id: 'neq', type: 'string', title: 'Not Equals (!=)', defaultValue: 'neq' },
      { id: 'gt', type: 'string', title: 'Greater Than (>)', defaultValue: 'gt' },
      { id: 'gte', type: 'string', title: 'Greater Than or Equal (>=)', defaultValue: 'gte' },
      { id: 'lt', type: 'string', title: 'Less Than (<)', defaultValue: 'lt' },
      { id: 'lte', type: 'string', title: 'Less Than or Equal (<=)', defaultValue: 'lte' },
      { id: 'truthy', type: 'string', title: 'Truthy', defaultValue: 'truthy' },
      { id: 'falsy', type: 'string', title: 'Falsy', defaultValue: 'falsy' },
      { id: 'contains', type: 'string', title: 'Contains (string/array)', defaultValue: 'contains' },
      { id: 'startsWith', type: 'string', title: 'Starts With (string)', defaultValue: 'startsWith' },
      { id: 'endsWith', type: 'string', title: 'Ends With (string)', defaultValue: 'endsWith' },
    ],
    defaultValue: 'eq',
  })
  operator: string = 'eq'

  @Input()
  @PortAny({
    title: 'Value',
    description: 'The value to compare against (not used for truthy/falsy)',
  })
  value: any = null

  @Output()
  @PortArray({
    title: 'Matching',
    description: 'Elements that match the predicate',
    itemConfig: {
      type: 'any',
      title: 'Item',
    },
    isSchemaMutable: true,
  })
  matching: any[] = []

  @Output()
  @PortArray({
    title: 'Non-Matching',
    description: 'Elements that do not match the predicate',
    itemConfig: {
      type: 'any',
      title: 'Item',
    },
    isSchemaMutable: true,
  })
  nonMatching: any[] = []

  private evaluatePredicate(itemValue: any): boolean {
    switch (this.operator) {
      case 'eq':
        return itemValue === this.value
      case 'neq':
        return itemValue !== this.value
      case 'gt':
        return itemValue > this.value
      case 'gte':
        return itemValue >= this.value
      case 'lt':
        return itemValue < this.value
      case 'lte':
        return itemValue <= this.value
      case 'truthy':
        return Boolean(itemValue)
      case 'falsy':
        return !itemValue
      case 'contains':
        if (typeof itemValue === 'string') {
          return itemValue.includes(String(this.value))
        }
        if (Array.isArray(itemValue)) {
          return itemValue.includes(this.value)
        }
        return false
      case 'startsWith':
        return typeof itemValue === 'string' && itemValue.startsWith(String(this.value))
      case 'endsWith':
        return typeof itemValue === 'string' && itemValue.endsWith(String(this.value))
      default:
        return false
    }
  }

  async execute(context: ExecutionContext): Promise<NodeExecutionResult> {
    // Handle empty or invalid array
    if (!Array.isArray(this.array)) {
      this.matching = []
      this.nonMatching = []
      return {}
    }

    this.matching = []
    this.nonMatching = []

    for (const item of this.array) {
      const testValue = this.path ? getByPath(item, this.path) : item
      if (this.evaluatePredicate(testValue)) {
        this.matching.push(item)
      } else {
        this.nonMatching.push(item)
      }
    }

    return {}
  }
}

export default ArrayPartitionNode
