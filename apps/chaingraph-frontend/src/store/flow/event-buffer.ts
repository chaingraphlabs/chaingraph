/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { FlowEvent } from '@badaitech/chaingraph-types'
import { FlowEventType } from '@badaitech/chaingraph-types'
import { sample } from 'effector'
import { interval } from 'patronum'
import { trace } from '@/lib/perf-trace'
import { flowDomain } from '@/store/domains'
import { globalReset } from '../common'

/**
 * Global Flow Event Buffer
 *
 * Solves race condition where edges render before nodes during flow initialization.
 *
 * PROBLEM:
 * - addNodes triggers xyflowStructureChanged with 50ms debounce
 * - setEdges updates $xyflowEdges immediately
 * - $xyflowEdges filters out edges because $xyflowNodes is empty
 *
 * SOLUTION:
 * - Buffer ALL FlowEvents from subscription
 * - On FlowInitEnd signal: flush buffer immediately (atomic init)
 * - On timeout (50ms): flush buffer (live updates)
 * - Events dispatched to newFlowEvents in original order
 */

// ============================================================================
// CONFIGURATION
// ============================================================================

/**
 * Buffer stabilization interval in milliseconds
 * Configurable via env var for different deployment scenarios
 */
const BUFFER_INTERVAL_MS = Number(import.meta.env.VITE_FLOW_EVENT_BUFFER_INTERVAL) || 50

// ============================================================================
// EVENTS
// ============================================================================

/**
 * Event fired when a raw FlowEvent is received from subscription
 * This is the entry point - subscription sends events here instead of newFlowEvents
 */
export const flowEventReceived = flowDomain.createEvent<FlowEvent>()

/**
 * Event fired when buffered events are ready to be processed
 * This is the output of the buffer - handlers in stores.ts subscribe to this
 */
export const newFlowEvents = flowDomain.createEvent<FlowEvent[]>()

/**
 * Event fired to trigger immediate buffer flush (e.g., on FlowInitEnd)
 */
export const flushBuffer = flowDomain.createEvent()

/**
 * Internal: Ticker tick event
 */
const processTick = flowDomain.createEvent()

// ============================================================================
// STORES
// ============================================================================

/**
 * Buffer store - accumulates events until flush
 */
export const $flowEventBuffer = flowDomain.createStore<FlowEvent[]>([])
  .on(flowEventReceived, (buffer, event) => [...buffer, event])
  .reset(globalReset)

// ============================================================================
// TICKER
// ============================================================================

const tickerStart = flowDomain.createEvent()
const tickerStop = flowDomain.createEvent()

/**
 * Ticker triggers buffer processing every BUFFER_INTERVAL_MS
 * Only runs when there are events to process
 */
const ticker = interval({
  timeout: BUFFER_INTERVAL_MS,
  start: tickerStart,
  stop: tickerStop,
})

// Forward ticker tick to processTick
sample({
  clock: ticker.tick,
  target: processTick,
})

// ============================================================================
// AUTO-START/STOP TICKER
// ============================================================================

/**
 * Auto-start ticker when first event arrives (buffer was empty)
 */
sample({
  clock: flowEventReceived,
  source: $flowEventBuffer,
  filter: buffer => buffer.length === 1, // Was empty, now has 1 event
  target: tickerStart,
})

/**
 * Auto-stop ticker when buffer is empty
 */
sample({
  clock: $flowEventBuffer,
  filter: buffer => buffer.length === 0,
  target: tickerStop,
})

// ============================================================================
// COMMIT SIGNAL: FlowInitEnd
// ============================================================================

/**
 * Detect FlowInitEnd and flush immediately
 * This ensures atomic processing of flow initialization events
 */
sample({
  clock: flowEventReceived,
  filter: event => event.type === FlowEventType.FlowInitEnd,
  target: flushBuffer,
})

// ============================================================================
// BUFFER PROCESSOR
// ============================================================================

/**
 * Process buffer effect - dispatches events to newFlowEvents and clears buffer
 */
const processBufferFx = flowDomain.createEffect((buffer: FlowEvent[]) => {
  if (buffer.length === 0)
    return []

  const spanId = trace.start('flow.event-buffer.flush', {
    category: 'effect',
    tags: { eventCount: buffer.length },
  })

  // Dispatch all buffered events in order to newFlowEvents
  // The existing handler in stores.ts processes them correctly
  newFlowEvents(buffer)

  trace.end(spanId)

  return buffer // Return for logging/debugging
})

/**
 * Wire: Flush signal -> process buffer
 */
sample({
  clock: flushBuffer,
  source: $flowEventBuffer,
  filter: buffer => buffer.length > 0,
  target: processBufferFx,
})

/**
 * Wire: Ticker tick -> process buffer
 */
sample({
  clock: processTick,
  source: $flowEventBuffer,
  filter: buffer => buffer.length > 0,
  target: processBufferFx,
})

/**
 * Wire: After processing -> clear buffer
 */
sample({
  clock: processBufferFx.done,
  fn: () => [],
  target: $flowEventBuffer,
})
