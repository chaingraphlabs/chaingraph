/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { IPort } from '../../port'
import type { EventContext } from './node-event-manager'

/**
 * Represents a pending port update that hasn't been emitted yet
 */
interface PendingUpdate {
  port: IPort
  eventContext?: EventContext
}

/**
 * Collects port updates for batch emission
 * Implements deduplication by port ID (last update wins)
 */
export class PortUpdateCollector {
  private pendingUpdates = new Map<string, PendingUpdate>()
  private collecting = false

  /**
   * Start collecting port updates without emitting events
   * Clears any previously collected updates
   */
  startCollecting(): void {
    this.collecting = true
    this.pendingUpdates.clear()
  }

  /**
   * Stop collecting mode (but doesn't emit collected updates)
   */
  stopCollecting(): void {
    this.collecting = false
  }

  /**
   * Check if currently in collecting mode
   */
  isCollecting(): boolean {
    return this.collecting
  }

  /**
   * Collect a port update for later emission
   * If the same port is updated multiple times, only the last update is kept
   * @param port The port that was updated
   * @param eventContext Optional context for the update
   */
  collect(port: IPort, eventContext?: EventContext): void {
    if (!this.collecting)
      return

    // Store a clone to avoid mutations affecting the collected state
    // Last update wins for the same port ID
    this.pendingUpdates.set(port.id, {
      port: port.clone(),
      eventContext,
    })
  }

  /**
   * Get all pending updates
   * @returns Array of pending updates in the order they'll be emitted
   */
  getPendingUpdates(): PendingUpdate[] {
    return Array.from(this.pendingUpdates.values())
  }

  /**
   * Clear all pending updates
   */
  clear(): void {
    this.pendingUpdates.clear()
  }

  /**
   * Check if there are any pending updates
   */
  hasPendingUpdates(): boolean {
    return this.pendingUpdates.size > 0
  }
}
