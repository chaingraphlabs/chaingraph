/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { Connection } from '@badaitech/chaingraph-types'
import type { PortConfigFull, PortKey, PortUIState } from './types'
import { trace } from '@/lib/perf-trace'
import { globalReset } from '../common'
import { portsV2Domain } from './domain'

// ============================================================================
// GRANULAR STORES (Normalized by PortKey)
// ============================================================================

/**
 * Port values - HOT PATH (user typing, frequent updates)
 * Only holds runtime values, no config/UI
 *
 * Key: PortKey (`${nodeId}:${portId}`)
 * Value: The port's current value (string, number, object, array, etc.)
 */
export const $portValues = portsV2Domain.createStore<Map<PortKey, unknown>>(
  new Map(),
)

/**
 * Port UI state - MEDIUM PATH (collapse, visibility, editor state)
 * Only holds UI-specific metadata
 *
 * Key: PortKey
 * Value: PortUIState (collapsed, hidden, etc.)
 */
export const $portUI = portsV2Domain.createStore<Map<PortKey, PortUIState>>(
  new Map(),
)

/**
 * Port configurations - COLD PATH (type, constraints, validation rules)
 * Only holds structural/type information
 *
 * Key: PortKey
 * Value: PortConfigFull (type, direction, constraints)
 */
export const $portConfigs = portsV2Domain.createStore<Map<PortKey, PortConfigFull>>(
  new Map(),
)

/**
 * Port connections - COLD PATH (edge references)
 * Only holds connection metadata
 *
 * Key: PortKey
 * Value: Array of connections (nodeId, portId pairs)
 */
export const $portConnections = portsV2Domain.createStore<Map<PortKey, Connection[]>>(
  new Map(),
)

/**
 * Port versions - for conflict resolution
 * Tracks individual port update versions (separate from node version)
 *
 * Key: PortKey
 * Value: Version number
 */
export const $portVersions = portsV2Domain.createStore<Map<PortKey, number>>(
  new Map(),
)

// ============================================================================
// INDEX STORES (For efficient lookups and cleanup)
// ============================================================================

/**
 * Port keys index - tracks which ports belong to which nodes
 * CRITICAL: Required for cleanup when nodes are removed (prevents memory leaks)
 *
 * Key: nodeId
 * Value: Set of PortKeys belonging to that node
 */
export const $nodePortKeys = portsV2Domain.createStore<Map<string, Set<PortKey>>>(
  new Map(),
)

/**
 * Parent-child port relationships
 * Tracks hierarchy for ArrayPort/ObjectPort children
 *
 * parents: childPortKey → parentPortKey
 * children: parentPortKey → Set of childPortKeys
 */
export const $portHierarchy = portsV2Domain.createStore<{
  parents: Map<PortKey, PortKey>
  children: Map<PortKey, Set<PortKey>>
}>({
  parents: new Map(),
  children: new Map(),
})

// ============================================================================
// APPLY EVENTS (Used by buffer to apply batched updates)
// ============================================================================

/**
 * Apply batched value updates
 */
export const applyValueUpdates = portsV2Domain.createEvent<Map<PortKey, unknown>>()

/**
 * Apply batched UI updates
 */
export const applyUIUpdates = portsV2Domain.createEvent<Map<PortKey, PortUIState>>()

/**
 * Apply batched config updates (accepts Partial to handle incremental updates)
 */
export const applyConfigUpdates = portsV2Domain.createEvent<Map<PortKey, Partial<PortConfigFull>>>()

/**
 * Apply batched connection updates
 */
export const applyConnectionUpdates = portsV2Domain.createEvent<Map<PortKey, Connection[]>>()

/**
 * Apply batched version updates
 */
export const applyVersionUpdates = portsV2Domain.createEvent<Map<PortKey, number>>()

/**
 * Apply hierarchy updates (parent-child relationships)
 */
export const applyHierarchyUpdates = portsV2Domain.createEvent<{
  parents: Map<PortKey, PortKey>
  children: Map<PortKey, Set<PortKey>>
}>()

/**
 * Batch remove ports (for cleanup)
 */
export const removePortsBatch = portsV2Domain.createEvent<Set<PortKey>>()

