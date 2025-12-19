/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { PortKey, PortUpdateEvent } from './types'
import { sample } from 'effector'
import {
  addFieldObjectPort,
  appendElementArrayPort,
  removeElementArrayPort,
} from '@/store/ports/stores'
import { portUpdateReceived } from './buffer'
import { $isGranularWriteEnabled } from './feature-flags'
import { $portHierarchy, removePortsBatch } from './stores'
import { extractConfigCore, toPortKey } from './utils'
import type { PortUIState } from './types'

/**
 * Wire: When array element is added, populate granular stores
 *
 * ArrayPort children use the pattern: `${parentPortId}.${index}`
 */
sample({
  clock: appendElementArrayPort,
  source: $isGranularWriteEnabled,
  filter: (enabled) => enabled,
  fn: (_, { nodeId, portId, value }): PortUpdateEvent => {
    // Note: The actual child port ID will be determined by the port implementation
    // For now, we create a placeholder event that will be updated by the node update
    const childPortKey = toPortKey(nodeId, `${portId}.new`)

    return {
      portKey: childPortKey,
      nodeId,
      portId: `${portId}.new`,
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
  filter: (enabled) => enabled,
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
  filter: (enabled) => enabled,
  fn: (_, { nodeId, portId, index }): Set<PortKey> => {
    // Calculate child port key
    const childPortKey = toPortKey(nodeId, `${portId}.${index}`)
    return new Set<PortKey>([childPortKey])
  },
  target: removePortsBatch,
})

/**
 * Update hierarchy tracking when ports with '.' or '[' in ID are created
 * This allows us to track parent-child relationships for nested ports
 * Examples: 'myPort.fieldName' (object) or 'myPort[0]' (array)
 */
$portHierarchy.on(portUpdateReceived, (state, event) => {
  // Skip if not a child port (no '.' or '[' in portId)
  if (!event.portId.includes('.') && !event.portId.includes('[')) return state

  // Extract parent port ID (everything before first '.' or '[')
  const dotIndex = event.portId.indexOf('.')
  const bracketIndex = event.portId.indexOf('[')

  let separatorIndex: number
  if (dotIndex === -1) separatorIndex = bracketIndex
  else if (bracketIndex === -1) separatorIndex = dotIndex
  else separatorIndex = Math.min(dotIndex, bracketIndex)

  const parentPortId = event.portId.slice(0, separatorIndex)
  const parentKey = toPortKey(event.nodeId, parentPortId)
  const childKey = event.portKey

  const newState = {
    parents: new Map(state.parents),
    children: new Map(state.children),
  }

  // Track parent → child relationship
  newState.parents.set(childKey, parentKey)

  // Track children set for parent
  const siblings = newState.children.get(parentKey) || new Set()
  siblings.add(childKey)
  newState.children.set(parentKey, siblings)

  return newState
})
