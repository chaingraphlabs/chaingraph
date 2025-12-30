/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

// Export computed stores
export {
  $filteredTraces,
  $hotspots,
  $selectedOperationDistribution,
  $selectedOperationStats,
  $timelineData,
  $traceAggregations,
  $traceTree,
} from './computed'

// Export domain
export { perfTraceDomain } from './domain'

// Export events
export {
  clearTraces,
  flushTraces,
  selectOperation,
  setTraceFilter,
  toggleTracing,
} from './events'

// Export stores
export {
  $rawTraces,
  $selectedOperation,
  $traceCount,
  $traceFilter,
  $traceTimeRange,
  $tracingEnabled,
} from './stores'

// ============================================================================
// INITIALIZATION
// ============================================================================
// Initialize the trace singleton to flush to this store.
// This must be called early in app initialization.
// ============================================================================

import { initializeTrace } from '@/lib/perf-trace'
import { flushTraces } from './events'

/**
 * Initialize the performance tracing system.
 *
 * Call this early in app initialization (e.g., in main.tsx or App.tsx).
 * This connects the trace buffer to the Effector store.
 */
export function initializePerfTracing(): void {
  initializeTrace((traces) => {
    flushTraces(traces)
  })

  if (import.meta.env.DEV) {
    console.info('[perf-trace] Performance tracing initialized')
  }
}
