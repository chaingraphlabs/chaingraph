/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

// Export buffer
export { TraceBuffer } from './buffer'

export type { FlushCallback } from './buffer'

// Export helpers (Effector-specific, no JSX)
export {
  traceEffect,
  traceEvent,
  traceSampleFn,
  traceStore,
} from './helpers'

// Export React helpers (JSX components)
export {
  traceRender,
} from './helpers-react'
export type { TraceRenderOptions } from './helpers-react'
export { createNoopTrace } from './noop'

// Export trace implementations
export { createPerfTrace, PerfTraceImpl } from './trace'
// Export types
export type {
  PerfTrace,
  TraceAggregation,
  TraceBufferConfig,
  TraceCategory,
  TraceEvent,
  TraceFilter,
  TraceHotspot,
  TraceStartOptions,
  TraceTree,
  TraceType,
  TraceWrapOptions,
} from './types'

export { DEFAULT_BUFFER_CONFIG } from './types'

// ============================================================================
// SINGLETON TRACE INSTANCE
// ============================================================================
// This is the main trace instance used throughout the application.
// In dev mode, it uses the real implementation.
// In production, it uses the noop implementation for zero overhead.
// ============================================================================

import type { PerfTrace } from './types'
import { createNoopTrace } from './noop'
import { createPerfTrace } from './trace'

// Lazy-initialized singleton
let traceInstance: PerfTrace | null = null
let flushCallback: ((traces: import('./types').TraceEvent[]) => void) | null = null

/**
 * Set the flush callback for the trace singleton.
 * This must be called before using `trace` in dev mode.
 *
 * @param callback Function to receive batched traces (typically the Effector event)
 */
export function initializeTrace(callback: (traces: import('./types').TraceEvent[]) => void): void {
  flushCallback = callback

  // If trace was already accessed before initialization, recreate it
  if (traceInstance && import.meta.env.DEV) {
    traceInstance = createPerfTrace(callback)
  }
}

/**
 * Get the trace singleton instance.
 *
 * In dev mode, returns a real PerfTrace that buffers and flushes traces.
 * In production, returns a noop implementation with zero overhead.
 */
function getTrace(): PerfTrace {
  if (traceInstance) {
    return traceInstance
  }

  if (import.meta.env.DEV) {
    // Dev mode - use real implementation
    // If no flush callback set, use console.warn as fallback
    if (!flushCallback) {
      console.warn('[perf-trace] Trace accessed before initializeTrace() called. Traces will be discarded.')
      flushCallback = () => { } // Discard until properly initialized
    }
    traceInstance = createPerfTrace(flushCallback)
  } else {
    // Production mode - use noop
    traceInstance = createNoopTrace()
  }

  return traceInstance
}

/**
 * Global trace singleton.
 *
 * Usage:
 * ```ts
 * import { trace } from '@/lib/perf-trace'
 *
 * const spanId = trace.start('operation', { category: 'compute' })
 * // ... do work
 * trace.end(spanId)
 *
 * // Or use wrap helper:
 * const result = trace.wrap('operation', { category: 'compute' }, () => {
 *   // ... do work
 *   return result
 * })
 * ```
 */
export const trace: PerfTrace = new Proxy({} as PerfTrace, {
  get(_target, prop: keyof PerfTrace) {
    const instance = getTrace()
    const value = instance[prop]
    if (typeof value === 'function') {
      return value.bind(instance)
    }
    return value
  },
})
