/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { ExecutionContext, NodeExecutionResult } from '@badaitech/chaingraph-types'
import { BaseNode, Input, Node, Output, PortAny, PortNumber, PortString } from '@badaitech/chaingraph-types'
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
  @PortAny({
    title: 'Event Data',
    description: 'Output data when the event is triggered',
    ui: {
      hideEditor: false,
    },
  })
  outputData: any = {}

  async execute(context: ExecutionContext): Promise<NodeExecutionResult> {
    console.log(`[EventListenerNode ${this.id}] execute called, isChildExecution: ${context.isChildExecution}, hasEventData: ${!!context.eventData}`)
    console.log(`[EventListenerNode ${this.id}] Filter eventName: "${this.eventName}"`)

    // EventListenerNode should only process when there's event data
    // This can be either:
    // 1. Child execution spawned by internal event
    // 2. Root execution with external event (from API)
    if (!context.eventData) {
      console.log(`[EventListenerNode ${this.id}] No event data available - skipping execution`)
      return {}
    }

    console.log(`[EventListenerNode ${this.id}] Processing event data:`, JSON.stringify(context.eventData))

    // We have event data - process it
    const { eventName, payload } = context.eventData

    if (eventName !== this.eventName) {
      // Skip this listener - not for this event
      console.log(`[EventListenerNode ${this.id}] Event type mismatch: expected "${this.eventName}", got "${eventName}" - skipping`)
      return {}
    }

    // Output the payload directly without schema processing
    this.outputData = payload

    console.log(`[EventListenerNode ${this.id}] Output data after processing:`, JSON.stringify(this.outputData))

    // Return empty result - node executed successfully
    return {}
  }
}

export default EventListenerNode
