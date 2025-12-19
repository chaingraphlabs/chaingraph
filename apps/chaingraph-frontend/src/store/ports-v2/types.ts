/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type {
  // UI types from core - derive our PortUIState from these
  ArrayPortConfigUIType,
  BasePortConfigUIType,
  BooleanPortConfigUIType,
  // Core types - re-export these to ensure type safety
  Connection,
  EnumPortConfigUIType,
  IPortConfig,
  NumberPortConfigUIType,
  ObjectPortConfigUIType,
  PortDirectionEnum,
  PortType,
  StreamPortConfigUIType,
  StringPortConfigUIType,
} from '@badaitech/chaingraph-types'

/**
 * Global unique identifier for ports
 * Format: `${nodeId}:${portId}`
 * `nodeId` format: `${nodeType}:${uniqueId}`
 *
 * For nested ports (ArrayPort/ObjectPort children):
 * - Parent: `node:123:myPort`
 * - Child: `node:123:myPort[0]` (array index) or `node:123:myPort.fieldName` (object field)
 */
export type PortKey = `${string}:${string}`

/**
 * Migration mode for gradual rollout
 * - 'disabled': Legacy system only (default)
 * - 'dual-write': Write to both systems, read from legacy
 * - 'read-only': Write to both systems, read from granular
 * - 'full': Granular system only
 */
export type MigrationMode = 'disabled' | 'dual-write' | 'read-only' | 'full'

// ============================================================================
// TYPE-SAFE UI STATE - DIRECTLY FROM CORE TYPES
// ============================================================================
// We directly reference the union of all UI config types.
// TypeScript will ensure compile-time safety - if core types change, this fails.
// ============================================================================

/**
 * Port UI state - UNION of all core UI types
 *
 * This is the actual union type from the core package, ensuring 100% compatibility.
 * When you access ui.isSlider, TypeScript knows it might be undefined (from union).
 * Components should cast to specific types when they know the port type.
 *
 * Pattern for components:
 * ```typescript
 * const numberUI = ui as { isSlider?: boolean, leftSliderLabel?: string, ... }
 * return <Slider hidden={numberUI.isSlider} />
 * ```
 *
 * @see BasePortConfigUIType - base UI (hidden, disabled, etc.)
 * @see StringPortConfigUIType - textarea, markdown, html preview
 * @see NumberPortConfigUIType - slider
 * @see ArrayPortConfigUIType - item form, deletable
 * @see ObjectPortConfigUIType - collapsed, schema capture
 */
export type PortUIState =
  | BasePortConfigUIType
  | StringPortConfigUIType
  | NumberPortConfigUIType
  | ArrayPortConfigUIType
  | ObjectPortConfigUIType
  | StreamPortConfigUIType
  | BooleanPortConfigUIType
  | EnumPortConfigUIType
  | Record<string, unknown>  // Allow empty object

// ============================================================================
// FULL PORT CONFIG - USE CORE TYPE DIRECTLY
// ============================================================================
// We store the FULL IPortConfig, not a stripped version.
// This ensures all type-specific fields (itemConfig, schema, etc.) are available.
// ============================================================================

/**
 * Full port configuration - directly from core types
 *
 * This is the actual IPortConfig from @badaitech/chaingraph-types.
 * We store this in $portConfigs to ensure all type-specific properties
 * are available for documentation, rendering, and type-specific UI.
 *
 * Includes:
 * - Base: id, key, nodeId, type, direction, required, title, description
 * - String: minLength, maxLength, pattern
 * - Number: min, max, step, integer
 * - Array: itemConfig, minLength, maxLength, isMutable
 * - Object: schema (with properties), isSchemaMutable
 * - Stream: itemConfig, isSchemaMutable
 * - Enum: options[]
 * - Any: underlyingType
 * - Secret: secretType
 */
export type PortConfigFull = IPortConfig

/**
 * Core port configuration subset (for backward compatibility)
 *
 * @deprecated Prefer PortConfigFull for new code.
 * This alias exists for gradual migration and backward compatibility.
 *
 * Note: The store now uses PortConfigFull internally, but this type
 * is kept for code that only needs basic properties.
 */
export type PortConfigCore = IPortConfig

/**
 * Port update event (from subscription or local change)
 * Used for buffering and batch processing
 */
export interface PortUpdateEvent {
  /** Unique identifier for this port */
  portKey: PortKey
  /** Node ID (extracted from portKey for convenience) */
  nodeId: string
  /** Port ID (extracted from portKey for convenience) */
  portId: string
  /** Event timestamp (for ordering and last-win resolution) */
  timestamp: number
  /** Event source (for echo detection) */
  source: 'subscription' | 'local-optimistic'
  /** Node version at time of update (for conflict resolution) */
  version?: number
  /** Client ID that originated this mutation (for multi-user/multi-tab detection) */
  clientId?: string
  /** Mutation ID for echo matching (only on local-optimistic events) */
  mutationId?: string
  /** What changed? */
  changes: {
    value?: unknown
    ui?: Partial<PortUIState>
    config?: Partial<PortConfigCore>
    connections?: Connection[]
  }
}

/**
 * Processed batch result from batch processor
 */
export interface ProcessedBatch {
  valueUpdates: Map<PortKey, unknown>
  uiUpdates: Map<PortKey, PortUIState>
  configUpdates: Map<PortKey, Partial<PortConfigCore>>
  connectionUpdates: Map<PortKey, Connection[]>
  versionUpdates: Map<PortKey, number>
  hierarchyUpdates: {
    parents: Map<PortKey, PortKey>
    children: Map<PortKey, Set<PortKey>>
  }
}

/**
 * Merged result from merging multiple port events
 */
export interface MergedPortUpdate {
  value?: unknown
  ui?: PortUIState
  config?: Partial<PortConfigCore>
  connections?: Connection[]
}
