/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { ExecutionContext, NodeExecutionResult } from '@badaitech/chaingraph-types'
import { BaseNode, Input, Node, ObjectSchema, PortObject, String, Title } from '@badaitech/chaingraph-types'
import { NODE_CATEGORIES } from '../../categories'

@ObjectSchema({
  description: 'Event data emitted by the emitter',
})
class EventData {
  @Title('Event Name')
  @String({ defaultValue: '' })
  eventName: string = ''
}

@Node({
  type: 'EventEmitterNode',
  title: 'Event Emitter',
  description: 'Emits events that can trigger event listeners',
  category: NODE_CATEGORIES.FLOW,
  tags: ['flow', 'event', 'emitter', 'trigger', 'action', 'logic'],
})
class EventEmitterNode extends BaseNode {
  @Input()
  @PortObject({
    title: 'Event Data',
    description: 'Data to emit when the event is triggered',
    schema: EventData,
  })
  eventData: EventData = new EventData()

  async execute(context: ExecutionContext): Promise<NodeExecutionResult> {
    const eventName = this.eventData.eventName
    console.log(`[EventEmitterNode ${this.id}] Executing with eventName: "${eventName}", isChildExecution: ${context.isChildExecution}`)

    if (!eventName) {
      throw new Error('Event name is required to emit an event')
    }

    // Use the new event emission API if available
    if (context.emitEvent) {
      console.log(`[EventEmitterNode ${this.id}] Emitting event: "${eventName}"`)
      context.emitEvent(eventName, this.eventData)
      console.log(`[EventEmitterNode ${this.id}] Event emitted successfully`)
      console.log(`[EventEmitterNode ${this.id}] Current emittedEvents:`, context.emittedEvents)
    } else {
      throw new Error('Event emission is not supported in this context')
    }

    return {}
  }
}

export default EventEmitterNode
