/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { PortKey, PortUpdateEvent, ProcessedBatch } from './types'
import { sample } from 'effector'
import { interval } from 'patronum'
import { portsV2Domain } from './domain'
import { mergePortEvents } from './merge'
import {
  applyConfigUpdates,
  applyConnectionUpdates,
  applyHierarchyUpdates,
  applyUIUpdates,
  applyValueUpdates,
  applyVersionUpdates,
} from './stores'
import { fromPortKey, toPortKey } from './utils'

/**
 * Maximum buffer size to prevent memory overflow
 * If exceeded, events continue to accumulate (never dropped) with a warning
 */
const MAX_BUFFER_SIZE = 500

/**
 * Batch processing interval (16ms = ~60fps)
 * Configurable via env var for different deployment scenarios
 */
const BATCH_INTERVAL_MS = Number(import.meta.env.VITE_PORT_BATCH_INTERVAL) || 16

// ============================================================================
// EVENTS
// ============================================================================

/**
 * Event fired when a single port update is received
 * (from subscription, local optimistic update, etc.)
 */
export const portUpdateReceived = portsV2Domain.createEvent<PortUpdateEvent>()

/**
 * Event fired when multiple port updates are received at once
 * (bulk updates from server, initial flow load, etc.)
 */
export const portUpdatesReceived = portsV2Domain.createEvent<PortUpdateEvent[]>()

/**
 * Event fired on each tick to trigger batch processing
 */
export const processBatchTick = portsV2Domain.createEvent()

// ============================================================================
// BUFFER STORE
// ============================================================================

/**
 * Internal buffer store that accumulates events
 * (after echo detection filtering)
 */
const $bufferedUpdates = portsV2Domain.createStore<PortUpdateEvent[]>([])

// Add filtered events to buffer (populated by echo-detection.ts)
$bufferedUpdates.on(portUpdatesReceived, (buffer, events) => {
  if (buffer.length + events.length >= MAX_BUFFER_SIZE) {
    console.warn(
      `[PortsV2] Large batch (${events.length} events, buffer: ${buffer.length}/${MAX_BUFFER_SIZE}), `
      + `will process across multiple ticks`,
    )
  }
  return [...buffer, ...events]
})

// ============================================================================
// TICKER
// ============================================================================

/**
 * Ticker control events
 */
const tickerStart = portsV2Domain.createEvent()
const tickerStop = portsV2Domain.createEvent()

/**
 * Ticker triggers batch processing every ~16ms (60fps)
 * Only runs when there are events to process
 */
const ticker = interval({
  timeout: BATCH_INTERVAL_MS,
  start: tickerStart,
  stop: tickerStop,
})

// Auto-start ticker when first event arrives
sample({
  clock: portUpdatesReceived,
  source: $bufferedUpdates,
  filter: (buffer, events) => {
    const wasEmpty = buffer.length === events.length // Buffer was empty before adding these events
    return wasEmpty
  },
  target: tickerStart,
})

// Fire processBatchTick on each tick
sample({
  clock: ticker.tick,
  target: processBatchTick,
})

// ============================================================================
// BATCH PROCESSOR
// ============================================================================

/**
 * Batch processor effect - merges and deduplicates buffered updates
 * Returns a ProcessedBatch with updates split by concern (value, UI, config, etc.)
 */
