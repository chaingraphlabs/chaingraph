/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { ExecutionContext, NodeExecutionResult } from '@badaitech/chaingraph-types'
import { BaseNode, Input, Node, PortObject, PortString } from '@badaitech/chaingraph-types'
import { NODE_CATEGORIES } from '../../categories'

@Node({
  type: 'EventEmitterNode',
  title: 'Event Emitter',
  description: 'Emits events that can trigger event listeners',
  category: NODE_CATEGORIES.FLOW,
  tags: ['flow', 'event', 'emitter', 'trigger', 'action', 'logic'],
})
class EventEmitterNode extends BaseNode {
  @Input()
  @PortString({
    title: 'Event Name',
    description: 'Name of the event to emit',
    defaultValue: '',
  })
  eventName: string = ''

  @Input()
  @PortObject({
    title: 'Payload',
    description: 'Data payload to emit with the event',
    order: 2,
    isSchemaMutable: true,
    schema: {
      type: 'object',
      properties: {},
    },
    ui: {
      keyDeletable: true,
      hidePropertyEditor: true,
    },
  })
  payload: Record<string, any> = {}

  async execute(context: ExecutionContext): Promise<NodeExecutionResult> {
    const eventName = this.eventName
    if (!eventName) {
      throw new Error('Event name is required to emit an event')
    }

    // PortObject ensures payload is always an object, so no validation needed

    // Use the new event emission API if available
    if (context.emitEvent) {
      context.emitEvent(eventName, this.payload)
    } else {
      throw new Error('Event emission is not supported in this context')
    }

    return {}
  }
}

export default EventEmitterNode
