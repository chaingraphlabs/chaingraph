/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { Connection } from '@badaitech/chaingraph-types'
import type { PortConfigFull, PortKey, PortUIState } from './types'
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
  const newState = new Map(state)
  for (const [key, partialConfig] of updates) {
    const existing = state.get(key)
    // Merge partial with existing, or use partial as-is if no existing
    newState.set(key, existing ? { ...existing, ...partialConfig } as PortConfigFull : partialConfig as PortConfigFull)
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

// Hierarchy updates (merge with existing)
$portHierarchy.on(applyHierarchyUpdates, (state, updates) => {
  if (updates.parents.size === 0)
    return state

  console.log(`[PortsV2/Store] $portHierarchy applying ${updates.parents.size} parent-child updates`)

  return {
    parents: new Map([...state.parents, ...updates.parents]),
    children: (() => {
      const merged = new Map(state.children)
      for (const [parentKey, childrenSet] of updates.children) {
        const existing = merged.get(parentKey) || new Set()
        merged.set(parentKey, new Set([...existing, ...childrenSet]))
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

// Also update $nodePortKeys when ports are removed
// Note: This is handled in cleanup.ts via removeNode event

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
