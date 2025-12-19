/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { TraceEvent, TraceFilter } from '@/lib/perf-trace'
import { perfTraceDomain } from './domain'

/**
 * Flush a batch of trace events to the store
 */
export const flushTraces = perfTraceDomain.createEvent<TraceEvent[]>()

/**
 * Clear all stored traces
 */
export const clearTraces = perfTraceDomain.createEvent()

/**
 * Toggle tracing on/off
 */
export const toggleTracing = perfTraceDomain.createEvent<boolean>()

/**
 * Set the trace filter
 */
export const setTraceFilter = perfTraceDomain.createEvent<TraceFilter>()

/**
 * Select a specific operation for detailed stats view
 */
export const selectOperation = perfTraceDomain.createEvent<string | null>()
