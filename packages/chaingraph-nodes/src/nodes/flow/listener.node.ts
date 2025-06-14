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
  flowPorts: {
    // Disable auto-execution - this node should only execute when explicitly triggered by events
    disabledAutoExecution: true,
  },
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
    console.log(`[EventListenerNode ${this.id}] execute called, isChildExecution: ${context.isChildExecution}, hasEventData: ${!!context.eventData}`)
    console.log(`[EventListenerNode ${this.id}] Filter eventName: "${this.inputFilter.eventName}"`)

    // EventListenerNode should only process when there's event data
    // This can be either:
    // 1. Child execution spawned by internal event
    // 2. Root execution with external event (from API)
    if (!context.eventData) {
      console.log(`[EventListenerNode ${this.id}] No event data available - skipping execution and downstream nodes`)

      // Clear output data
      this.outputData = new EventData()

      // Throw exception to skip downstream nodes when there's no event to process
      throw new Error(`EventListenerNode '${this.id}' has no event data to process`)
    }

    console.log(`[EventListenerNode ${this.id}] Processing event data:`, JSON.stringify(context.eventData))

    // We have event data - process it
    const { eventName, payload } = context.eventData

    if (eventName !== this.inputFilter.eventName) {
      // Skip this listener and all downstream nodes - not for this event
      console.log(`[EventListenerNode ${this.id}] Event type mismatch: expected "${this.inputFilter.eventName}", got "${eventName}" - skipping`)
      throw new Error(`Event type mismatch: EventListener '${this.inputFilter.eventName}' cannot process event '${eventName}'`)
    }

    // Process event data
    // Simply set the eventName on the existing outputData instance
    this.outputData.eventName = eventName

    console.log(`[EventListenerNode ${this.id}] Output data after processing:`, JSON.stringify(this.outputData))

    // Return empty result - node executed successfully
    return {}
  }
}

export default EventListenerNode
