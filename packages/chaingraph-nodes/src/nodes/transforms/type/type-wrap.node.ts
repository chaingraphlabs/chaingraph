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
  Node,
  OnPortUpdate,
  Output,
  Passthrough,
  PortAny,
  PortArray,
} from '@badaitech/chaingraph-types'

import { NODE_CATEGORIES } from '../../../categories'

@Node({
  type: 'TypeWrapNode',
  title: 'Type Wrap',
  description: 'Wrap a value into an array container. Type: A → Array<A>',
  category: NODE_CATEGORIES.TRANSFORMS,
  tags: ['type', 'wrap', 'array', 'lift', 'container', 'transform', 'algebra'],
})
class TypeWrapNode extends BaseNode {
  @Passthrough()
  @PortAny({
    title: 'Element',
    description: 'The value to wrap in an array',
  })
  @OnPortUpdate(async (node: INode, port: IPort) => {
    const elementPort = port as AnyPort
    const wrappedPort = node.findPort(
      p => p.getConfig().key === 'wrapped'
        && !p.getConfig().parentId
        && p.getConfig().direction === 'output',
    ) as ArrayPort | undefined

    if (!wrappedPort) {
      return
    }

    const underlying = elementPort.unwrapUnderlyingType()

    // Set the array's itemConfig to the element type
    wrappedPort.setConfig({
      ...wrappedPort.getConfig(),
      itemConfig: underlying
        ? deepCopy({
            ...underlying,
            ui: {
              ...underlying.ui,
              hideEditor: true,
            },
          })
        : { type: 'any' },
    })

    node.updateArrayItemConfig(wrappedPort as IPort)
  })
  element: any = null

  @Output()
  @PortArray({
    title: 'Wrapped',
    description: 'The element wrapped in an array',
    itemConfig: {
      type: 'any',
      title: 'Item',
    },
  })
  wrapped: any[] = []

  async execute(context: ExecutionContext): Promise<NodeExecutionResult> {
    // Wrap the element in an array
    if (this.element === null || this.element === undefined) {
      this.wrapped = []
    } else {
      this.wrapped = [this.element]
    }

    return {}
  }
}

export default TypeWrapNode
