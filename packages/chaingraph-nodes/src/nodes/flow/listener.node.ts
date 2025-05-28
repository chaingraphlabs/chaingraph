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
    const nodeEvent = ((context.integrations.nodeEvents || []) as EventData[]).find((_event, index) => {
      return index >= this.processedEventsOffset && _event.eventName === this.inputFilter.eventName
    })
    const nodeEventIndex = ((context.integrations.nodeEvents || []) as EventData[]).findIndex((_event, index) => {
      return index >= this.processedEventsOffset && _event.eventName === this.inputFilter.eventName
    })
    console.debug(
      'EventListenerNode - nodeEvent:',
      nodeEvent,
      'nodeEventIndex:',
      nodeEventIndex,
      'processedEventsOffset:',
      this.processedEventsOffset,
      'context',
      JSON.stringify(context.integrations),
    )

    if (nodeEvent && nodeEventIndex >= 0) {
      this.outputData.eventName = nodeEvent.eventName
      this.processedEventsOffset = nodeEventIndex + 1

      return {}
    }

    throw new Error('EventListenerNode skipped execution')
  }
}

export default EventListenerNode
