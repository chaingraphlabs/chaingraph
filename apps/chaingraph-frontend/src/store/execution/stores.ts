/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { ExecutionEventData, ExecutionEventImpl } from '@badaitech/chaingraph-types'
import type {
  EdgeExecutionState,
  ExecutionState,
  ExecutionSubscriptionState,
  NodeExecutionState,
} from './types'
import { createExecutionFx, stopExecutionFx } from '@/store/execution/effects'
import { ExecutionEventEnum } from '@badaitech/chaingraph-types'
import { combine, createStore } from 'effector'
import {
  addBreakpoint,
  clearExecutionState,
  newExecutionEvent,
  removeBreakpoint,
  setExecutionError,
  setExecutionStatus,
  setExecutionSubscriptionError,
  setExecutionSubscriptionStatus,
  setHighlightedEdgeId,
  setHighlightedNodeId,
  toggleDebugMode,
} from './events'
import { ExecutionStatus, ExecutionSubscriptionStatus, isTerminalStatus } from './types'

const initialState: ExecutionState = {
  status: ExecutionStatus.IDLE,
  executionId: null,
  debugMode: false,
  breakpoints: new Set(),
  error: null,
  subscription: {
    status: ExecutionSubscriptionStatus.IDLE,
    error: null,
    isSubscribed: false,
  },
}

export const $executionEvents = createStore<ExecutionEventImpl[]>([])
  .on(newExecutionEvent, (state, event) => {
    return [...state, event]
  })
  .reset(clearExecutionState)
  .reset(stopExecutionFx.done)
  .reset(createExecutionFx.doneData)

export const $executionNodes = createStore<Record<string, NodeExecutionState>>({}, {
  updateFilter: (prev, next) => {
    // If either is null/undefined
    if (!prev || !next)
      return true

    // Check for different node IDs
    const prevIds = Object.keys(prev)
    const nextIds = Object.keys(next)

    // If number of nodes changed
    if (prevIds.length !== nextIds.length)
      return true

    // Check if any node has a different status
    for (const nodeId of prevIds) {
      // If node doesn't exist in next
      if (!next[nodeId])
        return true

      // If status changed
      if (prev[nodeId]?.status !== next[nodeId]?.status)
        return true
    }

    // No relevant changes detected
    return false
  },
})
  .on(newExecutionEvent, (state, event) => {
    let finalState = state
    let stateChanged = false

    switch (event.type) {
      case ExecutionEventEnum.NODE_STARTED:
        {
          const eventData = event.data as ExecutionEventData[ExecutionEventEnum.NODE_STARTED]
          finalState = {
            ...state,
            [eventData.node.id]: {
              status: 'running',
              startTime: event.timestamp,
              node: eventData.node,
            },
          }
          stateChanged = true
        }
        break

      case ExecutionEventEnum.NODE_COMPLETED:
      {
        const eventData = event.data as ExecutionEventData[ExecutionEventEnum.NODE_COMPLETED]

        const prevState = state[eventData.node.id]
        if (!prevState) {
          finalState = {
            ...state,
            [eventData.node.id]: {
              status: 'completed',
              startTime: event.timestamp,
              endTime: event.timestamp,
              executionTime: eventData.executionTime,
              node: eventData.node,
            },
          }
        } else {
          finalState = {
            ...state,
            [eventData.node.id]: {
              ...prevState,
              status: 'completed',
              endTime: event.timestamp,
              executionTime: eventData.executionTime,
              node: eventData.node,
            },
          }
        }
        stateChanged = true
        break
      }

      case ExecutionEventEnum.NODE_FAILED:
      {
        const eventData = event.data as ExecutionEventData[ExecutionEventEnum.NODE_FAILED]
        finalState = {
          ...state,
          [eventData.node.id]: {
            status: 'failed',
            endTime: event.timestamp,
            error: eventData.error,
            node: eventData.node,
          },
        }
        stateChanged = true
        break
      }

      case ExecutionEventEnum.NODE_SKIPPED:
      {
        const eventData = event.data as ExecutionEventData[ExecutionEventEnum.NODE_SKIPPED]
        finalState = {
          ...state,
          [eventData.node.id]: {
            status: 'skipped',
            endTime: event.timestamp,
            node: eventData.node,
          },
        }
        stateChanged = true
        break
      }
    }

    if (stateChanged) {
      return finalState
    }
    return state
  })
  .reset(clearExecutionState)
  .reset(createExecutionFx.doneData)
  // .reset(stopExecutionFx.done)

