/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

/**
 * Categories for trace events
 */
export type TraceCategory
  = | 'store' // Effector store updates
    | 'event' // Effector event handlers
    | 'effect' // Effector effects
    | 'sample' // Effector sample() computations
    | 'render' // React component renders
    | 'hook' // React hook executions
    | 'compute' // CPU-bound computations
    | 'io' // Network/disk operations
    | 'custom' // User-defined

/**
 * Type of trace event
 */
export type TraceType = 'span' | 'mark' | 'measure'

/**
 * A single trace event
 */
export interface TraceEvent {
  // Identity
  id: string // Unique ID
  name: string // Operation name

  // Timing
  startTime: number // performance.now()
  endTime: number | null // null if still running
  duration: number | null // endTime - startTime

  // Type
  type: TraceType
  category: TraceCategory

  // Hierarchy
  parentId: string | null // Parent span ID
  depth: number // Nesting depth

  // Context
  tags: Record<string, string | number | boolean>

  // Source location (dev only)
  source?: string // File:line
}

/**
 * Options for starting a trace span
 */
export interface TraceStartOptions {
  category?: TraceCategory
  tags?: Record<string, string | number | boolean>
  source?: string
}

/**
 * Options for wrapping a function with tracing
 */
export interface TraceWrapOptions extends TraceStartOptions {
  // Additional options for wrap helpers
}

/**
 * Filter for querying traces
 */
export interface TraceFilter {
  categories: TraceCategory[] | null // null = all categories
  namePattern: string | null // Substring match on name
  minDuration: number // Minimum duration in ms (0 = no filter)
  timeRange?: {
    start: number
    end: number
  }
}

/**
 * Aggregated statistics for a trace operation
 */
export interface TraceAggregation {
  name: string
  category: TraceCategory
  count: number
  sum: number // Total time in ms
  min: number
  max: number
  avg: number
  p50: number
  p95: number
  p99: number
  durations: number[] // Raw durations for percentile calculation
}

/**
 * Hotspot entry with impact score
 */
export interface TraceHotspot extends TraceAggregation {
  impact: number // sum (total time spent)
}

/**
 * Trace tree structure for hierarchical visualization
 */
export interface TraceTree {
  roots: TraceEvent[] // Top-level traces (no parent)
  children: Map<string, TraceEvent[]> // parentId -> children
  byId: Map<string, TraceEvent> // id -> trace
}

/**
 * Core trace interface
 */
export interface PerfTrace {
  /**
   * Start a trace span
   * @param name Operation name
   * @param options Optional configuration
   * @returns Span ID to pass to end()
   */
  start: (name: string, options?: TraceStartOptions) => string

  /**
   * End a trace span
   * @param spanId ID returned from start()
   */
  end: (spanId: string) => void

  /**
   * Record a point-in-time mark
   * @param name Mark name
   * @param options Optional configuration
   */
  mark: (name: string, options?: TraceStartOptions) => void

  /**
   * Measure time between two marks
   * @param name Measure name
   * @param startMark Start mark name
   * @param endMark End mark name
   * @param options Optional configuration
   */
  measure: (name: string, startMark: string, endMark: string, options?: TraceStartOptions) => void

  /**
   * Wrap a synchronous function with tracing
   * @param name Operation name
   * @param options Optional configuration
   * @param fn Function to execute
   * @returns Return value of fn
   */
  wrap: <T>(name: string, options: TraceWrapOptions, fn: () => T) => T

  /**
   * Wrap an async function with tracing
   * @param name Operation name
   * @param options Optional configuration
   * @param fn Async function to execute
   * @returns Promise resolving to return value of fn
   */
  wrapAsync: <T>(name: string, options: TraceWrapOptions, fn: () => Promise<T>) => Promise<T>

  /**
   * Check if tracing is currently enabled
   */
  isEnabled: () => boolean

  /**
   * Enable or disable tracing
   */
  setEnabled: (enabled: boolean) => void

  /**
   * Force flush pending traces to store
   */
  flush: () => void

  /**
   * Get the current parent span ID (for nested tracing)
   */
  getCurrentSpanId: () => string | null
}

/**
 * Configuration for the trace buffer
 */
export interface TraceBufferConfig {
  maxSize: number // Maximum events in buffer before oldest are dropped
  flushBatchSize: number // Max events per flush
  flushDelayMs: number // Delay between flush scheduling
}

/**
 * Default buffer configuration
 */
export const DEFAULT_BUFFER_CONFIG: TraceBufferConfig = {
  maxSize: 10_000,
  flushBatchSize: 1000,
  flushDelayMs: 100, // 100ms max delay via requestIdleCallback timeout
}
