/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { TraceBufferConfig, TraceEvent } from './types'
import { DEFAULT_BUFFER_CONFIG } from './types'

/**
 * Callback to flush traces to the Effector store
 */
export type FlushCallback = (traces: TraceEvent[]) => void

/**
 * In-memory buffer for trace events with batched flushing.
 *
 * Uses requestIdleCallback (with RAF fallback) to flush traces
 * during browser idle time, avoiding blocking the main thread
 * during high-frequency operations like drag.
 */
export class TraceBuffer {
  private buffer: TraceEvent[] = []
  private flushScheduled = false
  private flushCallback: FlushCallback
  private config: TraceBufferConfig

  constructor(flushCallback: FlushCallback, config: Partial<TraceBufferConfig> = {}) {
    this.flushCallback = flushCallback
    this.config = { ...DEFAULT_BUFFER_CONFIG, ...config }
  }

  /**
   * Add a trace event to the buffer
   * Schedules a flush if not already scheduled
   */
  add(event: TraceEvent): void {
    // Circular buffer - drop oldest if at capacity
    if (this.buffer.length >= this.config.maxSize) {
      this.buffer.shift()
    }

    this.buffer.push(event)

    // Schedule flush if not already scheduled
    if (!this.flushScheduled) {
      this.scheduleFlush()
    }
  }

  /**
   * Schedule a flush using requestIdleCallback or RAF
   */
  private scheduleFlush(): void {
    this.flushScheduled = true

    // Use requestIdleCallback for non-critical flushes
    // Falls back to requestAnimationFrame if not available
    if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
      (window as Window & { requestIdleCallback: (cb: () => void, opts?: { timeout: number }) => void }).requestIdleCallback(
        () => this.flush(),
        { timeout: this.config.flushDelayMs },
      )
    }
    else if (typeof window !== 'undefined' && 'requestAnimationFrame' in window) {
      requestAnimationFrame(() => this.flush())
    }
    else {
      // Node.js environment - use setTimeout
      setTimeout(() => this.flush(), 0)
    }
  }

  /**
   * Flush buffered traces to the store
   */
  private flush(): void {
    if (this.buffer.length === 0) {
      this.flushScheduled = false
      return
    }

    // Extract batch to flush (max batchSize events)
    const batch = this.buffer.splice(0, this.config.flushBatchSize)

    // Send batch to Effector store
    this.flushCallback(batch)

    // Continue flushing if more data remains
    if (this.buffer.length > 0) {
      this.scheduleFlush()
    }
    else {
      this.flushScheduled = false
    }
  }

  /**
   * Force an immediate flush of all buffered traces
   */
  forceFlush(): void {
    if (this.buffer.length === 0) {
      return
    }

    // Flush all remaining traces immediately
    const batch = this.buffer.splice(0)
    this.flushCallback(batch)
    this.flushScheduled = false
  }

  /**
   * Get the current buffer size
   */
  size(): number {
    return this.buffer.length
  }

  /**
   * Clear all buffered traces without flushing
   */
  clear(): void {
    this.buffer = []
    this.flushScheduled = false
  }
}
