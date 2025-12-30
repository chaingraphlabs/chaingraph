/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { PortKey } from './types'
import { sample } from 'effector'
import { interval } from 'patronum'
import { globalReset } from '../common'
import { portsV2Domain } from './domain'

/**
 * Pending mutation tracking for optimistic updates and echo matching
 *
 * Tracks port value mutations that have been applied optimistically locally
 * but haven't been confirmed by the server yet. Used to:
 * 1. Match server echoes to confirm successful mutations
 * 2. Detect and drop stale echoes (out-of-order arrivals)
 * 3. Support multi-user collaboration (distinguish own echoes from other users)
 */

export interface PendingMutation {
  /** Port being mutated */
  portKey: PortKey

  /** Value sent to server */
  value: unknown

  /** Expected node version after mutation */
  version: number

  /** When mutation was sent (for staleness detection) */
  timestamp: number

  /** Unique mutation ID (for echo matching) */
  mutationId: string

  /** Client session ID (for multi-tab/multi-user support) */
  clientId: string
}

/**
 * Store of pending mutations by portKey
 * Multiple mutations can be pending for same port during fast typing
 */
export const $pendingPortMutations = portsV2Domain
  .createStore<Map<PortKey, PendingMutation[]>>(new Map())
  .reset(globalReset)

/**
 * Add a pending mutation when user makes local change
 */
export const addPendingMutation = portsV2Domain.createEvent<PendingMutation>()

/**
 * Confirm pending mutation when server echo matches
 */
export const confirmPendingMutation = portsV2Domain.createEvent<{
  portKey: PortKey
  mutationId: string
}>()

/**
 * Reject pending mutation (server error or conflict)
 */
export const rejectPendingMutation = portsV2Domain.createEvent<{
  portKey: PortKey
  mutationId: string
  reason: string
}>()

// ============================================================================
// STORE HANDLERS
// ============================================================================

$pendingPortMutations
  .on(addPendingMutation, (state, mutation) => {
    const newState = new Map(state)
    const existing = newState.get(mutation.portKey) || []
    newState.set(mutation.portKey, [...existing, mutation])
    return newState
  })
  .on(confirmPendingMutation, (state, { portKey, mutationId }) => {
    const newState = new Map(state)
    const pending = state.get(portKey) || []
    const filtered = pending.filter(m => m.mutationId !== mutationId)

    if (filtered.length === 0) {
      newState.delete(portKey)
    } else {
      newState.set(portKey, filtered)
    }

    return newState
  })
  .on(rejectPendingMutation, (state, { portKey, mutationId, reason }) => {
    console.warn(`[PendingMutations] Rejected ${mutationId} for ${portKey}: ${reason}`)

    const newState = new Map(state)
    const pending = state.get(portKey) || []
    const filtered = pending.filter(m => m.mutationId !== mutationId)

    if (filtered.length === 0) {
      newState.delete(portKey)
    } else {
      newState.set(portKey, filtered)
    }

    return newState
  })

// ============================================================================
// AUTO-CLEANUP: Remove stale pending mutations
// ============================================================================

const MUTATION_TIMEOUT_MS = 10_000 // 10 seconds

/**
 * Periodic cleanup of pending mutations older than 10 seconds
 * Prevents memory leak if server never responds
 */
const startCleanupTimer = portsV2Domain.createEvent()
const stopCleanupTimer = portsV2Domain.createEvent()

const { tick: cleanupTick } = interval({
  timeout: 5_000, // Check every 5 seconds
  start: startCleanupTimer,
  stop: stopCleanupTimer,
})

// Auto-start cleanup timer
startCleanupTimer()

sample({
  clock: cleanupTick,
  source: $pendingPortMutations,
  fn: (mutations) => {
    const now = Date.now()
    const newState = new Map<PortKey, PendingMutation[]>()

    for (const [portKey, pending] of mutations) {
      const valid = pending.filter(m => now - m.timestamp < MUTATION_TIMEOUT_MS)

      if (valid.length > 0) {
        newState.set(portKey, valid)
      } else if (pending.length > 0) {
        console.warn(
          `[PendingMutations] Auto-cleaned ${pending.length} stale mutations for ${portKey}`,
        )
      }
    }

    return newState
  },
  target: $pendingPortMutations,
})

// ============================================================================
// UTILITIES
// ============================================================================

/**
 * Generate unique mutation ID
 */
export function generateMutationId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

/**
 * Get client session ID (stored in sessionStorage)
 * Used to distinguish own mutations from other tabs/users
 */
export function getClientId(): string {
  let clientId = sessionStorage.getItem('chaingraph_client_id')
  if (!clientId) {
    clientId = `client-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    sessionStorage.setItem('chaingraph_client_id', clientId)
  }
  return clientId
}
