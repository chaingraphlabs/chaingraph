/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { PerfTrace, TraceStartOptions, TraceWrapOptions } from './types'

/**
 * No-op implementation of PerfTrace.
 *
 * Used in production builds where tracing is disabled.
 * All methods are essentially empty, providing zero runtime overhead.
 */
class NoopTrace implements PerfTrace {
  start(_name: string, _options?: TraceStartOptions): string {
    return ''
  }

  end(_spanId: string): void {
    // No-op
  }

  mark(_name: string, _options?: TraceStartOptions): void {
    // No-op
  }

  measure(
    _name: string,
    _startMark: string,
    _endMark: string,
    _options?: TraceStartOptions,
  ): void {
    // No-op
  }

  wrap<T>(_name: string, _options: TraceWrapOptions, fn: () => T): T {
    return fn()
  }

  async wrapAsync<T>(
    _name: string,
    _options: TraceWrapOptions,
    fn: () => Promise<T>,
  ): Promise<T> {
    return fn()
  }

  isEnabled(): boolean {
    return false
  }

  setEnabled(_enabled: boolean): void {
    // No-op
  }

  flush(): void {
    // No-op
  }

  getCurrentSpanId(): string | null {
    return null
  }
}

// Singleton noop instance
const noopInstance = new NoopTrace()

/**
 * Create a no-op trace instance for production.
 * Returns a singleton to minimize memory footprint.
 */
export function createNoopTrace(): PerfTrace {
  return noopInstance
}
