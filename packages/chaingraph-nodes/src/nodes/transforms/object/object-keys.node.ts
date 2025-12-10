/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type {
  ExecutionContext,
  NodeExecutionResult,
} from '@badaitech/chaingraph-types'

import {
  BaseNode,
  Node,
  Output,
  Passthrough,
  PortArray,
  PortObject,
} from '@badaitech/chaingraph-types'

import { NODE_CATEGORIES } from '../../../categories'

@Node({
  type: 'ObjectKeysNode',
  title: 'Object Keys',
  description: 'Get all keys from an object as an array of strings. Type: Object<T> → Array<string>',
  category: NODE_CATEGORIES.TRANSFORMS,
  tags: ['object', 'keys', 'properties', 'names', 'transform'],
})
class ObjectKeysNode extends BaseNode {
  @Passthrough()
  @PortObject({
    title: 'Object',
    description: 'The object to extract keys from',
    schema: { properties: {} },
    isSchemaMutable: true,
  })
  object: Record<string, any> = {}

  @Output()
  @PortArray({
    title: 'Keys',
    description: 'Array of property keys',
    itemConfig: {
      type: 'string',
      title: 'Key',
    },
  })
  keys: string[] = []

  async execute(context: ExecutionContext): Promise<NodeExecutionResult> {
    // Handle invalid object
    if (!this.object || typeof this.object !== 'object') {
      this.keys = []
      return {}
    }

    this.keys = Object.keys(this.object)
    return {}
  }
}

export default ObjectKeysNode
