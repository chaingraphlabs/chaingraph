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
  ObjectPort,
} from '@badaitech/chaingraph-types'

import {
  BaseNode,
  deepCopy,
  Node,
  OnPortUpdate,
  Output,
  Passthrough,
  PortArray,
  PortObject,
} from '@badaitech/chaingraph-types'

import { NODE_CATEGORIES } from '../../../categories'

@Node({
  type: 'ArrayPickNode',
  title: 'Array Pick',
  description: 'Pick specific fields from objects in an array using a schema template. Type: Array<T> × Schema<K> → Array<K>',
  category: NODE_CATEGORIES.TRANSFORMS,
  tags: ['array', 'pick', 'project', 'select', 'fields', 'schema', 'transform'],
})
class ArrayPickNode extends BaseNode {
  @Passthrough()
  @PortArray({
    title: 'Array',
    description: 'The array of objects to pick from',
    itemConfig: {
      type: 'object',
      schema: { properties: {} },
      isSchemaMutable: true,
    },
    isMutable: true,
    isSchemaMutable: true,
  })
  array: object[] = []

  @Passthrough()
  @PortObject({
    title: 'Pick Schema',
    description: 'Define the fields to extract (connect an Object Node to define the schema)',
    schema: { properties: {} },
    isSchemaMutable: true,
  })
  @OnPortUpdate(async (node: INode, port: IPort) => {
    const schemaPort = port as ObjectPort
    const resultPort = node.findPort(
      p => p.getConfig().key === 'result'
        && !p.getConfig().parentId
        && p.getConfig().direction === 'output',
    ) as ArrayPort | undefined

    if (!resultPort) {
      return
    }

    const schema = schemaPort.getConfig().schema
    resultPort.setConfig({
      ...resultPort.getConfig(),
      itemConfig: {
        type: 'object',
        schema: deepCopy(schema),
        isSchemaMutable: false,
      },
    })
    node.updateArrayItemConfig(resultPort as IPort)
  })
  pickSchema: Record<string, any> = {}

  @Output()
  @PortArray({
    title: 'Result',
    description: 'The array with picked fields',
    itemConfig: {
      type: 'object',
      schema: { properties: {} },
      isSchemaMutable: true,
    },
    isSchemaMutable: true,
  })
  result: object[] = []

  async execute(context: ExecutionContext): Promise<NodeExecutionResult> {
    // Handle empty or invalid array
    if (!Array.isArray(this.array)) {
      this.result = []
      return {}
    }

    // Get the keys to pick from the schema
    const keys = Object.keys(this.pickSchema || {})

    // If no keys defined, return empty objects
    if (keys.length === 0) {
      this.result = this.array.map(() => ({}))
      return {}
    }

    // Pick only the specified keys from each object
    this.result = this.array.map((item) => {
      if (!item || typeof item !== 'object') {
        return {}
      }

      const picked: Record<string, any> = {}
      for (const key of keys) {
        if (key in item) {
          picked[key] = (item as any)[key]
        }
      }
      return picked
    })

    return {}
  }
}

export default ArrayPickNode
