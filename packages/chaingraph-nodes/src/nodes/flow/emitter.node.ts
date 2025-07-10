/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { ExecutionContext, NodeEvent, NodeExecutionResult, PortUpdateEvent } from '@badaitech/chaingraph-types'
import { BaseNode, Input, Node, NodeEventType, PortAny, PortString, Title } from '@badaitech/chaingraph-types'
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
  @PortAny({
    title: 'Event Payload Schema',
    description: 'Schema for the event payload data structure',
  })
  eventPayloadSchema: any = {}

  @Input()
  @PortAny({
    title: 'Event Payload',
    description: 'Data payload to emit with the event',
    ui: {
      hidePropertyEditor: true,
    },
  })
  eventPayload: any = {}

  async onEvent(event: NodeEvent): Promise<void> {
    await super.onEvent(event)

    if (event.type === NodeEventType.PortUpdate) {
      await this.handleSchemaUpdate(event as PortUpdateEvent)
    }
  }

  private async handleSchemaUpdate(event: PortUpdateEvent): Promise<void> {
    if (event.port.key === 'eventPayloadSchema') {
      const payloadPort = this.findPortByKey('eventPayload')
      const schemaPort = this.findPortByKey('eventPayloadSchema')

      if (payloadPort && schemaPort) {
        const schema = schemaPort.getRawConfig().underlyingType
        if (schema) {
          (payloadPort as any).setUnderlyingType(schema)
        }
      }
    }
  }

  async execute(context: ExecutionContext): Promise<NodeExecutionResult> {
    const eventName = this.eventName
    console.log(`[EventEmitterNode ${this.id}] Executing with eventName: "${eventName}", isChildExecution: ${context.isChildExecution}`)

    if (!eventName) {
      throw new Error('Event name is required to emit an event')
    }

    // Use the new event emission API if available
    if (context.emitEvent) {
      console.log(`[EventEmitterNode ${this.id}] Emitting event: "${eventName}"`)
      context.emitEvent(eventName, this.eventPayload)
      console.log(`[EventEmitterNode ${this.id}] Event emitted successfully`)
      console.log(`[EventEmitterNode ${this.id}] Current emittedEvents:`, context.emittedEvents)
    } else {
      throw new Error('Event emission is not supported in this context')
    }

    return {}
  }
}

export default EventEmitterNode
