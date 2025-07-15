/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { ExecutionContext, IPortConfig, NodeEvent, NodeExecutionResult, PortUpdateEvent } from '@badaitech/chaingraph-types'
import { BaseNode, Input, Node, NodeEventType, PortAny, PortString } from '@badaitech/chaingraph-types'
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
    title: 'Payload',
    description: 'Data payload to emit with the event',
    order: 2,
    ui: {
      hidePropertyEditor: true,
    },
  })
  payload: any = {}

  @Input()
  @PortAny({
    title: 'Payload Schema',
    description: 'Optional schema for payload validation - acts as a filter to ensure data integrity',
    order: 3,
  })
  payloadSchema: any = {}

  async onEvent(event: NodeEvent): Promise<void> {
    await super.onEvent(event)

    if (event.type === NodeEventType.PortUpdate) {
      await this.handleSchemaUpdate(event as PortUpdateEvent)
    }
  }

  private async handleSchemaUpdate(event: PortUpdateEvent): Promise<void> {
    if (event.port.key === 'payloadSchema') {
      const payloadPort = this.findPortByKey('payload')
      const schemaPort = this.findPortByKey('payloadSchema')

      if (payloadPort && schemaPort) {
        const schema = (schemaPort.getConfig() as any).underlyingType
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

    // Get the schema for payload validation
    const schemaPort = this.findPortByKey('payloadSchema')
    const schema = (schemaPort?.getConfig() as any)?.underlyingType

    // Validate payload against schema if schema is provided
    if (schema) {
      try {
        this.validatePayloadAgainstSchema(this.payload, schema)
      } catch (error) {
        throw new Error(`Event payload validation failed: ${(error as Error).message}`)
      }
    }

    // Use the new event emission API if available
    if (context.emitEvent) {
      console.log(`[EventEmitterNode ${this.id}] Emitting event: "${eventName}"`)
      context.emitEvent(eventName, this.payload)
      console.log(`[EventEmitterNode ${this.id}] Event emitted successfully`)
      console.log(`[EventEmitterNode ${this.id}] Current emittedEvents:`, context.emittedEvents)
    } else {
      throw new Error('Event emission is not supported in this context')
    }

    return {}
  }

  private validatePayloadAgainstSchema(payload: any, schema: IPortConfig): void {
    if (!schema) {
      return
    }

    const type = schema.type || 'any'

    switch (type) {
      case 'string': {
        if (typeof payload !== 'string') {
          throw new TypeError(`Expected string, got ${typeof payload}`)
        }
        break
      }

      case 'number': {
        if (typeof payload !== 'number') {
          throw new TypeError(`Expected number, got ${typeof payload}`)
        }
        break
      }

      case 'boolean': {
        if (typeof payload !== 'boolean') {
          throw new TypeError(`Expected boolean, got ${typeof payload}`)
        }
        break
      }

      case 'object': {
        if (payload === null || typeof payload !== 'object' || Array.isArray(payload)) {
          throw new TypeError(`Expected object, got ${typeof payload}`)
        }

        const objectSchema = schema as any
        if (objectSchema.schema?.properties) {
          // Check that payload has the expected properties
          for (const [expectedKey, propSchema] of Object.entries(objectSchema.schema.properties)) {
            if (payload[expectedKey] === undefined) {
              throw new TypeError(`Missing required property '${expectedKey}'`)
            }
            this.validatePayloadAgainstSchema(payload[expectedKey], propSchema as IPortConfig)
          }

          // Check for unexpected properties
          for (const actualKey of Object.keys(payload)) {
            if (!(actualKey in objectSchema.schema.properties)) {
              throw new TypeError(`Unexpected property '${actualKey}' - expected properties: ${Object.keys(objectSchema.schema.properties).join(', ')}`)
            }
          }
        }
        break
      }

      case 'array': {
        if (!Array.isArray(payload)) {
          throw new TypeError(`Expected array, got ${typeof payload}`)
        }

        const arraySchema = schema as any
        if (arraySchema.itemConfig) {
          for (const item of payload) {
            this.validatePayloadAgainstSchema(item, arraySchema.itemConfig)
          }
        }
        break
      }

      case 'any':
      default:
        // No validation needed for 'any' type
        break
    }
  }
}

export default EventEmitterNode
