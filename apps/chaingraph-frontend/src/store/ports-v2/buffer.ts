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

import type { ArrayPortConfig, IObjectSchema, IPortConfig, ObjectPortConfig } from '@badaitech/chaingraph-types'
import type { PortKey, PortUIState, PortUpdateEvent, ProcessedBatch } from './types'
import { sample } from 'effector'
import { spread } from 'patronum'
import { trace } from '@/lib/perf-trace'
import { portsV2Domain } from './domain'
import { mergePortEvents } from './merge'
import {
  $nodePortKeys,
  applyConfigUpdates,
  applyConnectionUpdates,
  applyHierarchyUpdates,
  applyUIUpdates,
  applyValueUpdates,
  applyVersionUpdates,
  removePortsBatch,
} from './stores'
import { extractConfigCore, fromPortKey, toPortKey } from './utils'

// ============================================================================
// ARRAY ELEMENT CLEANUP HELPERS
// ============================================================================

/**
 * Helper to escape special regex characters in port ID
 */
function escapeRegExp(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/**
 * Find ALL array element ports to remove when array is updated
 *
 * When array elements change (add/delete/reindex), we must:
 * 1. Remove ALL existing element ports (they may have wrong data after reindexing)
 * 2. Let expandSchemaChildren recreate them from the array's updated value
 *
 * This handles reindexing correctly - old array[0] data is cleared,
 * new array[0] is created from the array's updated value.
 *
 * @param event - The array port update event
 * @param nodePortKeys - All current port keys for this node
 * @returns Set of port keys to remove (ALL element ports for this array)
 */
function findStaleArrayElementPorts(
  event: PortUpdateEvent,
  nodePortKeys: Set<PortKey> | undefined,
): Set<PortKey> {
  const staleKeys = new Set<PortKey>()
  const config = event.changes.config

  // Only process array port updates
  if (!config || config.type !== 'array' || !nodePortKeys) {
    return staleKeys
  }

  const { portId } = event

  // Pattern matches: portId[N] and portId[N].anything
  // e.g., for portId="array": matches "array[0]", "array[1].asd", "array[2].main.beach"
  // Remove ALL element ports - they will be recreated by expandSchemaChildren
  const arrayElementPattern = new RegExp(`^${escapeRegExp(portId)}\\[(\\d+)\\]`)

  for (const portKey of nodePortKeys) {
    const { portId: keyPortId } = fromPortKey(portKey)

    const match = keyPortId.match(arrayElementPattern)
    if (match) {
      // Remove ALL element ports, not just indices >= newLength
      // This ensures reindexed elements get correct data
      staleKeys.add(portKey)
    }
  }

  return staleKeys
}

// ============================================================================
// SCHEMA EXPANSION HELPERS
// ============================================================================

/**
 * Recursively extract child ports from schema.properties
 * Used by both object port expansion and array element expansion
 *
 * @param events - Array to push created events into
 * @param nodeId - Node ID
 * @param parentId - Parent port ID
 * @param schemaProps - Schema properties to expand
 * @param valueContext - Value context for extracting child values
 * @param timestamp - Event timestamp
 * @param source - Event source
 * @param version - Optional version
 */
function extractChildrenFromSchema(
  events: PortUpdateEvent[],
  nodeId: string,
  parentId: string,
  schemaProps: IObjectSchema['properties'],
  valueContext: Record<string, unknown> | undefined,
  timestamp: number,
  source: 'subscription' | 'local-optimistic',
  version?: number,
): void {
  if (!schemaProps)
    return

  for (const [key, childConfigRaw] of Object.entries(schemaProps)) {
    const childConfig = childConfigRaw as IPortConfig
    const childPortId = `${parentId}.${key}`
    const childPortKey = toPortKey(nodeId, childPortId)
    const childValue = valueContext?.[key]

    const childEvent: PortUpdateEvent = {
      portKey: childPortKey,
      nodeId,
      portId: childPortId,
      timestamp,
      source,
      version,
      changes: {
        value: childValue,
        config: {
          ...extractConfigCore(childConfig),
          id: childPortId,
          nodeId,
          parentId,
        },
        ui: (childConfig.ui ?? {}) as PortUIState,
        connections: childConfig.connections || [],
      },
    }
    events.push(childEvent)

    // Recursively handle nested objects
    if (childConfig.type === 'object') {
      const nestedObjectConfig = childConfig as ObjectPortConfig
      const nestedSchema = nestedObjectConfig.schema as IObjectSchema | undefined
      if (nestedSchema?.properties) {
        extractChildrenFromSchema(
          events,
          nodeId,
          childPortId,
          nestedSchema.properties,
          childValue as Record<string, unknown> | undefined,
          timestamp,
          source,
          version,
        )
      }
    }

    // Handle nested arrays within object properties
    if (childConfig.type === 'array') {
      const nestedArrayConfig = childConfig as ArrayPortConfig
      const nestedItemConfig = nestedArrayConfig.itemConfig as IPortConfig | undefined
      const nestedArrayValue = childValue as unknown[] | undefined

      if (nestedArrayValue && nestedItemConfig) {
        expandArrayElements(
          events,
          nodeId,
          childPortId,
          nestedItemConfig,
          nestedArrayValue,
          timestamp,
          source,
          version,
        )
      }
    }
  }
}

/**
 * Expand array elements into individual port events
 *
 * @param events - Array to push created events into
 * @param nodeId - Node ID
 * @param arrayPortId - Array port ID (e.g., "array")
 * @param itemConfig - Item configuration from array port
 * @param arrayValue - Array value
 * @param timestamp - Event timestamp
 * @param source - Event source
 * @param version - Optional version
 */
function expandArrayElements(
  events: PortUpdateEvent[],
  nodeId: string,
  arrayPortId: string,
  itemConfig: IPortConfig,
  arrayValue: unknown[],
  timestamp: number,
  source: 'subscription' | 'local-optimistic',
  version?: number,
): void {
  for (let i = 0; i < arrayValue.length; i++) {
    const elementPortId = `${arrayPortId}[${i}]`
    const elementPortKey = toPortKey(nodeId, elementPortId)
    const elementValue = arrayValue[i]

    // Create element port event
    const elementEvent: PortUpdateEvent = {
      portKey: elementPortKey,
      nodeId,
      portId: elementPortId,
      timestamp,
      source,
      version,
      changes: {
        value: elementValue,
        config: {
          ...extractConfigCore(itemConfig),
          id: elementPortId,
          nodeId,
          key: String(i),
          parentId: arrayPortId,
        },
        ui: (itemConfig.ui ?? {}) as PortUIState,
        connections: itemConfig.connections || [],
      },
    }
    events.push(elementEvent)

    // If element is object type, expand its children from schema
    if (itemConfig.type === 'object') {
      const objectItemConfig = itemConfig as ObjectPortConfig
      const itemSchema = objectItemConfig.schema as IObjectSchema | undefined
      if (itemSchema?.properties) {
        extractChildrenFromSchema(
          events,
          nodeId,
          elementPortId,
          itemSchema.properties,
          elementValue as Record<string, unknown> | undefined,
          timestamp,
          source,
          version,
        )
      }
    }

    // If element is array type (nested array), expand recursively
    if (itemConfig.type === 'array') {
      const nestedArrayConfig = itemConfig as ArrayPortConfig
      const nestedItemConfig = nestedArrayConfig.itemConfig as IPortConfig | undefined
      const nestedArrayValue = elementValue as unknown[] | undefined

      if (nestedArrayValue && nestedItemConfig) {
        expandArrayElements(
          events,
          nodeId,
          elementPortId,
          nestedItemConfig,
          nestedArrayValue,
          timestamp,
          source,
          version,
        )
      }
    }
  }
}

/**
 * Expand a port update event into synthetic child port events
 *
 * When a subscription sends a port update for an object/array type with embedded
 * schema.properties or itemConfig, we need to create individual port entries for each child.
 *
 * This is necessary because:
 * - During initialization, child ports come from node.ports Map (flattened)
 * - During subscription, children are embedded in schema.properties but NOT sent as separate events
 * - Array element reindexing: old elements are removed, new ones must be recreated from value
 *
 * @param event - The original port update event
 * @returns Array of port update events (original + expanded children)
 */
function expandSchemaChildren(event: PortUpdateEvent): PortUpdateEvent[] {
  const events: PortUpdateEvent[] = [event]
  const config = event.changes.config

  if (!config) {
    return events
  }

  const { nodeId } = event
  const parentPortId = event.portId

  // Handle OBJECT ports - expand schema.properties
  if (config.type === 'object') {
    const objectConfig = config as ObjectPortConfig
    const schema = objectConfig.schema as IObjectSchema | undefined
    if (schema?.properties) {
      const parentValue = event.changes.value as Record<string, unknown> | undefined
      extractChildrenFromSchema(
        events,
        nodeId,
        parentPortId,
        schema.properties,
        parentValue,
        event.timestamp,
        event.source,
        event.version,
      )
    }
  }

  // Handle ARRAY ports - expand elements from value + itemConfig
  if (config.type === 'array') {
    const arrayConfig = config as ArrayPortConfig
    const itemConfig = arrayConfig.itemConfig as IPortConfig | undefined
    const arrayValue = event.changes.value as unknown[] | undefined

    if (arrayValue && itemConfig) {
      expandArrayElements(
        events,
        nodeId,
        parentPortId,
        itemConfig,
        arrayValue,
        event.timestamp,
        event.source,
        event.version,
      )
    }
  }

  return events
}

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
 *
 * @param events - Port update events to process
 * @param nodePortKeysMap - Current port keys by node ID (for detecting stale array elements)
 */
function processPortUpdates(
  events: PortUpdateEvent[],
  nodePortKeysMap: Map<string, Set<PortKey>>,
): ProcessedBatch {
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
      stalePortKeys: new Set(),
    }
  }

  // STEP 0: Find stale array element ports (from array shrink/reindex)
  const stalePortKeys = new Set<PortKey>()
  for (const event of events) {
    const nodePortKeys = nodePortKeysMap.get(event.nodeId)
    const stale = findStaleArrayElementPorts(event, nodePortKeys)
    stale.forEach(k => stalePortKeys.add(k))
  }

  // STEP 1: Expand object ports with schema.properties into child port events
  // This handles the case where subscription sends only parent port, but children are embedded in schema
  const expandedEvents = events.flatMap(expandSchemaChildren)

  // Group updates by portKey
  const byPort = new Map<string, PortUpdateEvent[]>()
  for (const event of expandedEvents) {
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

  // CRITICAL: Filter out stale ports that will be re-created by expansion
  // Without this, we'd remove the newly created ports!
  // Example: array[0] is marked stale (old data) but also created (new data)
  // We should NOT remove it since it's being updated with correct data
  const finalStalePortKeys = new Set<PortKey>()
  for (const staleKey of stalePortKeys) {
    if (!configUpdates.has(staleKey)) {
      finalStalePortKeys.add(staleKey)
    }
  }

  return {
    valueUpdates,
    uiUpdates,
    configUpdates,
    connectionUpdates,
    versionUpdates,
    hierarchyUpdates,
    stalePortKeys: finalStalePortKeys,
  }
}

// ============================================================================
// WIRING: Direct Application (Synchronous) using patronum spread
// ============================================================================

/**
 * Batch updates → Process → Spread to all stores (SYNC)
 * Uses patronum's spread() for clean object-to-targets mapping
 *
 * Also handles stale array element cleanup:
 * When an array shrinks (element deleted), old indices (>= new length)
 * become stale and need to be removed from granular stores.
 */
sample({
  clock: portUpdatesReceived,
  source: $nodePortKeys,
  filter: (_, events) => events.length > 0,
  fn: (nodePortKeysMap, events) => {
    const spanId = trace.start('ports.process.batch', {
      category: 'io',
      tags: { eventCount: events.length },
    })
    const result = processPortUpdates(events, nodePortKeysMap)
    trace.end(spanId)
    return result
  },
  target: spread({
    valueUpdates: applyValueUpdates,
    uiUpdates: applyUIUpdates,
    configUpdates: applyConfigUpdates,
    connectionUpdates: applyConnectionUpdates,
    versionUpdates: applyVersionUpdates,
    hierarchyUpdates: applyHierarchyUpdates,
    stalePortKeys: removePortsBatch,
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
