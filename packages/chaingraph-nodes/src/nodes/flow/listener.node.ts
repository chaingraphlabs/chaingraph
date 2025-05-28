/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { ExecutionContext, NodeExecutionResult } from '@badaitech/chaingraph-types'
import { BaseNode, Input, Node, Number, ObjectSchema, Output, PortObject, String, Title } from '@badaitech/chaingraph-types'
import { NODE_CATEGORIES } from '../../categories'

@ObjectSchema({
  description: 'Filter criteria for event listener',
})
class EventListenerFilter {
  @Title('Event Name')
  @String({ defaultValue: '' })
  eventName: string = ''
}

@ObjectSchema({
  description: 'Event data emitted by the listener',
})
class EventData {
  @Title('Event Name')
  @String({ defaultValue: '' })
  eventName: string = ''
}

@Node({
  type: 'EventListenerNode',
  title: 'Event Listener',
  description: 'Listens for specific events and triggers actions',
  category: NODE_CATEGORIES.FLOW,
  tags: ['flow', 'event', 'listener', 'trigger', 'action', 'logic'],
})
class EventListenerNode extends BaseNode {
  @Input()
  @PortObject({
    title: 'Filter',
    description: 'Filter criteria for events',
    schema: EventListenerFilter,
  })
  inputFilter: EventListenerFilter = new EventListenerFilter()

  @Input()
  @Number({
    title: 'Processed events offset',
    ui: {
      hidden: true,
    },
  })
  processedEventsOffset: number = 0

  @Output()
  @PortObject({
    title: 'Event Data',
    description: 'Output data when the event is triggered',
    schema: EventData,
  })
  outputData: EventData = new EventData()

  async execute(context: ExecutionContext): Promise<NodeExecutionResult> {
    if (context.eventData) {
      console.log('EventListenerNode executing in child mode with event data:', context.eventData)

      // Child execution mode - we have event data
      const { eventName, payload } = context.eventData

      if (eventName !== this.inputFilter.eventName) {
        // Skip this listener - not for this event
        throw new Error(`EventListenerNode skipped - event type mismatch: expected ${this.inputFilter.eventName}, got ${eventName}`)
      }

      // Process event data
      this.outputData.eventName = eventName
      if (payload && typeof payload === 'object' && 'eventName' in payload) {
        // If payload has eventName, use it (for compatibility)
        this.outputData = { ...payload } as EventData
      }

      return {}
    }

    throw new Error('EventListenerNode executed without event data')
  }
}

export default EventListenerNode
