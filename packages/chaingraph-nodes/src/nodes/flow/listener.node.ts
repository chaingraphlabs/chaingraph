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
    disabledAutoExecution: true
  }
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
    console.log(`EventListenerNode ${this.id} execute called, isChildExecution: ${context.isChildExecution}, hasEventData: ${!!context.eventData}`)
    
    // EventListenerNode should ONLY execute in child executions with event data
    // It should never execute in parent context or without event data
    if (!context.eventData || !context.isChildExecution) {
      console.log(`EventListenerNode ${this.id} should not execute - not in event-driven child context`)
      
      // Clear output data
      this.outputData = new EventData()
      
      // Return empty result - the node ran but did nothing
      return {}
    }

    console.log('EventListenerNode executing in child mode with event data:', context.eventData)

    // Child execution mode - we have event data
    const { eventName, payload } = context.eventData

    if (eventName !== this.inputFilter.eventName) {
      // Skip this listener - not for this event
      console.log(`EventListenerNode ${this.id} skipping - event type mismatch: expected ${this.inputFilter.eventName}, got ${eventName}`)
      return {}
    }

    // Process event data
    // Simply set the eventName on the existing outputData instance
    this.outputData.eventName = eventName

    console.log(`EventListenerNode ${this.id} outputData.eventName after processing:`, this.outputData.eventName)
    
    // Return empty result - node executed successfully
    return {}
  }
}

export default EventListenerNode