export const $executionEdges = createStore<Record<string, EdgeExecutionState>>({})
  .on(newExecutionEvent, (state, event) => {
    let finalState = state
    let stateChanged = false

    switch (event.type) {
      case ExecutionEventEnum.EDGE_TRANSFER_STARTED:
      {
        const eventData = event.data as ExecutionEventData[ExecutionEventEnum.EDGE_TRANSFER_STARTED]
        finalState = {
          ...state,
          [eventData.edge.id]: {
            status: 'transferring',
            edge: eventData.edge,
          },
        }
        stateChanged = true
        break
      }

      case ExecutionEventEnum.EDGE_TRANSFER_COMPLETED:
      {
        const eventData = event.data as ExecutionEventData[ExecutionEventEnum.EDGE_TRANSFER_COMPLETED]
        finalState = {
          ...state,
          [eventData.edge.id]: {
            status: 'completed',
            edge: eventData.edge,
          },
        }
        stateChanged = true
        break
      }

      case ExecutionEventEnum.EDGE_TRANSFER_FAILED:
      {
        const eventData = event.data as ExecutionEventData[ExecutionEventEnum.EDGE_TRANSFER_FAILED]
        finalState = {
          ...state,
          [eventData.edge.id]: {
            status: 'failed',
            edge: eventData.edge,
          },
        }
        stateChanged = true
        break
      }
    }

    if (stateChanged) {
      return finalState
    }
    return state
  })
  .reset(clearExecutionState)
  .reset(createExecutionFx.doneData)
  // .reset(stopExecutionFx.done)

export const $executionState = createStore<ExecutionState>(initialState)
// Handle execution status changes
  .on(createExecutionFx.pending, (state) => {
    if (state.status === ExecutionStatus.IDLE) {
      return {
        ...state,
        status: ExecutionStatus.CREATING,
      }
    }
    return state
  })
  .on(createExecutionFx.doneData, (state, executionId) => {
    return {
      ...state,
      executionId,
      status: ExecutionStatus.CREATED,
      error: null,
    }
  })
  .on(newExecutionEvent, (state, event) => {
    switch (event.type) {
      // case ExecutionEventEnum.FLOW_SUBSCRIBED:
      //   console.log('Flow subscribed:', event.data)
      //   return { ...state, status: ExecutionStatus.CREATED }

      case ExecutionEventEnum.FLOW_STARTED:
        console.log('Flow started:', event.data)
        return { ...state, status: ExecutionStatus.RUNNING }

      case ExecutionEventEnum.FLOW_COMPLETED:
        console.log('Flow completed:', event.data)
        return { ...state, status: ExecutionStatus.COMPLETED }

      case ExecutionEventEnum.FLOW_FAILED:
        console.log('Flow failed:', event.data)
        return {
          ...state,
          status: ExecutionStatus.ERROR,
          error: {
            message: (event.data as ExecutionEventData[ExecutionEventEnum.FLOW_FAILED]).error.message,
            timestamp: event.timestamp,
          },
        }

      case ExecutionEventEnum.FLOW_CANCELLED:
        console.log('Flow cancelled:', event.data)
        return {
          ...state,
          status: ExecutionStatus.STOPPED,
        }

      case ExecutionEventEnum.DEBUG_BREAKPOINT_HIT:
        return {
          ...state,
          status: ExecutionStatus.PAUSED,
        }
    }

    return state
  })

