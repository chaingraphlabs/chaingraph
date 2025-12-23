/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

/**
 * Ports-V2 Direct Updates (no buffer)
 *
 * Port updates are applied synchronously to stores.
 * Batching is handled by:
 * - Global event buffer (50ms) for subscription events
 * - Effector transactions for same-tick updates
 * - React 18 automatic batching for renders
 *
 * This eliminates the race condition where edges checked $portConfigs
 * before ports were flushed from the async buffer.
 */

import type { PortKey, PortUpdateEvent, ProcessedBatch } from './types'
import { sample } from 'effector'
import { spread } from 'patronum'
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

// ============================================================================
// DIRECT PROCESSING (NO BUFFER)
// ============================================================================

/**
 * Process batch of port updates and split by concern
 * Same logic as old batchProcessor, but pure function (synchronous)
 */
function processPortUpdates(events: PortUpdateEvent[]): ProcessedBatch {
  if (events.length === 0) {
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
  for (const event of events) {
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

  for (const [portKey, portEvents] of byPort.entries()) {
    const merged = mergePortEvents(portEvents)

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

  return {
    valueUpdates,
    uiUpdates,
    configUpdates,
    connectionUpdates,
    versionUpdates,
    hierarchyUpdates,
  }
}

// ============================================================================
// WIRING: Direct Application (Synchronous) using patronum spread
// ============================================================================

/**
 * Batch updates → Process → Spread to all stores (SYNC)
 * Uses patronum's spread() for clean object-to-targets mapping
 */
sample({
  clock: portUpdatesReceived,
  filter: events => events.length > 0,
  fn: processPortUpdates,
  target: spread({
    valueUpdates: applyValueUpdates,
    uiUpdates: applyUIUpdates,
    configUpdates: applyConfigUpdates,
    connectionUpdates: applyConnectionUpdates,
    versionUpdates: applyVersionUpdates,
    hierarchyUpdates: applyHierarchyUpdates,
  }),
})

/**
 * Single update → Convert to batch → Same processing
 */
sample({
  clock: portUpdateReceived,
  fn: event => [event],
  target: portUpdatesReceived,
})
