/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { AnyPortConfig, EnumPortConfig, IPortConfig } from '@badaitech/chaingraph-types'
import type { PortConfigCore, PortConfigFull, PortKey, PortUIState } from './types'

// Re-export isDeepEqual for use in hooks
export { isDeepEqual } from '@badaitech/chaingraph-types'

/**
 * Create a PortKey from nodeId and portId
 * Format: `${nodeId}:${portId}`
 */
export function toPortKey(nodeId: string, portId: string): PortKey {
  return `${nodeId}:${portId}` as PortKey
}

/**
 * Extract nodeId and portId from a PortKey
 * NOTE: NodeIDs can contain colons (e.g., 'AntropicLLMCallNode:NOVcddXzgQ4wCHzpnG')
 * So we must use lastIndexOf(':') to find the separator between nodeId and portId
 */
export function fromPortKey(key: PortKey): { nodeId: string, portId: string } {
  const colonIndex = key.lastIndexOf(':')
  if (colonIndex === -1) {
    throw new Error(`Invalid PortKey format: ${key}`)
  }
  return {
    nodeId: key.slice(0, colonIndex),
    portId: key.slice(colonIndex + 1),
  }
}

/**
 * Check if a portId represents a nested/child port
 * Child ports use either DOT notation (object fields) or BRACKET notation (array elements)
 * Examples: 'parentPort.fieldName' (object) or 'parentPort[0]' (array)
 */
export function isChildPort(portId: string): boolean {
  return portId.includes('.') || portId.includes('[')
}

/**
 * Unwrap AnyPort config to its underlying type
 *
 * Transforms configs like:
 *   { type: 'any', underlyingType: { type: 'string', minLength: 5 }, ... }
 * Into:
 *   { type: 'string', minLength: 5, ..., originalType: 'any' }
 *
 * This allows components to see the actual type and render appropriately,
 * avoiding infinite loops where AnyPort → PortComponent → AnyPort.
 *
 * @param config - Port config that might be an 'any' type
 * @returns Unwrapped config with actual type, or original if not 'any'
 */
export function unwrapAnyPortConfig(config: PortConfigFull): PortConfigFull {
  // Not an any port - return as-is
  if (config.type !== 'any') {
    return config
  }

  const underlyingType = (config as any).underlyingType

  // No underlying type or it's empty - return as-is
  if (!underlyingType || !underlyingType.type) {
    return config
  }

  // Underlying type is also 'any' - return as-is to prevent infinite unwrapping
  if (underlyingType.type === 'any') {
    return config
  }

  // Unwrap: use underlying type's fields but preserve port identity
  return {
    ...underlyingType,           // Spread all underlying type fields (minLength, itemConfig, etc.)
    type: underlyingType.type,   // Use actual type instead of 'any'!
    // type: 'any',   // Use actual type instead of 'any'!
    // Preserve original port identity fields
    id: config.id,
    key: config.key,
    nodeId: config.nodeId,
    direction: config.direction,
    parentId: config.parentId,
    order: config.order,
    // Merge title/description (prefer original if set)
    title: config.title || underlyingType.title,
    description: config.description || underlyingType.description,
    // Merge required flag
    required: config.required !== undefined ? config.required : underlyingType.required,
    // Keep original underlyingType for reference (useful for debugging)
    originalType: 'any' as any,
  } as PortConfigFull
}

/**
 * Extract core configuration from an IPortConfig
 *
 * UPDATED: Now returns the FULL config instead of stripping type-specific properties.
 * This ensures all fields (itemConfig, schema, underlyingType, secretType, options)
 * are preserved for documentation tooltips and type-specific rendering.
 *
 * Also unwraps AnyPort configs to their underlying type, so components always see
 * the actual type (string, array, etc.) instead of 'any'.
 *
 * The UI and connections are stored separately in $portUI and $portConnections.
 * We only exclude 'ui' and 'connections' from the stored config to avoid duplication.
 *
 * @param config - Full IPortConfig from node
 * @returns PortConfigCore (which is now an alias for IPortConfig)
 */
export function extractConfigCore(config: IPortConfig): PortConfigFull {
  // Return full config, only excluding UI and connections which are stored separately
  const { ui, connections, ...configWithoutUIAndConnections } = config

  // Build core config with required fields ensured
  const coreConfig = {
    ...configWithoutUIAndConnections,
    // Ensure required fields have defaults
    id: config.id ?? '',
    key: config.key ?? '',
    nodeId: config.nodeId ?? '',
    type: config.type,
    direction: config.direction ?? 'input',
  } as PortConfigFull

  // Unwrap any ports to their underlying type
  // This ensures components see the actual type (e.g., 'string' instead of 'any')
  return unwrapAnyPortConfig(coreConfig)
}

/**
 * Merge two PortUIState objects (deep merge)
 * Used when accumulating UI updates in the buffer
 */
export function mergeUIStates(existing: PortUIState, incoming: Partial<PortUIState>): PortUIState {
  // Work with Record for dynamic property access
  const merged = { ...existing } as Record<string, unknown>
  const existingRecord = existing as Record<string, unknown>

  for (const [key, value] of Object.entries(incoming)) {
    if (value !== undefined) {
      // TODO: check for other nested objects that need deep merge! or recursion?
      // Deep merge for nested objects
      if (key === 'textareaDimensions' && typeof value === 'object' && typeof existingRecord.textareaDimensions === 'object') {
        merged.textareaDimensions = { ...existingRecord.textareaDimensions, ...value as object }
      } else if (key === 'markdownStyles' && typeof value === 'object' && typeof existingRecord.markdownStyles === 'object') {
        merged.markdownStyles = { ...existingRecord.markdownStyles, ...value as object }
      } else if (key === 'htmlStyles' && typeof value === 'object' && typeof existingRecord.htmlStyles === 'object') {
        merged.htmlStyles = { ...existingRecord.htmlStyles, ...value as object }
      } else {
        merged[key] = value
      }
    }
  }

  return merged as PortUIState
}

