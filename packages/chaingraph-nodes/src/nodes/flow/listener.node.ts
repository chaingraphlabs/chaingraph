/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { ExecutionContext, NodeExecutionResult } from '@badaitech/chaingraph-types'
import { BaseNode, Input, Node, Output, PortNumber, PortObject, PortString } from '@badaitech/chaingraph-types'
import { NODE_CATEGORIES } from '../../categories'

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
  @PortString({
    title: 'Event Name',
    description: 'Name of the event to listen for',
    defaultValue: '',
  })
  eventName: string = ''

  @Input()
  @PortNumber({
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
    isSchemaMutable: true,
    schema: {
      type: 'object',
      properties: {},
    },
    ui: {
      keyDeletable: true,
      hideEditor: false,
      hidePropertyEditor: true,
    },
  })
  outputData: Record<string, any> = {}

  async execute(context: ExecutionContext): Promise<NodeExecutionResult> {
    // EventListenerNode should only process when there's event data
    // This can be either:
    // 1. Child execution spawned by internal event
    // 2. Root execution with external event (from API)
    if (!context.eventData) {
      // console.log(`[EventListenerNode ${this.id}] No event data available - skipping execution`)
      return {}
    }

    // We have event data - process it
    const { eventName, payload } = context.eventData

    if (eventName !== this.eventName) {
      // Skip this listener - not for this event
      return {}
    }

    // Output the payload directly without schema processing
    this.outputData = payload || {}

    // Return empty result - node executed successfully
    return {}
  }
}

export default EventListenerNode
