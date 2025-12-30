/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { Event, Store } from 'effector'
import type { PerfTrace, TraceStartOptions } from './types'
import { sample } from 'effector'

/**
 * Trace a store's update handler.
 *
 * Creates a sample that traces the timing of store updates.
 *
 * @param trace PerfTrace instance
 * @param store The Effector store to trace
 * @param name Name for the trace (e.g., 'store.myStore.update')
 * @param options Additional trace options
 *
 * @example
 * ```ts
 * traceStore(trace, $nodePositions, 'store.nodePositions.update', { category: 'store' })
 * ```
 */
export function traceStore<T>(
  trace: PerfTrace,
  store: Store<T>,
  name: string,
  options: TraceStartOptions = {},
): void {
  // Use sample to trace store updates without modifying the store
  sample({
    clock: store,
    fn: (state) => {
      // Trace the moment the store updates
      const spanId = trace.start(name, { ...options, category: options.category ?? 'store' })
      // End immediately (store update is synchronous)
      trace.end(spanId)
      return state
    },
  })
}

/**
 * Create a traced version of an Effector event.
 *
 * Returns a new event that wraps the original, tracing each trigger.
 *
 * @param trace PerfTrace instance
 * @param event The Effector event to trace
 * @param name Name for the trace (e.g., 'event.myEvent')
 * @param options Additional trace options
 *
 * @example
 * ```ts
 * const tracedEvent = traceEvent(trace, myEvent, 'event.myEvent', { category: 'event' })
 * // Use tracedEvent instead of myEvent where timing matters
 * ```
 */
export function traceEvent<T>(
  trace: PerfTrace,
  event: Event<T>,
  name: string,
  options: TraceStartOptions = {},
): Event<T> {
  // Create a sample that traces the event
  sample({
    clock: event,
    fn: (payload) => {
      const spanId = trace.start(name, { ...options, category: options.category ?? 'event' })
      trace.end(spanId)
      return payload
    },
  })

  // Return original event (sample already subscribes)
  return event
}

/**
 * Trace a sample() computation.
 *
 * Wraps the fn callback to trace its execution time.
 *
 * @param trace PerfTrace instance
 * @param name Name for the trace (e.g., 'sample.positions.delta')
 * @param fn The sample fn callback
 * @param options Additional trace options
 *
 * @example
 * ```ts
 * sample({
 *   clock: $nodePositions,
 *   source: $renderMap,
 *   fn: traceSampleFn(trace, 'sample.positions.delta', (renderMap, positions) => {
 *     // computation
 *     return result
 *   }),
 *   target: someEvent,
 * })
 * ```
 */
export function traceSampleFn<S, C, R>(
  trace: PerfTrace,
  name: string,
  fn: (source: S, clock: C) => R,
  options: TraceStartOptions = {},
): (source: S, clock: C) => R {
  return (source, clock) => {
    return trace.wrap(name, { ...options, category: options.category ?? 'sample' }, () => {
      return fn(source, clock)
    })
  }
}

/**
 * Create a traced effect handler.
 *
 * Wraps an effect handler with timing traces.
 *
 * @param trace PerfTrace instance
 * @param name Name for the trace
 * @param handler The effect handler
 * @param options Additional trace options
 *
 * @example
 * ```ts
 * const fetchUserFx = createEffect(traceEffect(trace, 'effect.fetchUser', async (id: string) => {
 *   const response = await fetch(`/api/users/${id}`)
 *   return response.json()
 * }))
 * ```
 */
export function traceEffect<P, R>(
  trace: PerfTrace,
  name: string,
  handler: (params: P) => Promise<R>,
  options: TraceStartOptions = {},
): (params: P) => Promise<R> {
  return async (params) => {
    return trace.wrapAsync(name, { ...options, category: options.category ?? 'effect' }, () => {
      return handler(params)
    })
  }
}