// ============================================================================
// PARENT CHAIN UTILITIES
// ============================================================================
// NOTE: These utilities are used to replicate server-side parent value propagation.
// This is REDUNDANT work - the server already computes and sends parent updates.
// However, we need this for optimistic updates to match server echoes correctly.
// When the server is optimized to send only leaf updates, this can be removed.
// ============================================================================

/**
 * Get the full parent chain from a port up to the root
 * Uses $portHierarchy for O(1) parent lookups per level
 *
 * @param portKey - The starting port key
 * @param hierarchy - The port hierarchy (parents map)
 * @returns Array of PortKeys from child to root (inclusive)
 *          e.g., ["node:object.a.nested", "node:object.a", "node:object"]
 */
export function getParentChain(
  portKey: PortKey,
  hierarchy: { parents: Map<PortKey, PortKey> },
): PortKey[] {
  const chain: PortKey[] = [portKey]
  let current = portKey

  // Max depth protection (prevents infinite loops on corrupted data)
  const MAX_DEPTH = 20

  for (let depth = 0; depth < MAX_DEPTH; depth++) {
    const parentKey = hierarchy.parents.get(current)
    if (!parentKey)
      break
    chain.push(parentKey)
    current = parentKey
  }

  return chain
}

/**
 * Compute the new parent value given a child update
 *
 * REDUNDANT: Server already does this computation and sends updated parent values.
 * We replicate it here for optimistic updates to have correct echo matching.
 *
 * @param parentKey - PortKey of the parent
 * @param childKey - PortKey of the child being updated
 * @param childValue - New value for the child
 * @param portValues - Current $portValues store
 * @param portConfigs - Current $portConfigs store
 * @returns The computed parent value with child update merged in
 */
export function computeParentValue(
  parentKey: PortKey,
  childKey: PortKey,
  childValue: unknown,
  portValues: Map<PortKey, unknown>,
  portConfigs: Map<PortKey, PortConfigCore>,
): unknown {
  const parentConfig = portConfigs.get(parentKey)
  const parentValue = portValues.get(parentKey)
  const childConfig = portConfigs.get(childKey)

  if (!parentConfig || !childConfig) {
    console.warn('[computeParentValue] Missing config for parent or child', {
      parentKey,
      childKey,
      hasParentConfig: !!parentConfig,
      hasChildConfig: !!childConfig,
    })
    return parentValue
  }

  // The child's `key` field contains the field name (for objects) or index (for arrays)
  const childKeyName = childConfig.key

  if (parentConfig.type === 'object') {
    // Object: shallow merge with child field
    const currentObj = (parentValue as Record<string, unknown>) ?? {}
    return {
      ...currentObj,
      [childKeyName!]: childValue,
    }
  }

  if (parentConfig.type === 'array') {
    // Array: replace element at index
    const currentArr = (parentValue as unknown[]) ?? []
    const index = Number.parseInt(childKeyName!, 10)

    if (Number.isNaN(index) || index < 0) {
      console.warn('[computeParentValue] Invalid array index', { childKeyName, childKey })
      return parentValue
    }

    const newArr = [...currentArr]
    // Extend array if index is beyond current length
    while (newArr.length <= index) {
      newArr.push(undefined)
    }
    newArr[index] = childValue
    return newArr
  }

  // For stream or other complex types, return parent value as-is
  // (stream ports don't aggregate child values the same way)
  return parentValue
}

// ============================================================================
// TYPE GUARDS - Replace unsafe `as any` casts with proper type checking
// ============================================================================

/**
 * Type guard: Check if config is a system port
 * Replaces: `(config as any).isSystem`
 */
export function isSystemPort(config: IPortConfig | PortConfigCore): config is IPortConfig & { isSystem: true } {
  return config.metadata?.isSystemPort === true
}

/**
 * Type guard: Check if config is a system error port
 * Replaces: `(config as any).isSystemError`
 */
export function isSystemErrorPort(config: IPortConfig | PortConfigCore): config is IPortConfig & { isSystemError: true } {
  return config.metadata?.portCategory === 'error'
}

/**
 * Type guard: Check if config has an underlying type (for AnyPort)
 * Replaces: `(config as any).underlyingType`
 */
export function hasUnderlyingType(config: IPortConfig | PortConfigCore): config is IPortConfig & { underlyingType: IPortConfig } {
  return config.type === 'any' && 'underlyingType' in config && typeof (config as AnyPortConfig).underlyingType === 'object'
}

/**
 * Type guard: Check if array port is mutable
 * Replaces: `(config as any).isMutable`
 */
export function isMutableArrayPort(config: IPortConfig | PortConfigCore): config is IPortConfig & { isMutable: boolean } {
  return config.type === 'array' && 'isMutable' in config
}

/**
 * Type guard: Check if object port has mutable schema
 * Replaces: `(config as any).isSchemaMutable`
 */
export function isMutableObjectPort(config: IPortConfig | PortConfigCore): config is IPortConfig & { isSchemaMutable: boolean } {
  return config.type === 'object' && 'isSchemaMutable' in config
}

/**
 * Type guard: Check if enum port has options
 * Replaces: `(config as any).options`
 */
export function hasEnumOptions(config: IPortConfig | PortConfigCore): config is IPortConfig & { options: Array<{ label: string, value: any }> } {
  // return 'options' in config && Array.isArray((config as any).options)
  return config.type === 'enum' && Array.isArray((config as EnumPortConfig).options)
}
