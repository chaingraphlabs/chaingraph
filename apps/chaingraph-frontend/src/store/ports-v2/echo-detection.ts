/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { Connection } from '@badaitech/chaingraph-types'
import type { PendingMutation } from './pending-mutations'
import type { PortUpdateEvent } from './types'
import { sample } from 'effector'
import { portUpdateReceived, portUpdatesReceived } from './buffer'
import { portsV2Domain } from './domain'
import { $isGranularWriteEnabled } from './feature-flags'
import { $pendingPortMutations, confirmPendingMutation } from './pending-mutations'
import { $portConfigs, $portConnections, $portUI, $portValues } from './stores'
import { isDeepEqual } from './utils'

/**
 * Echo detection - filters out updates that match current state
 * Enhanced with 3-step mutation matching to prevent race conditions
 *
 * THREE-STEP DETECTION:
 * 1. Mutation match - check if echo matches pending mutation (own echo)
 * 2. Staleness check - drop echoes older than latest pending version
 * 3. Duplicate check - filter out unchanged data
 */

// Echo filtering effect with mutation matching
const echoFilterFx = portsV2Domain.createEffect(
  (payload: {
    event: PortUpdateEvent
    enabled: boolean
    values: Map<string, unknown>
    ui: Map<string, any>
    configs: Map<string, any>
    connections: Map<string, Connection[]>
    pendingMutations: Map<string, PendingMutation[]>
  }): {
    filtered: PortUpdateEvent[]
    confirmedMutations: Array<{ portKey: PortUpdateEvent['portKey'], mutationId: string }>
  } => {
    const { event, enabled, values, ui, configs, connections, pendingMutations } = payload

    // If granular stores disabled, pass through
    if (!enabled) {
      return { filtered: [event], confirmedMutations: [] }
    }

    const portKey = event.portKey
    const confirmedMutations: Array<{ portKey: PortUpdateEvent['portKey'], mutationId: string }> = []

    // ============================================================
    // STEP 1: Check for mutation match (own echo confirmation)
    // ============================================================
    if (event.changes.value !== undefined && event.version !== undefined) {
      const pending = pendingMutations.get(portKey) || []

      // Find matching mutation by version and value
      const matchedMutation = pending.find(m =>
        m.version === event.version
        && isDeepEqual(m.value, event.changes.value),
      )

      if (matchedMutation) {
        // This is our own echo - already applied optimistically
        confirmedMutations.push({
          portKey,
          mutationId: matchedMutation.mutationId,
        })

        // Still process other changes (ui, config, connections)
        const filtered: PortUpdateEvent['changes'] = {}
        let hasOtherChanges = false

        if (event.changes.ui) {
          const currentUI = ui.get(portKey) || {}
          const mergedUI = { ...currentUI, ...event.changes.ui }
          if (!isDeepEqual(currentUI, mergedUI)) {
            filtered.ui = event.changes.ui
            hasOtherChanges = true
          }
        }

        if (event.changes.config) {
          const currentConfig = configs.get(portKey)
          if (!currentConfig || !isDeepEqual(currentConfig, { ...currentConfig, ...event.changes.config })) {
            filtered.config = event.changes.config
            hasOtherChanges = true
          }
        }

        if (event.changes.connections) {
          const currentConnections = connections.get(portKey) || []
          if (!isDeepEqual(currentConnections, event.changes.connections)) {
            filtered.connections = event.changes.connections
            hasOtherChanges = true
          }
        }

        if (!hasOtherChanges) {
          return { filtered: [], confirmedMutations }
        }

        return {
          filtered: [{ ...event, changes: filtered }],
          confirmedMutations,
        }
      }
    }

    // ============================================================
    // STEP 2: Staleness check (drop old echoes)
    // ============================================================
    if (event.changes.value !== undefined && event.version !== undefined) {
      const pending = pendingMutations.get(portKey) || []

      if (pending.length > 0) {
        // Get latest pending mutation version
        const latestPendingVersion = Math.max(...pending.map(m => m.version))

        // If echo version is older than latest pending, it's stale
        if (event.version < latestPendingVersion) {
          console.warn(
            `[EchoDetection] Dropping stale echo for ${portKey}: `
            + `echo version ${event.version} < pending version ${latestPendingVersion}`,
          )
          return { filtered: [], confirmedMutations: [] }
        }
      }
    }

    // ============================================================
    // STEP 3: Duplicate check (existing logic)
    // ============================================================
    const filtered: PortUpdateEvent['changes'] = {}
    let hasChanges = false

    // Check value changes using deep equality
    if (event.changes.value !== undefined) {
      const currentValue = values.get(portKey)
      if (!isDeepEqual(currentValue, event.changes.value)) {
        filtered.value = event.changes.value
        hasChanges = true
      }
    }

    // Check UI changes - deep comparison of merged result
    if (event.changes.ui) {
      const currentUI = ui.get(portKey) || {}
      const mergedUI = { ...currentUI, ...event.changes.ui }
      if (!isDeepEqual(currentUI, mergedUI)) {
        filtered.ui = event.changes.ui
        hasChanges = true
      }
    }

    // Check config changes
    if (event.changes.config) {
      const currentConfig = configs.get(portKey)
      if (!currentConfig || !isDeepEqual(currentConfig, { ...currentConfig, ...event.changes.config })) {
        filtered.config = event.changes.config
        hasChanges = true
      }
    }

    // Check connection changes
    if (event.changes.connections) {
      const currentConnections = connections.get(portKey) || []
      if (!isDeepEqual(currentConnections, event.changes.connections)) {
        filtered.connections = event.changes.connections
        hasChanges = true
      }
    }

    // If nothing changed, filter out (echo/duplicate detected)
    if (!hasChanges) {
      return { filtered: [], confirmedMutations: [] }
    }

    // Return event with only changed fields
    return {
      filtered: [{
        ...event,
        changes: filtered,
      }],
      confirmedMutations: [],
    }
  },
)

// Wire: portUpdateReceived → echoFilter → portUpdatesReceived + confirmations
sample({
  clock: portUpdateReceived,
  source: {
    enabled: $isGranularWriteEnabled,
    values: $portValues,
    ui: $portUI,
    configs: $portConfigs,
    connections: $portConnections,
    pendingMutations: $pendingPortMutations,
  },
  fn: (source, event) => ({ ...source, event }),
  target: echoFilterFx,
})

// Forward filtered events to buffer
sample({
  clock: echoFilterFx.doneData,
  fn: ({ filtered }) => filtered,
  target: portUpdatesReceived,
})

// Confirm matched mutations - fire event for each confirmation
const confirmMutationsListFx = portsV2Domain.createEffect(
  (confirmations: Array<{ portKey: PortUpdateEvent['portKey'], mutationId: string }>) => {
    confirmations.forEach(({ portKey, mutationId }) => {
      confirmPendingMutation({ portKey, mutationId })
    })
  },
)

sample({
  clock: echoFilterFx.doneData,
  filter: ({ confirmedMutations }) => confirmedMutations.length > 0,
  fn: ({ confirmedMutations }) => confirmedMutations,
  target: confirmMutationsListFx,
})