// ============================================================================
// STORE HANDLERS
// ============================================================================

// Value updates
$portValues.on(applyValueUpdates, (state, updates) => {
  if (updates.size === 0)
    return state
  const newState = new Map(state)
  for (const [key, value] of updates) {
    newState.set(key, value)
  }
  return newState
})

// UI updates (merge with existing)
$portUI.on(applyUIUpdates, (state, updates) => {
  if (updates.size === 0)
    return state
  const newState = new Map(state)
  for (const [key, ui] of updates) {
    const existing = state.get(key) || {}
    newState.set(key, { ...existing, ...ui })
  }
  return newState
})

// Config updates (merge Partial with existing complete config)
$portConfigs.on(applyConfigUpdates, (state, updates) => {
  if (updates.size === 0)
    return state
  const spanId = trace.start('store.portConfigs.apply', {
    category: 'store',
    tags: { count: updates.size },
  })
  const newState = new Map(state)
  for (const [key, partialConfig] of updates) {
    const existing = state.get(key)
    // Merge partial with existing, or use partial as-is if no existing
    newState.set(key, existing ? { ...existing, ...partialConfig } as PortConfigFull : partialConfig as PortConfigFull)
  }
  trace.end(spanId)
  return newState
})

// Update $nodePortKeys index when configs are applied
// This is critical for findStaleArrayElementPorts to work
$nodePortKeys.on(applyConfigUpdates, (state, updates) => {
  if (updates.size === 0)
    return state

  const newState = new Map(state)

  for (const [portKey] of updates) {
    // Extract nodeId from portKey (format: "nodeId:portId")
    // Use lastIndexOf to handle nodeIds that contain colons (e.g., "ArrayNode:abc123:array")
    const lastColonIndex = portKey.lastIndexOf(':')
    if (lastColonIndex === -1)
      continue

    const nodeId = portKey.slice(0, lastColonIndex)

    // Add portKey to the node's set
    if (!newState.has(nodeId)) {
      newState.set(nodeId, new Set())
    }
    newState.get(nodeId)!.add(portKey as PortKey)
  }

  return newState
})

// Connection updates
$portConnections.on(applyConnectionUpdates, (state, updates) => {
  if (updates.size === 0)
    return state
  const newState = new Map(state)
  for (const [key, connections] of updates) {
    newState.set(key, connections)
  }
  return newState
})

// Version updates
$portVersions.on(applyVersionUpdates, (state, updates) => {
  if (updates.size === 0)
    return state
  const newState = new Map(state)
  for (const [key, version] of updates) {
    newState.set(key, version)
  }
  return newState
})

/**
 * Sort port keys for consistent ordering
 * - Array elements (e.g., array[0], array[1]) are sorted numerically by index
 * - Object properties are sorted alphabetically
 */
function sortPortKeys(keys: PortKey[]): PortKey[] {
  return keys.sort((a, b) => {
    // Extract the last segment of the portId for comparison
    // e.g., "array[0]" -> "[0]", "array[0].field" -> "field"
    const aPortId = a.slice(a.lastIndexOf(':') + 1)
    const bPortId = b.slice(b.lastIndexOf(':') + 1)

    // Check if both are array elements at the same level
    // Match pattern like "prefix[N]" where N is the index
    const aMatch = aPortId.match(/^(.+)\[(\d+)\]$/)
    const bMatch = bPortId.match(/^(.+)\[(\d+)\]$/)

    if (aMatch && bMatch && aMatch[1] === bMatch[1]) {
      // Both are array elements with same prefix - sort by numeric index
      return Number.parseInt(aMatch[2], 10) - Number.parseInt(bMatch[2], 10)
    }

    // Default: alphabetical sort
    return aPortId.localeCompare(bPortId)
  })
}

// Hierarchy updates (merge with existing)
$portHierarchy.on(applyHierarchyUpdates, (state, updates) => {
  if (updates.parents.size === 0)
    return state

  return {
    parents: new Map([...state.parents, ...updates.parents]),
    children: (() => {
      const merged = new Map(state.children)
      for (const [parentKey, childrenSet] of updates.children) {
        const existing = merged.get(parentKey) || new Set()
        // Merge and sort children for consistent ordering
        const allChildren = [...existing, ...childrenSet]
        const sortedChildren = sortPortKeys(allChildren)
        merged.set(parentKey, new Set(sortedChildren))
      }
      return merged
    })(),
  }
})

