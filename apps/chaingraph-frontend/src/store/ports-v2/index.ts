/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

/**
 * Granular Port Stores (ports-v2)
 *
 * This module provides granular port state management that replaces the nested
 * port storage in $nodes. Instead of storing ports inside nodes (which causes
 * cascade re-renders), ports are stored in separate normalized stores by concern.
 *
 * Benefits:
 * - Granular subscriptions: Components subscribe only to what they need
 * - Efficient echo detection: Compare small objects, not entire ports
 * - Hot path isolation: Value updates don't cascade to UI/config systems
 * - ~95% reduction in render cycles for typing operations
 *
 * Migration:
 * - Use $migrationMode to control gradual rollout
 * - 'disabled' → 'dual-write' → 'read-only' → 'full'
 *
 * @see /docs/architecture/granular-port-stores-design.md
 */

// Initialize wiring (registers all sample() calls)
import './init'

// Direct port updates (no buffer - synchronous processing)
export {
  portUpdateReceived,
  portUpdatesReceived,
} from './buffer'

// Domain
export { portsV2Domain } from './domain'

// Feature Flags
export {
  $isGranularWriteEnabled,
  $migrationMode,
  setMigrationMode,
} from './feature-flags'

// Hooks
export {
  useChildPorts,
  usePort,
  usePortConfig,
  usePortConnections,
  usePortType,
  usePortUI,
  usePortValue,
} from './hooks'

// Merge (for testing/advanced usage)
export { mergeConnections, mergePortEvents } from './merge'
// Pending Mutations (optimistic updates and echo matching)
export {
  $pendingPortMutations,
  addPendingMutation,
  confirmPendingMutation,
  generateMutationId,
  getClientId,
  rejectPendingMutation,
} from './pending-mutations'

export type { PendingMutation } from './pending-mutations'

// Port Lists (derived store for component iteration)
export { $nodePortLists } from './port-lists'
export type { NodePortLists } from './port-lists'

// Descendants (derived stores for collapsed port handles)
export { $portDescendants } from './descendants'
export { $collapsedHandleData } from './collapsed-handles'
export type { CollapsedHandleInfo } from './collapsed-handles'

// Stores
export {
  // Granular stores
  $nodePortKeys,
  $portConfigs,
  $portConnections,
  $portHierarchy,
  $portUI,
  $portValues,
  $portVersions,
  // Apply events (used by buffer)
  applyConfigUpdates,
  applyConnectionUpdates,
  applyUIUpdates,
  applyValueUpdates,
  applyVersionUpdates,
  // Cleanup
  removePortsBatch,
} from './stores'

// Types
export type {
  MergedPortUpdate,
  MigrationMode,
  PortConfigCore,
  PortConfigFull,
  PortKey,
  PortUIState,
  PortUpdateEvent,
  ProcessedBatch,
} from './types'

// Utils
export {
  computeParentValue,
  extractConfigCore,
  fromPortKey,
  getParentChain,
  hasEnumOptions,
  hasUnderlyingType,
  isChildPort,
  isDeepEqual,
  isMutableArrayPort,
  isMutableObjectPort,
  isSystemErrorPort,
  isSystemPort,
  mergeUIStates,
  toPortKey,
  unwrapAnyPortConfig,
} from './utils'