// .on(startExecutionFx.pending, state => ({
//   ...state,
//   status: ExecutionStatus.RUNNING,
// }))
// .on(pauseExecutionFx.done, state => ({
//   ...state,
//   status: ExecutionStatus.PAUSED,
// }))
//   .on(resumeExecutionFx.done, state => ({
//     ...state,
//     status: ExecutionStatus.RUNNING,
//   }))
  .on(stopExecutionFx.done, (state) => {
    return {
      ...state,
      status: ExecutionStatus.STOPPED,
      error: null,
    }
  })

  // Handle debug mode
  .on(toggleDebugMode, (state, debugMode) => ({
    ...state,
    debugMode,
  }))

  // Handle breakpoints
  .on(addBreakpoint, (state, { nodeId }) => ({
    ...state,
    breakpoints: new Set([...state.breakpoints, nodeId]),
  }))
  .on(removeBreakpoint, (state, { nodeId }) => {
    const newBreakpoints = new Set(state.breakpoints)
    newBreakpoints.delete(nodeId)
    return {
      ...state,
      breakpoints: newBreakpoints,
    }
  })

  // Handle errors
  .on(setExecutionError, (state, error) => ({
    ...state,
    error,
    status: error ? ExecutionStatus.ERROR : state.status,
  }))

  // Reset state
  .reset(clearExecutionState)

  // Handle subscription status
  .on(setExecutionSubscriptionStatus, (state, status) => ({
    ...state,
    subscription: {
      ...state.subscription,
      status,
    },
  }))

  // Handle subscription errors
  .on(setExecutionSubscriptionError, (state, error) => ({
    ...state,
    subscription: {
      ...state.subscription,
      error,
    },
  }))

  .on(setExecutionStatus, (state, status) => {
    if (isTerminalStatus(status)) {
      return {
        ...state,
        status,
        subscription: {
          ...state.subscription,
          status: ExecutionSubscriptionStatus.DISCONNECTED,
        },
      }
    }
    return {
      ...state,
      status,
    }
  })

export const $highlightedNodeId = createStore<string[] | null>(null)
  .on(setHighlightedNodeId, (state, highlightedNodeId) =>
    typeof highlightedNodeId === 'string'
      ? [highlightedNodeId]
      : highlightedNodeId)

export const $highlightedEdgeId = createStore<string[] | null>(null)
  .on(setHighlightedEdgeId, (state, highlightedEdgeId) =>
    typeof highlightedEdgeId === 'string'
      ? [highlightedEdgeId]
      : highlightedEdgeId)

// Computed stores
export const $isExecuting = $executionState.map(
  state => state.status === ExecutionStatus.RUNNING,
)

export const $isPaused = $executionState.map(
  state => state.status === ExecutionStatus.PAUSED,
)

export const $canStart = $executionState.map(
  state => state.status === ExecutionStatus.IDLE
    || state.status === ExecutionStatus.CREATED
    || state.status === ExecutionStatus.STOPPED
    || state.status === ExecutionStatus.COMPLETED,
)

export const $executionStatus = combine({
  status: $executionState.map(state => state.status),
  isExecuting: $isExecuting,
  isPaused: $isPaused,
  canStart: $canStart,
  error: $executionState.map(state => state.error),
  debugMode: $executionState.map(state => state.debugMode),
})

// Add computed stores for subscription state
export const $executionSubscriptionState = combine<ExecutionSubscriptionState>({
  status: $executionState.map(state => state.subscription.status),
  error: $executionState.map(state => state.subscription.error),
  isSubscribed: $executionState.map(
    state => state.subscription.status === ExecutionSubscriptionStatus.SUBSCRIBED,
  ),
})

// export const $nodeExecutionStates = createStore<Map<string, NodeExecutionState>>(new Map())
//   .reset(clearExecutionState)

// Auto start conditions
export const $autoStartConditions = combine({
  executionStatus: $executionState.map(state => state.status),
  subscriptionStatus: $executionSubscriptionState.map(state => state.status),
  executionId: $executionState.map(state => state.executionId),
  hasError: combine(
    $executionState.map(state => state.error),
    $executionSubscriptionState.map(state => state.error),
    (execError, subError) => Boolean(execError || subError),
  ),
})

// Store to prevent multiple start attempts
export const $startAttempted = createStore(false)

// export const $highlightedNodeId = $executionState.map(state => state.ui.highlightedNodeId)
// export const $highlightedEdgeId = $executionState.map(state => state.ui.highlightedEdgeId)