// ============================================================================
// CLEANUP HANDLERS
// ============================================================================

$portValues.on(removePortsBatch, (state, portKeys) => {
  if (portKeys.size === 0)
    return state

  const newState = new Map(state)
  for (const key of portKeys) {
    newState.delete(key)
  }
  return newState
})

$portUI.on(removePortsBatch, (state, portKeys) => {
  if (portKeys.size === 0)
    return state
  const newState = new Map(state)
  for (const key of portKeys) {
    newState.delete(key)
  }
  return newState
})

$portConfigs.on(removePortsBatch, (state, portKeys) => {
  if (portKeys.size === 0)
    return state
  const newState = new Map(state)
  for (const key of portKeys) {
    newState.delete(key)
  }
  return newState
})

$portConnections.on(removePortsBatch, (state, portKeys) => {
  if (portKeys.size === 0)
    return state
  const newState = new Map(state)
  for (const key of portKeys) {
    newState.delete(key)
  }
  return newState
})

$portVersions.on(removePortsBatch, (state, portKeys) => {
  if (portKeys.size === 0)
    return state
  const newState = new Map(state)
  for (const key of portKeys) {
    newState.delete(key)
  }
  return newState
})

/**
 * Clean up $portHierarchy when ports are removed
 * - Removes port from parents map
 * - Removes port from parent's children set
 * - Recursively removes any children of the removed port
 */
$portHierarchy.on(removePortsBatch, (state, portKeys) => {
  if (portKeys.size === 0)
    return state

  const newParents = new Map(state.parents)
  const newChildren = new Map(state.children)

  // Collect all ports to remove (including descendants)
  const portsToRemove = new Set<PortKey>()

  // Helper to recursively collect descendants
  function collectDescendants(portKey: PortKey): void {
    portsToRemove.add(portKey)
    const children = newChildren.get(portKey)
    if (children) {
      for (const childKey of children) {
        collectDescendants(childKey)
      }
    }
  }

  // Collect all ports to remove (including their descendants)
  for (const portKey of portKeys) {
    collectDescendants(portKey)
  }

  // Now remove all collected ports
  for (const portKey of portsToRemove) {
    // 1. Get this port's parent
    const parentKey = newParents.get(portKey)

    // 2. Remove this port from parent's children set
    if (parentKey) {
      const siblings = newChildren.get(parentKey)
      if (siblings) {
        siblings.delete(portKey)
        if (siblings.size === 0) {
          newChildren.delete(parentKey)
        }
      }
    }

    // 3. Remove this port's parent entry
    newParents.delete(portKey)

    // 4. Remove this port's children entry (if any)
    newChildren.delete(portKey)
  }

  return { parents: newParents, children: newChildren }
})

/**
 * Update $nodePortKeys index when individual ports are removed
 * (Node removal is handled separately in cleanup.ts)
 */
$nodePortKeys.on(removePortsBatch, (state, portKeys) => {
  if (portKeys.size === 0)
    return state

  const newState = new Map(state)

  for (const portKey of portKeys) {
    // Extract nodeId from portKey (format: "nodeId:portId")
    const colonIndex = portKey.lastIndexOf(':')
    if (colonIndex === -1)
      continue

    const nodeId = portKey.slice(0, colonIndex)
    const nodePortKeys = newState.get(nodeId)

    if (nodePortKeys) {
      nodePortKeys.delete(portKey)
      if (nodePortKeys.size === 0) {
        newState.delete(nodeId)
      }
    }
  }

  return newState
})

// ============================================================================
// GLOBAL RESET
// ============================================================================

$portValues.reset(globalReset)
$portUI.reset(globalReset)
$portConfigs.reset(globalReset)
$portConnections.reset(globalReset)
$portVersions.reset(globalReset)
$nodePortKeys.reset(globalReset)
$portHierarchy.reset(globalReset)
