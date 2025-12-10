/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type {
  AnyPort,
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
  PortString,
} from '@badaitech/chaingraph-types'

import { NODE_CATEGORIES } from '../../../categories'
import { getByPath, getTypeAtPath } from '../utils'

@Node({
  type: 'TypeFocusNode',
  title: 'Type Focus',
  description: 'Navigate to a nested type using a path (lens pattern). Type: T × Path → T[Path]',
  category: NODE_CATEGORIES.TRANSFORMS,
  tags: ['type', 'focus', 'lens', 'path', 'navigate', 'nested', 'transform', 'algebra'],
})
class TypeFocusNode extends BaseNode {
  @Passthrough()
  @PortAny({
    title: 'Source',
    description: 'The source value to navigate',
  })
  @OnPortUpdate(async (node: INode, port: IPort) => {
    const focusNode = node as TypeFocusNode
    focusNode.updateFocusedType()
  })
  source: any = null

  @Input()
  @PortString({
    title: 'Path',
    description: 'Navigation path (e.g., "user.address.city", "data.items[0].name")',
    defaultValue: '',
  })
  @OnPortUpdate(async (node: INode) => {
    const focusNode = node as TypeFocusNode
    focusNode.updateFocusedType()
  })
  path: string = ''

  @Output()
  @PortAny({
    title: 'Focused',
    description: 'The value at the specified path',
  })
  focused: any = null

  private updateFocusedType() {
    const sourcePort = this.findPort(
      p => p.getConfig().key === 'source' && !p.getConfig().parentId,
    ) as AnyPort | undefined

    const focusedPort = this.findPort(
      p => p.getConfig().key === 'focused'
        && !p.getConfig().parentId
        && p.getConfig().direction === 'output',
    ) as AnyPort | undefined

    if (!focusedPort) {
      return
    }

    const underlying = sourcePort?.unwrapUnderlyingType()

    if (!underlying || !this.path) {
      // No path or source type - clear or pass through
      if (underlying) {
        focusedPort.setUnderlyingType(deepCopy({
          ...underlying,
          direction: 'output',
          ui: { hideEditor: true, collapsed: true },
        }))
      } else {
        focusedPort.setUnderlyingType(undefined)
      }
      this.refreshAnyPortUnderlyingPorts(focusedPort as IPort, true)
      return
    }

    // Try to infer type at path
    const typeAtPath = getTypeAtPath(underlying, this.path)

    if (typeAtPath) {
      focusedPort.setUnderlyingType(deepCopy({
        ...typeAtPath,
        direction: 'output',
        ui: {
          ...typeAtPath.ui,
          hideEditor: true,
          collapsed: true,
        },
      }))
    } else {
      // Path not found in type - use any
      focusedPort.setUnderlyingType({
        type: 'any',
        direction: 'output',
        ui: { hideEditor: true },
      })
    }

    this.refreshAnyPortUnderlyingPorts(focusedPort as IPort, true)
  }

  async execute(context: ExecutionContext): Promise<NodeExecutionResult> {
    // Navigate the value using the path
    if (!this.path) {
      this.focused = this.source
    } else {
      this.focused = getByPath(this.source, this.path)
    }

    return {}
  }
}

export default TypeFocusNode
