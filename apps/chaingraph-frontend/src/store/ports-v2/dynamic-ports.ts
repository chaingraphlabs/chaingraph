/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { PortKey, PortUpdateEvent } from './types'
import type { PortUIState } from './types'
import { sample } from 'effector'
import {
  addFieldObjectPort,
  appendElementArrayPort,
  removeElementArrayPort,
} from '@/store/ports/stores'
import { portUpdateReceived } from './buffer'
import { $isGranularWriteEnabled } from './feature-flags'
import { $portValues, removePortsBatch } from './stores'
import { extractConfigCore, toPortKey } from './utils'

/**
 * Wire: When array element is added, populate granular stores
 *
 * ArrayPort children use the pattern: `${parentPortId}[${index}]`
 */
sample({
  clock: appendElementArrayPort,
  source: { enabled: $isGranularWriteEnabled, portValues: $portValues },
  filter: ({ enabled }) => enabled,
  fn: ({ portValues }, { nodeId, portId, value }): PortUpdateEvent => {
    // Get current array to compute the next index
    const parentKey = toPortKey(nodeId, portId)
    const currentArray = portValues.get(parentKey)
    const nextIndex = Array.isArray(currentArray) ? currentArray.length : 0

    const childPortId = `${portId}[${nextIndex}]`
    const childPortKey = toPortKey(nodeId, childPortId)

    return {
      portKey: childPortKey,
      nodeId,
      portId: childPortId,
      timestamp: Date.now(),
      source: 'local-optimistic',
      changes: {
        value,
      },
    }
  },
  target: portUpdateReceived,
})

/**
 * Wire: When object field is added, populate granular stores
 *
 * ObjectPort children use the pattern: `${parentPortId}.${fieldName}`
 */
sample({
  clock: addFieldObjectPort,
  source: $isGranularWriteEnabled,
  filter: enabled => enabled,
  fn: (_, { nodeId, portId, config, key }): PortUpdateEvent => {
    const childPortKey = toPortKey(nodeId, `${portId}.${key}`)

    return {
      portKey: childPortKey,
      nodeId,
      portId: `${portId}.${key}`,
      timestamp: Date.now(),
      source: 'local-optimistic',
      changes: {
        config: extractConfigCore(config),
        value: config.defaultValue,
        ui: (config.ui ?? {}) as PortUIState,
        connections: [],
      },
    }
  },
  target: portUpdateReceived,
})

/**
 * Wire: When array element is removed, clean up granular stores
 */
sample({
  clock: removeElementArrayPort,
  source: $isGranularWriteEnabled,
  filter: enabled => enabled,
  fn: (_, { nodeId, portId, index }): Set<PortKey> => {
    // Calculate child port key using bracket notation for arrays
    const childPortKey = toPortKey(nodeId, `${portId}[${index}]`)
    return new Set<PortKey>([childPortKey])
  },
  target: removePortsBatch,
})

/**
 * Update hierarchy tracking when ports with '.' or '[' in ID are created
 * This allows us to track parent-child relationships for nested ports
 *
 * Port ID formats:
 * - Object fields: 'parent.fieldName' or 'parent.nested.field'
 * - Array elements: 'parent[0]' or 'parent[0].field' or 'parent[0][1]'
 *
 * Examples:
 * - 'object.field' → parent: 'object'
 * - 'object.nested.field' → parent: 'object.nested'
 * - 'array[0]' → parent: 'array'
 * - 'array[0].field' → parent: 'array[0]'
 * - 'array[0][1]' → parent: 'array[0]'
 */
// $portHierarchy.on(portUpdateReceived, (state, event) => {
//   // Skip if not a child port (no '.' or '[' in portId)
//   if (!event.portId.includes('.') && !event.portId.includes('['))
//     return state

//   // Extract IMMEDIATE parent port ID (everything before LAST separator)
//   // Use lastIndexOf to find the last '.' or '[' - this gives us the immediate parent
//   const lastDotIndex = event.portId.lastIndexOf('.')
//   const lastBracketIndex = event.portId.lastIndexOf('[')

//   let separatorIndex: number
//   if (lastDotIndex === -1 && lastBracketIndex === -1)
//     return state // No separator found

//   if (lastDotIndex === -1)
//     separatorIndex = lastBracketIndex
//   else if (lastBracketIndex === -1)
//     separatorIndex = lastDotIndex
//   else
//     separatorIndex = Math.max(lastDotIndex, lastBracketIndex) // Use the LAST separator

//   const parentPortId = event.portId.slice(0, separatorIndex)

//   // Safety: parent ID should not be empty
//   if (!parentPortId)
//     return state

//   const parentKey = toPortKey(event.nodeId, parentPortId)
//   const childKey = event.portKey

//   // Avoid self-reference
//   if (parentKey === childKey)
//     return state

//   const newState = {
//     parents: new Map(state.parents),
//     children: new Map(state.children),
//   }

//   // Track parent → child relationship
//   newState.parents.set(childKey, parentKey)

//   // Track children set for parent
//   const siblings = newState.children.get(parentKey) || new Set()
//   siblings.add(childKey)
//   newState.children.set(parentKey, siblings)

//   return newState
// })
