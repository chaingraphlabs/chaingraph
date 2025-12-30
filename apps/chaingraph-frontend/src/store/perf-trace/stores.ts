/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { TraceEvent, TraceFilter } from '@/lib/perf-trace'
import { perfTraceDomain } from './domain'
import { clearTraces, flushTraces, selectOperation, setTraceFilter, toggleTracing } from './events'

// Maximum traces to keep in store (circular buffer)
const MAX_TRACES = 50_000

/**
 * Raw trace events (circular buffer)
 *
 * Receives batched flushes from the TraceBuffer.
 * Keeps the most recent MAX_TRACES events.
 */
export const $rawTraces = perfTraceDomain
  .createStore<TraceEvent[]>([])
  .on(flushTraces, (state, batch) => {
    const combined = [...state, ...batch]
    // Keep last MAX_TRACES traces (circular buffer)
    return combined.length > MAX_TRACES
      ? combined.slice(-MAX_TRACES)
      : combined
  })
  .reset(clearTraces)

/**
 * Tracing enabled state
 *
 * When false, the trace singleton becomes a noop.
 * Default: true in dev mode, false in production.
 */
export const $tracingEnabled = perfTraceDomain
  .createStore<boolean>(import.meta.env.DEV)
  .on(toggleTracing, (_, enabled) => enabled)

/**
 * Active filter for trace queries
 */
export const $traceFilter = perfTraceDomain
  .createStore<TraceFilter>({
    categories: null, // null = all categories
    namePattern: null, // null = no name filter
    minDuration: 0, // 0 = no minimum duration
  })
  .on(setTraceFilter, (_, filter) => filter)

/**
 * Currently selected operation for detailed stats
 */
export const $selectedOperation = perfTraceDomain
  .createStore<string | null>(null)
  .on(selectOperation, (_, name) => name)
  .reset(clearTraces)

/**
 * Total trace count (for display)
 */
export const $traceCount = $rawTraces.map(traces => traces.length)

/**
 * Time range of stored traces
 */
export const $traceTimeRange = $rawTraces.map((traces) => {
  if (traces.length === 0) {
    return { start: 0, end: 0, duration: 0 }
  }

  const start = traces[0].startTime
  const end = traces[traces.length - 1].startTime

  return {
    start,
    end,
    duration: end - start,
  }
})