export const batchProcessor = portsV2Domain.createEffect<PortUpdateEvent[], ProcessedBatch>(
  (buffer: PortUpdateEvent[]): ProcessedBatch => {
    if (buffer.length === 0) {
      return {
        valueUpdates: new Map(),
        uiUpdates: new Map(),
        configUpdates: new Map(),
        connectionUpdates: new Map(),
        versionUpdates: new Map(),
        hierarchyUpdates: {
          parents: new Map(),
          children: new Map(),
        },
      }
    }

    // Group updates by portKey
    const byPort = new Map<string, PortUpdateEvent[]>()
    for (const event of buffer) {
      const existing = byPort.get(event.portKey) || []
      byPort.set(event.portKey, [...existing, event])
    }

    // Merge updates per port
    const valueUpdates = new Map()
    const uiUpdates = new Map()
    const configUpdates = new Map()
    const connectionUpdates = new Map()
    const versionUpdates = new Map()
    const hierarchyUpdates = {
      parents: new Map<PortKey, PortKey>(),
      children: new Map<PortKey, Set<PortKey>>(),
    }

    for (const [portKey, events] of byPort.entries()) {
      const merged = mergePortEvents(events)

      if (merged.value !== undefined) {
        valueUpdates.set(portKey, merged.value)
      }
      if (merged.ui && Object.keys(merged.ui).length > 0) {
        uiUpdates.set(portKey, merged.ui)
      }
      if (merged.config) {
        configUpdates.set(portKey, merged.config)
      }
      if (merged.connections && merged.connections.length > 0) {
        connectionUpdates.set(portKey, merged.connections)
      }
      if (merged.version !== undefined) {
        versionUpdates.set(portKey, merged.version)
      }

      // Build hierarchy for child ports using config.parentId from backend
      // The backend correctly sets parentId for all child ports:
      // - inputMessage.role → parentId: 'inputMessage'
      // - inputMessage.parts[0] → parentId: 'inputMessage.parts'
      // - inputMessage.parts[0].text → parentId: 'inputMessage.parts[0]'
      const { nodeId: nodeIdFromKey } = fromPortKey(portKey as PortKey)
      const parentId = merged.config?.parentId

      if (parentId) {
        const parentKey = toPortKey(nodeIdFromKey, parentId)

        // Track parent-child relationship
        hierarchyUpdates.parents.set(portKey as PortKey, parentKey)

        // Add child to parent's children set
        if (!hierarchyUpdates.children.has(parentKey)) {
          hierarchyUpdates.children.set(parentKey, new Set())
        }
        hierarchyUpdates.children.get(parentKey)!.add(portKey as PortKey)
      }
    }

    if (hierarchyUpdates.parents.size > 0) {
      console.log(`[PortsV2/Batch] Built ${hierarchyUpdates.parents.size} parent-child relationships`)
    }

    return {
      valueUpdates,
      uiUpdates,
      configUpdates,
      connectionUpdates,
      versionUpdates,
      hierarchyUpdates,
    }
  },
)

// ============================================================================
// WIRING
// ============================================================================

/**
 * Wire: Tick → Process Buffer
 */
sample({
  clock: processBatchTick,
  source: $bufferedUpdates,
  filter: buffer => buffer.length > 0,
  target: batchProcessor,
})

/**
 * Wire: Batch Processor Done → Apply Updates
 */
sample({
  clock: batchProcessor.done,
  fn: ({ result }) => result.valueUpdates,
  target: applyValueUpdates,
})

sample({
  clock: batchProcessor.done,
  fn: ({ result }) => result.uiUpdates,
  target: applyUIUpdates,
})

sample({
  clock: batchProcessor.done,
  fn: ({ result }) => result.configUpdates,
  target: applyConfigUpdates,
})

sample({
  clock: batchProcessor.done,
  fn: ({ result }) => result.connectionUpdates,
  target: applyConnectionUpdates,
})

sample({
  clock: batchProcessor.done,
  fn: ({ result }) => result.versionUpdates,
  target: applyVersionUpdates,
})

sample({
  clock: batchProcessor.done,
  fn: ({ result }) => result.hierarchyUpdates,
  target: applyHierarchyUpdates,
})

/**
 * Wire: Batch Processor Done → Clear Buffer
 */
sample({
  clock: batchProcessor.done,
  fn: () => [],
  target: $bufferedUpdates,
})

/**
 * Wire: Buffer Empty → Stop Ticker
 * Saves CPU when there are no events to process
 */
sample({
  clock: $bufferedUpdates,
  filter: buffer => buffer.length === 0,
  target: tickerStop,
})
