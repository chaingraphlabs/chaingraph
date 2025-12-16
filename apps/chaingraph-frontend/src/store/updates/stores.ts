/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import { combine, createEffect, createEvent, createStore, sample } from 'effector'
import { $draggingNodes } from '../nodes/stores'

// Constants
const PULSE_DURATION_MS = 200
const FADE_DURATION_MS = 100

// Types
interface NodeUpdateState {
  updateCount: number
  lastUpdateTime: number
}

type PulseState = 'pulse' | 'fade' | null

// Events
export const nodeUpdated = createEvent<string>()
export const pulseCompleted = createEvent<string>()
export const fadeCompleted = createEvent<string>()

// Store for tracking update state per node
export const $nodeUpdateStates = createStore<Map<string, NodeUpdateState>>(new Map())
  .on(nodeUpdated, (state, nodeId) => {
    const current = state.get(nodeId)
    const newState = new Map(state)
    newState.set(nodeId, {
      updateCount: (current?.updateCount ?? 0) + 1,
      lastUpdateTime: Date.now(),
    })
    return newState
  })
  .on(fadeCompleted, (state, nodeId) => {
    const newState = new Map(state)
    newState.delete(nodeId)
    return newState
  })

// Store for managing visual pulse states
export const $nodesPulseState = createStore<Map<string, PulseState>>(new Map())
  .on(nodeUpdated, (state, nodeId) => {
    const newState = new Map(state)
    newState.set(nodeId, 'pulse')
    return newState
  })
  .on(pulseCompleted, (state, nodeId) => {
    const newState = new Map(state)
    const currentState = newState.get(nodeId)
    if (currentState === 'pulse') {
      newState.set(nodeId, 'fade')
    }
    return newState
  })
  .on(fadeCompleted, (state, nodeId) => {
    const newState = new Map(state)
    newState.delete(nodeId)
    return newState
  })

// Effect for scheduling pulse completion
const schedulePulseCompletionFx = createEffect<string, void>((nodeId) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      pulseCompleted(nodeId)
      resolve()
    }, PULSE_DURATION_MS)
  })
})

// Effect for scheduling fade completion
const scheduleFadeCompletionFx = createEffect<string, void>((nodeId) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      fadeCompleted(nodeId)
      resolve()
    }, FADE_DURATION_MS)
  })
})

// Connect events to effects using sample
// Skip pulse animation if node is being dragged (performance optimization)
sample({
  source: $draggingNodes,
  clock: nodeUpdated,
  filter: (draggingNodes, nodeId) => {
    // Only pulse if node is NOT being dragged
    return !draggingNodes.includes(nodeId)
  },
  fn: (_, nodeId) => nodeId,
  target: schedulePulseCompletionFx,
})

sample({
  source: pulseCompleted,
  target: scheduleFadeCompletionFx,
})

// Helper store for component usage - returns set of flashing nodes
export const $flashingNodes = combine(
  $nodesPulseState,
  (pulseStates) => {
    const flashingSet = new Set<string>()
    pulseStates.forEach((state, nodeId) => {
      if (state) {
        flashingSet.add(nodeId)
      }
    })
    return flashingSet
  },
)
