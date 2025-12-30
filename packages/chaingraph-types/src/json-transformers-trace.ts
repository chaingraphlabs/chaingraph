/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

/**
 * Callbacks for tracing transformer operations (deserialization performance)
 * Separated into its own file to avoid circular dependencies
 */
export interface TransformerTraceCallbacks {
  onDeserializeStart?: (type: string) => string | null // returns spanId
  onDeserializeEnd?: (spanId: string | null) => void
}

// Module-level callbacks storage
let traceCallbacks: TransformerTraceCallbacks | null = null

/**
 * Set trace callbacks for transformer operations
 * Call this after registerSuperjsonTransformers() to enable tracing
 */
export function setTransformerTraceCallbacks(callbacks: TransformerTraceCallbacks | null): void {
  traceCallbacks = callbacks
}

/**
 * Get current trace callbacks (used by individual transformer files)
 */
export function getTransformerTraceCallbacks(): TransformerTraceCallbacks | null {
  return traceCallbacks
}
