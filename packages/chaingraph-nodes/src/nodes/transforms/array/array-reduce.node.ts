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
  type: 'ArrayReduceNode',
  title: 'Array Reduce',
  description: 'Aggregate array elements using built-in operations. Type: Array<T> × Operation → number | string | T',
  category: NODE_CATEGORIES.TRANSFORMS,
  tags: ['array', 'reduce', 'aggregate', 'sum', 'avg', 'min', 'max', 'count', 'transform'],
})
class ArrayReduceNode extends BaseNode {
  @Passthrough()
  @PortArray({
    title: 'Array',
    description: 'The array to reduce',
    itemConfig: {
      type: 'any',
      title: 'Item',
    },
    isMutable: true,
    isSchemaMutable: true,
  })
  array: any[] = []

  @Input()
  @PortEnum({
    title: 'Operation',
    description: 'The aggregation operation to perform',
    options: [
      { id: 'sum', type: 'string', title: 'Sum', defaultValue: 'sum' },
      { id: 'avg', type: 'string', title: 'Average', defaultValue: 'avg' },
      { id: 'min', type: 'string', title: 'Minimum', defaultValue: 'min' },
      { id: 'max', type: 'string', title: 'Maximum', defaultValue: 'max' },
      { id: 'count', type: 'string', title: 'Count', defaultValue: 'count' },
      { id: 'first', type: 'string', title: 'First', defaultValue: 'first' },
      { id: 'last', type: 'string', title: 'Last', defaultValue: 'last' },
      { id: 'concat', type: 'string', title: 'Concat (arrays)', defaultValue: 'concat' },
      { id: 'join', type: 'string', title: 'Join (strings)', defaultValue: 'join' },
    ],
    defaultValue: 'sum',
  })
  @OnPortUpdate(async (node: INode) => {
    const reduceNode = node as ArrayReduceNode
    reduceNode.updateResultType()
  })
  operation: string = 'sum'

  @Input()
  @PortString({
    title: 'Path',
    description: 'Property path for object arrays (e.g., "price", "data.value"). Leave empty for simple arrays.',
    defaultValue: '',
  })
  path: string = ''

  @Input()
  @PortString({
    title: 'Separator',
    description: 'Separator for join operation',
    defaultValue: ',',
  })
  separator: string = ','

  @Output()
  @PortAny({
    title: 'Result',
    description: 'The aggregated result',
  })
  result: any = null

  private updateResultType() {
    const resultPort = this.findPort(
      p => p.getConfig().key === 'result'
        && !p.getConfig().parentId
        && p.getConfig().direction === 'output',
    ) as AnyPort | undefined

    if (!resultPort) {
      return
    }

    // Set output type based on operation
    let resultType: any = { type: 'any' }

    switch (this.operation) {
      case 'sum':
      case 'avg':
      case 'min':
      case 'max':
      case 'count':
        resultType = { type: 'number', defaultValue: 0 }
        break
      case 'join':
        resultType = { type: 'string', defaultValue: '' }
        break
      case 'concat':
        resultType = { type: 'array', itemConfig: { type: 'any' } }
        break
      case 'first':
      case 'last': {
        // Try to get type from array
        const arrayPort = this.findPort(
          p => p.getConfig().key === 'array' && !p.getConfig().parentId,
        ) as ArrayPort | undefined

        if (arrayPort) {
          const itemConfig = arrayPort.getConfig().itemConfig
          resultType = deepCopy(itemConfig)
        }
        break
      }
    }

    resultPort.setUnderlyingType({
      ...resultType,
      direction: 'output',
      ui: { hideEditor: true },
    })
    this.refreshAnyPortUnderlyingPorts(resultPort as IPort, true)
  }

  async execute(context: ExecutionContext): Promise<NodeExecutionResult> {
    // Handle empty or invalid array
    if (!Array.isArray(this.array) || this.array.length === 0) {
      switch (this.operation) {
        case 'sum':
        case 'avg':
        case 'min':
        case 'max':
          this.result = 0
          break
        case 'count':
          this.result = 0
          break
        case 'join':
          this.result = ''
          break
        case 'concat':
          this.result = []
          break
        case 'first':
        case 'last':
          this.result = null
          break
        default:
          this.result = null
      }
      return {}
    }

    // Get values (with optional path extraction)
    const values = this.path
      ? this.array.map(item => getByPath(item, this.path))
      : this.array

    switch (this.operation) {
      case 'sum': {
        const nums = values.filter(v => typeof v === 'number')
        this.result = nums.reduce((sum, n) => sum + n, 0)
        break
      }

      case 'avg': {
        const nums = values.filter(v => typeof v === 'number')
        this.result = nums.length > 0 ? nums.reduce((sum, n) => sum + n, 0) / nums.length : 0
        break
      }

      case 'min': {
        const nums = values.filter(v => typeof v === 'number')
        this.result = nums.length > 0 ? Math.min(...nums) : 0
        break
      }

      case 'max': {
        const nums = values.filter(v => typeof v === 'number')
        this.result = nums.length > 0 ? Math.max(...nums) : 0
        break
      }

      case 'count':
        this.result = this.array.length
        break

      case 'first':
        this.result = values[0]
        break

      case 'last':
        this.result = values[values.length - 1]
        break

      case 'concat': {
        this.result = values.flat()
        break
      }

      case 'join':
        this.result = values.map(v => String(v ?? '')).join(this.separator)
        break

      default:
        this.result = null
    }

    return {}
  }
}

export default ArrayReduceNode
