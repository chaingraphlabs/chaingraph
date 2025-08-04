/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { NodeEvent } from '../../node/events'

/**
 * Interface for node event handling
 */
export interface INodeEvents {
  /**
   * Subscribe to node events of a specific type
   * @param eventType The type of event to subscribe to
   * @param handler The event handler function
   * @returns A function to unsubscribe
   */
  on: <T extends NodeEvent>(
    eventType: T['type'],
    handler: (event: T) => void | Promise<void>,
  ) => () => void

  /**
   * Subscribe to all node events
   * @param handler The event handler function
   * @returns A function to unsubscribe
   */
  onAll: (handler: (event: NodeEvent) => void | Promise<void>) => () => void

  /**
   * Handle an event
   * @param event The event to handle
   */
  onEvent: (event: NodeEvent) => Promise<void>

  /**
   * Emit an event to all subscribers
   * @param event The event to emit
   */
  emit: <T extends NodeEvent>(event: T) => Promise<void>
}
