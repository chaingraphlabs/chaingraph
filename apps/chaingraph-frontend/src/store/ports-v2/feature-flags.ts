/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { MigrationMode } from './types'
import { portsV2Domain } from './domain'

/**
 * Migration mode store
 *
 * Controls the gradual rollout of granular port stores:
 * - 'disabled': Legacy system only (default, safe)
 * - 'dual-write': Write to both systems, read from legacy (validation phase)
 * - 'read-only': Write to both systems, read from granular (testing phase)
 * - 'full': Granular system only (final state)
 *
 * Can be changed at runtime via setMigrationMode event or localStorage.
 */
function getInitialMode(): MigrationMode {
  // Check env var first
  // const envMode = import.meta.env.VITE_GRANULAR_PORTS_MODE as MigrationMode | undefined
  // if (envMode && ['disabled', 'dual-write', 'read-only', 'full'].includes(envMode)) {
  //   return envMode
  // }

  // // Check localStorage for runtime override
  // if (typeof localStorage !== 'undefined') {
  //   const stored = localStorage.getItem('chaingraph:granular-ports-mode') as MigrationMode | null
  //   if (stored && ['disabled', 'dual-write', 'read-only', 'full'].includes(stored)) {
  //     return stored
  //   }
  // }

  // Default to full mode - granular stores only (ID-only architecture complete)
  return 'full'
}

export const $migrationMode = portsV2Domain.createStore<MigrationMode>(getInitialMode())

/**
 * Event to change migration mode
 * Usage: setMigrationMode('dual-write')
 */
export const setMigrationMode = portsV2Domain.createEvent<MigrationMode>()

$migrationMode.on(setMigrationMode, (_, mode) => {
  // Persist to localStorage for browser sessions
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem('chaingraph:granular-ports-mode', mode)
  }
  return mode
})

/**
 * Helper to check if granular ports are enabled for writing
 */
export const $isGranularWriteEnabled = $migrationMode.map(
  mode => mode !== 'disabled',
)

// DEBUG: Log initial mode
console.log('[ports-v2/feature-flags] Initial mode:', getInitialMode(), '- granular write enabled:', getInitialMode() !== 'disabled')
