/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type {
  ExecutionContext,
  INode,
  NodeEvent,
  NodeExecutionResult,
  PortUpdateEvent,
} from '@badaitech/chaingraph-types'
import {
  BaseNode,
  Boolean,
  findPortByKey,
  Input,
  Node,
  NodeEventType,
  Number,
  ObjectSchema,
  Output,
  PortObject,
  PortVisibility,
  String,
} from '@badaitech/chaingraph-types'
import { NODE_CATEGORIES } from '../categories'

@ObjectSchema()
class Address {
  @String()
  street: string = ''

  @Number()
  number: number = 0
}

@ObjectSchema()
class User {
  @String()
  name: string = ''

  @Number()
  age: number = 0

  @PortObject({
    schema: Address,
  })
  address: Address = new Address()
}

@Node({
  type: 'TestNode',
  title: 'Test node',
  description: 'Test node',
  category: NODE_CATEGORIES.UTILITIES,
  tags: ['test'],
})
class TestNode extends BaseNode {
  @Input()
  @String({
    title: 'Message',
    description: 'Message to log',
  })
  message: string = ''

  @Input()
  @String({
    title: 'Message suffix',
    description: 'Message suffix',
  })
  messageSuffix: string = ''

  @Input()
  @Boolean({
    title: 'Message',
    description: 'Message to log',
  })
  @PortVisibility({
    showIf: (instance: INode) => (instance as TestNode).message.length > 0,
  })
  emptyText: boolean = true

  @Input()
  @PortObject({
    schema: {
      properties: {},
    },
    ui: {
      keyDeletable: true,
    },
    isSchemaMutable: true,
  })
  object: Record<string, unknown> = {}

  @Output()
  @PortObject({
    schema: User,
  })
  objectOut: Record<string, unknown> = {}

  async onEvent(event: NodeEvent): Promise<void> {
    await super.onEvent(event)

    if (
      event.type === NodeEventType.PortUpdate
      && (event as PortUpdateEvent).port.key === 'message'
    ) {
      const portMessageSuffix = findPortByKey(this, 'messageSuffix')
      if (!portMessageSuffix) {
        return
      }

      portMessageSuffix.setValue(`${this.message} [suffix]`)
      this.updatePort(portMessageSuffix)
    }
  }

  async execute(context: ExecutionContext): Promise<NodeExecutionResult> {
    return {}
  }
}

export default TestNode
