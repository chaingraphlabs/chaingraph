/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { Connection } from '@badaitech/chaingraph-types'
import type { MergedPortUpdate, PortUpdateEvent } from './types'
import { mergeUIStates } from './utils'

/**
 * Merges multiple port update events for the same port.
 *
 * Strategy:
 * - Last-win for values (most recent timestamp)
 * - Deep merge for UI state (combine all UI updates)
 * - Version-based for configs (highest version wins)
 * - Union for connections (combine all connection changes)
 *
 * @param events - Array of port update events for the same port (may be in any order)
 * @returns Merged port update with all changes combined
 */
export function mergePortEvents(events: PortUpdateEvent[]): MergedPortUpdate & { version?: number } {
  if (events.length === 0) {
    return {}
  }

  if (events.length === 1) {
    const event = events[0]
    return {
      value: event.changes.value,
      ui: event.changes.ui,
      config: event.changes.config,
      connections: event.changes.connections,
      version: event.version,
    }
  }

  // Sort by VERSION (primary), timestamp (secondary) for deterministic processing
  const sorted = [...events].sort((a, b) => {
    // Primary: Version (higher version wins)
    if (a.version !== undefined && b.version !== undefined && a.version !== b.version) {
      return a.version - b.version
    }
    // Secondary: Timestamp
    return a.timestamp - b.timestamp
  })

  let value: unknown | undefined
  let ui: Record<string, unknown> = {}
  let config: Record<string, unknown> = {} // Use Record for dynamic accumulation, cast at end
  let connections: Connection[] | undefined
  let highestVersion = 0
  let latestVersion: number | undefined

  for (const event of sorted) {
    // VALUE: Last-win by VERSION (not timestamp) to prevent stale echoes
    if (event.changes.value !== undefined) {
      // Only apply if this version is >= current highest
      if (event.version === undefined || event.version >= highestVersion) {
        value = event.changes.value
        if (event.version !== undefined) {
          highestVersion = event.version
        }
      }
      // else: Drop stale value (version too old)
    }

    // UI: Deep merge (accumulate all changes)
    if (event.changes.ui) {
      ui = mergeUIStates(ui, event.changes.ui)
    }

    // CONFIG: Version-based (highest version wins)
    if (event.changes.config && event.version !== undefined) {
      if (event.version >= highestVersion) {
        config = { ...config, ...event.changes.config }
        highestVersion = event.version
      }
    } else if (event.changes.config && event.version === undefined) {
      // If no version, apply config changes (optimistic local updates)
      config = { ...config, ...event.changes.config }
    }

    // CONNECTIONS: Union (combine all connection changes, removing duplicates)
    if (event.changes.connections) {
      connections = mergeConnections(connections || [], event.changes.connections)
    }

    // Track latest version for version updates
    if (event.version !== undefined && event.version > (latestVersion || 0)) {
      latestVersion = event.version
    }
  }

  return {
    value,
    ui: Object.keys(ui).length > 0 ? (ui as any) : undefined,
    config: config && Object.keys(config).length > 0 ? (config as any) : undefined,
    connections,
    version: latestVersion,
  }
}

/**
 * Merge connection arrays - remove duplicates, preserve order
 *
 * @param existing - Existing connections
 * @param incoming - New connections to merge
 * @returns Merged array with no duplicates
 */
export function mergeConnections(
  existing: Connection[],
  incoming: Connection[],
): Connection[] {
  const merged = [...existing]

  for (const conn of incoming) {
    const exists = merged.some(
      c => c.nodeId === conn.nodeId && c.portId === conn.portId,
    )
    if (!exists) {
      merged.push(conn)
    }
  }

  return merged
}
