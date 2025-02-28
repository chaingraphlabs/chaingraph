/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { NodeEvent } from '../../node/events'
import type { INodeEvents } from '../interfaces'
import { EventQueue } from '../../utils'

/**
 * Implementation of INodeEvents interface
 * Manages node event subscription and publishing
 */
export class NodeEventManager implements INodeEvents {
  private eventQueue: EventQueue<NodeEvent>
  private customEventHandler?: (event: NodeEvent) => Promise<void>

  constructor(customEventHandler?: (event: NodeEvent) => Promise<void>) {
    this.eventQueue = new EventQueue<NodeEvent>()
    this.customEventHandler = customEventHandler
  }

  /**
   * Set a custom event handler function (usually the derived node's onEvent method)
   * @param handler The custom event handler
   */
  setCustomEventHandler(handler: (event: NodeEvent) => Promise<void>): void {
    this.customEventHandler = handler
  }

  /**
   * Subscribe to node events of a specific type
   * @param eventType The type of event to subscribe to
   * @param handler The event handler function
   * @returns A function to unsubscribe
   */
  on<T extends NodeEvent>(
    eventType: T['type'],
    handler: (event: T) => void,
  ): () => void {
    return this.eventQueue.subscribe((event) => {
      if (event.type === eventType) {
        handler(event as T)
      }
    })
  }

  /**
   * Subscribe to all node events
   * @param handler The event handler function
   * @returns A function to unsubscribe
   */
  onAll(handler: (event: NodeEvent) => void): () => void {
    return this.eventQueue.subscribe(handler)
  }

  /**
   * Handle an event internally
   * This is a non-public implementation
   * @param event The event to handle
   */
  async onEvent(event: NodeEvent): Promise<void> {
    // Forward the event to the custom handler (typically the derived node's onEvent)
    if (this.customEventHandler) {
      return this.customEventHandler(event)
    }

    return Promise.resolve()
  }

  /**
   * Emit an event to all subscribers
   * This is the main entry point for events
   * @param event The event to emit
   */
  async emit<T extends NodeEvent>(event: T): Promise<void> {
    // First publish to subscribers
    await this.eventQueue.publish(event)

    // Then invoke the custom handler (derived node's onEvent)
    if (this.customEventHandler) {
      await this.customEventHandler(event)
    }

    return Promise.resolve()
  }

  /**
   * Close the event queue
   * Call this when disposing the node
   */
  async close(): Promise<void> {
    await this.eventQueue.close()
  }
}
