/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type {
  AnyPort,
  ArrayPortConfig,
  ExecutionContext,
  INode,
  IPort,
  IPortConfig,
  NodeExecutionResult,
  StreamPortConfig,
} from '@badaitech/chaingraph-types'

import {
  BaseNode,
  deepCopy,
  Node,
  OnPortUpdate,
  Output,
  Passthrough,
  PortAny,
} from '@badaitech/chaingraph-types'

import { NODE_CATEGORIES } from '../../../categories'

@Node({
  type: 'TypeUnwrapNode',
  title: 'Type Unwrap',
  description: 'Extract the inner type from a container (Array, Stream). Type: F<A> → A',
  category: NODE_CATEGORIES.TRANSFORMS,
  tags: ['type', 'unwrap', 'extract', 'container', 'array', 'stream', 'transform', 'algebra'],
})
class TypeUnwrapNode extends BaseNode {
  @Passthrough()
  @PortAny({
    title: 'Container',
    description: 'The container type to unwrap (Array<T>, Stream<T>, etc.)',
  })
  @OnPortUpdate(async (node: INode, port: IPort) => {
    const containerPort = port as AnyPort
    const elementPort = node.findPort(
      p => p.getConfig().key === 'element'
        && !p.getConfig().parentId
        && p.getConfig().direction === 'output',
    ) as AnyPort | undefined

    if (!elementPort) {
      return
    }

    const underlying = containerPort.unwrapUnderlyingType()
    if (!underlying) {
      elementPort.setUnderlyingType(undefined)
      node.refreshAnyPortUnderlyingPorts(elementPort as IPort, true)
      return
    }

    let innerType: IPortConfig | undefined

    // Extract inner type based on container type
    if (underlying.type === 'array') {
      innerType = (underlying as ArrayPortConfig).itemConfig
    } else if (underlying.type === 'stream') {
      innerType = (underlying as StreamPortConfig).itemConfig
    }

    if (innerType) {
      elementPort.setUnderlyingType(deepCopy({
        ...innerType,
        direction: 'output',
        ui: {
          ...innerType.ui,
          hideEditor: true,
          collapsed: true,
        },
      }))
    } else {
      // Not a container type - pass through as-is
      elementPort.setUnderlyingType(deepCopy({
        ...underlying,
        direction: 'output',
        ui: {
          ...underlying.ui,
          hideEditor: true,
          collapsed: true,
        },
      }))
    }

    node.refreshAnyPortUnderlyingPorts(elementPort as IPort, true)
  })
  container: any = null

  @Output()
  @PortAny({
    title: 'Element',
    description: 'The unwrapped inner type',
  })
  element: any = null

  async execute(context: ExecutionContext): Promise<NodeExecutionResult> {
    // For arrays, return the first element
    if (Array.isArray(this.container)) {
      this.element = this.container.length > 0 ? this.container[0] : null
      return {}
    }

    // For other containers or values, pass through
    this.element = this.container
    return {}
  }
}

export default TypeUnwrapNode
