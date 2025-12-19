/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { FlushCallback } from './buffer'
import type {
  PerfTrace,
  TraceBufferConfig,
  TraceEvent,
  TraceStartOptions,
  TraceWrapOptions,
} from './types'
import { TraceBuffer } from './buffer'

// Simple ID generator (avoids external dependency)
let idCounter = 0
function generateId(): string {
  return `t${Date.now().toString(36)}_${(idCounter++).toString(36)}`
}

/**
 * Core performance trace implementation.
 *
 * Features:
 * - Hierarchical spans (parent-child relationships)
 * - Batched flushing via requestIdleCallback
 * - Marks for point-in-time events
 * - Measures for named time ranges
 * - Wrap helpers for automatic instrumentation
 */
export class PerfTraceImpl implements PerfTrace {
  private buffer: TraceBuffer
  private enabled: boolean
  private spanStack: string[] = [] // Stack of active span IDs
  private activeSpans: Map<string, TraceEvent> = new Map()
  private marks: Map<string, number> = new Map() // mark name -> timestamp

  constructor(flushCallback: FlushCallback, config?: Partial<TraceBufferConfig>) {
    this.buffer = new TraceBuffer(flushCallback, config)
    this.enabled = true
  }

  isEnabled(): boolean {
    return this.enabled
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled
  }

  getCurrentSpanId(): string | null {
    return this.spanStack.length > 0
      ? this.spanStack[this.spanStack.length - 1]
      : null
  }

  start(name: string, options: TraceStartOptions = {}): string {
    if (!this.enabled) {
      return ''
    }

    const id = generateId()
    const parentId = this.getCurrentSpanId()
    const depth = this.spanStack.length

    const event: TraceEvent = {
      id,
      name,
      startTime: performance.now(),
      endTime: null,
      duration: null,
      type: 'span',
      category: options.category ?? 'custom',
      parentId,
      depth,
      tags: options.tags ?? {},
      source: options.source,
    }

    // Track active span
    this.activeSpans.set(id, event)
    this.spanStack.push(id)

    return id
  }

  end(spanId: string): void {
    if (!this.enabled || !spanId) {
      return
    }

    const event = this.activeSpans.get(spanId)
    if (!event) {
      // Span was already ended or never started
      return
    }

    // Calculate duration
    const endTime = performance.now()
    event.endTime = endTime
    event.duration = endTime - event.startTime

    // Remove from active spans
    this.activeSpans.delete(spanId)

    // Pop from span stack (handle out-of-order ends)
    const stackIndex = this.spanStack.indexOf(spanId)
    if (stackIndex !== -1) {
      this.spanStack.splice(stackIndex, 1)
    }

    // Add to buffer for eventual flushing
    this.buffer.add(event)
  }

  mark(name: string, options: TraceStartOptions = {}): void {
    if (!this.enabled) {
      return
    }

    const now = performance.now()

    // Store mark time for measure()
    this.marks.set(name, now)

    const event: TraceEvent = {
      id: generateId(),
      name,
      startTime: now,
      endTime: now,
      duration: 0,
      type: 'mark',
      category: options.category ?? 'custom',
      parentId: this.getCurrentSpanId(),
      depth: this.spanStack.length,
      tags: options.tags ?? {},
      source: options.source,
    }

    this.buffer.add(event)
  }

  measure(
    name: string,
    startMark: string,
    endMark: string,
    options: TraceStartOptions = {},
  ): void {
    if (!this.enabled) {
      return
    }

    const startTime = this.marks.get(startMark)
    const endTime = this.marks.get(endMark)

    if (startTime === undefined || endTime === undefined) {
      // Marks not found
      return
    }

    const event: TraceEvent = {
      id: generateId(),
      name,
      startTime,
      endTime,
      duration: endTime - startTime,
      type: 'measure',
      category: options.category ?? 'custom',
      parentId: this.getCurrentSpanId(),
      depth: this.spanStack.length,
      tags: options.tags ?? {},
      source: options.source,
    }

    this.buffer.add(event)
  }

  wrap<T>(name: string, options: TraceWrapOptions, fn: () => T): T {
    if (!this.enabled) {
      return fn()
    }

    const spanId = this.start(name, options)
    try {
      return fn()
    }
    finally {
      this.end(spanId)
    }
  }

  async wrapAsync<T>(
    name: string,
    options: TraceWrapOptions,
    fn: () => Promise<T>,
  ): Promise<T> {
    if (!this.enabled) {
      return fn()
    }

    const spanId = this.start(name, options)
    try {
      return await fn()
    }
    finally {
      this.end(spanId)
    }
  }

  flush(): void {
    this.buffer.forceFlush()
  }

  /**
   * Clear all active spans and marks
   * Useful for reset scenarios
   */
  clear(): void {
    this.activeSpans.clear()
    this.spanStack = []
    this.marks.clear()
    this.buffer.clear()
  }

  /**
   * Get buffer size (for debugging)
   */
  getBufferSize(): number {
    return this.buffer.size()
  }
}

/**
 * Create a new PerfTrace instance
 * @param flushCallback Function to receive batches of trace events
 * @param config Optional buffer configuration
 */
export function createPerfTrace(
  flushCallback: FlushCallback,
  config?: Partial<TraceBufferConfig>,
): PerfTrace {
  return new PerfTraceImpl(flushCallback, config)
}
