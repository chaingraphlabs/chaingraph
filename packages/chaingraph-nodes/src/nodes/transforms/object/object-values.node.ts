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
  IPortConfig,
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
  type: 'ObjectValuesNode',
  title: 'Object Values',
  description: 'Get all values from an object as an array. Type: Object<T> → Array<ValueType<T>>',
  category: NODE_CATEGORIES.TRANSFORMS,
  tags: ['object', 'values', 'properties', 'transform'],
})
class ObjectValuesNode extends BaseNode {
  @Passthrough()
  @PortObject({
    title: 'Object',
    description: 'The object to extract values from',
    schema: { properties: {} },
    isSchemaMutable: true,
  })
  @OnPortUpdate(async (node: INode, port: IPort) => {
    const objectPort = port as ObjectPort
    const valuesPort = node.findPort(
      p => p.getConfig().key === 'values'
        && !p.getConfig().parentId
        && p.getConfig().direction === 'output',
    ) as ArrayPort | undefined

    if (!valuesPort) {
      return
    }

    const schema = objectPort.getConfig().schema
    const properties = schema?.properties || {}
    const propertyConfigs = Object.values(properties) as IPortConfig[]

    // Try to infer a common type if all properties have the same type
    let itemConfig: IPortConfig = { type: 'any' }

    if (propertyConfigs.length > 0) {
      const firstType = propertyConfigs[0].type
      const allSameType = propertyConfigs.every(p => p.type === firstType)

      if (allSameType) {
        // All properties have the same type - use that
        itemConfig = deepCopy(propertyConfigs[0])
      }
    }

    valuesPort.setConfig({
      ...valuesPort.getConfig(),
      itemConfig,
    })
    node.updateArrayItemConfig(valuesPort as IPort)
  })
  object: Record<string, any> = {}

  @Output()
  @PortArray({
    title: 'Values',
    description: 'Array of property values',
    itemConfig: {
      type: 'any',
      title: 'Value',
    },
  })
  values: any[] = []

  async execute(context: ExecutionContext): Promise<NodeExecutionResult> {
    // Handle invalid object
    if (!this.object || typeof this.object !== 'object') {
      this.values = []
      return {}
    }

    this.values = Object.values(this.object)
    return {}
  }
}

export default ObjectValuesNode
