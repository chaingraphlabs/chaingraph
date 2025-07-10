/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { ExecutionContext, IPortConfig, NodeEvent, NodeExecutionResult, PortUpdateEvent } from '@badaitech/chaingraph-types'
import { BaseNode, Input, Node, NodeEventType, Output, PortAny, PortNumber, PortString } from '@badaitech/chaingraph-types'
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

  @Input()
  @PortAny({
    title: 'Output Schema',
    description: 'Schema for the output event data structure',
  })
  outputSchema: any = {}

  @Output()
  @PortAny({
    title: 'Event Data',
    description: 'Output data when the event is triggered',
    ui: {
      hidePropertyEditor: true,
    },
  })
  outputData: any = {}

  async onEvent(event: NodeEvent): Promise<void> {
    await super.onEvent(event)

    if (event.type === NodeEventType.PortUpdate) {
      await this.handleSchemaUpdate(event as PortUpdateEvent)
    }
  }

  private async handleSchemaUpdate(event: PortUpdateEvent): Promise<void> {
    if (event.port.key === 'outputSchema') {
      const outputPort = this.findPortByKey('outputData')
      const schemaPort = this.findPortByKey('outputSchema')

      if (outputPort && schemaPort) {
        const schema = (schemaPort.getConfig() as any).underlyingType
        if (schema) {
          (outputPort as any).setUnderlyingType(schema)
        }
      }
    }
  }

  async execute(context: ExecutionContext): Promise<NodeExecutionResult> {
    console.log(`[EventListenerNode ${this.id}] execute called, isChildExecution: ${context.isChildExecution}, hasEventData: ${!!context.eventData}`)
    console.log(`[EventListenerNode ${this.id}] Filter eventName: "${this.eventName}"`)

    // EventListenerNode should only process when there's event data
    // This can be either:
    // 1. Child execution spawned by internal event
    // 2. Root execution with external event (from API)
    if (!context.eventData) {
      console.log(`[EventListenerNode ${this.id}] No event data available - skipping execution and downstream nodes`)

      // Clear output data
      this.outputData = {}

      // Throw exception to skip downstream nodes when there's no event to process
      throw new Error(`EventListenerNode '${this.id}' has no event data to process`)
    }

    console.log(`[EventListenerNode ${this.id}] Processing event data:`, JSON.stringify(context.eventData))

    // We have event data - process it
    const { eventName, payload } = context.eventData

    if (eventName !== this.eventName) {
      // Skip this listener and all downstream nodes - not for this event
      console.log(`[EventListenerNode ${this.id}] Event type mismatch: expected "${this.eventName}", got "${eventName}" - skipping`)
      throw new Error(`Event type mismatch: EventListener '${this.eventName}' cannot process event '${eventName}'`)
    }

    // Get the schema for output processing
    const schemaPort = this.findPortByKey('outputSchema')
    const schema = (schemaPort?.getConfig() as any)?.underlyingType

    // Process event data based on schema
    if (schema) {
      try {
        this.outputData = this.processEventDataWithSchema(payload, schema)
      } catch (error) {
        throw new Error(`Event data processing failed: ${(error as Error).message}`)
      }
    } else {
      // When no schema is provided, output the payload directly
      this.outputData = payload
    }

    console.log(`[EventListenerNode ${this.id}] Output data after processing:`, JSON.stringify(this.outputData))

    // Return empty result - node executed successfully
    return {}
  }

  private processEventDataWithSchema(payload: any, schema: IPortConfig): any {
    if (!schema) {
      return payload
    }

    const type = schema.type || 'any'

    switch (type) {
      case 'string': {
        if (typeof payload !== 'string') {
          throw new TypeError(`Expected string, got ${typeof payload}`)
        }
        return payload
      }

      case 'number': {
        if (typeof payload !== 'number') {
          throw new TypeError(`Expected number, got ${typeof payload}`)
        }
        return payload
      }

      case 'boolean': {
        if (typeof payload !== 'boolean') {
          throw new TypeError(`Expected boolean, got ${typeof payload}`)
        }
        return payload
      }

      case 'object': {
        if (payload === null || typeof payload !== 'object' || Array.isArray(payload)) {
          throw new TypeError(`Expected object, got ${typeof payload}`)
        }

        const objectSchema = schema as any
        if (objectSchema.schema?.properties) {
          const result: any = {}
          for (const [key, propSchema] of Object.entries(objectSchema.schema.properties)) {
            if (payload[key] !== undefined) {
              result[key] = this.processEventDataWithSchema(payload[key], propSchema as IPortConfig)
            }
          }
          return result
        }
        return payload
      }

      case 'array': {
        if (!Array.isArray(payload)) {
          throw new TypeError(`Expected array, got ${typeof payload}`)
        }

        const arraySchema = schema as any
        if (arraySchema.itemConfig) {
          return payload.map(item => this.processEventDataWithSchema(item, arraySchema.itemConfig))
        }
        return payload
      }

      case 'any':
      default:
        return payload
    }
  }
}

export default EventListenerNode
