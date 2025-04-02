/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { ExecutionEventData } from '@badaitech/chaingraph-types'
import type { ExecutionState, ExecutionSubscriptionState } from './types'
import { createExecutionFx, stopExecutionFx } from '@/store/execution/effects.ts'
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
  events: [],
  subscription: {
    status: ExecutionSubscriptionStatus.IDLE,
    error: null,
    isSubscribed: false,
  },
  nodeStates: new Map(),
  edgeStates: new Map(),
  ui: {
    highlightedNodeId: null,
    highlightedEdgeId: null,
  },
}

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
      events: [],
      nodeStates: new Map(),
      edgeStates: new Map(),
      error: null,
    }
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
      events: [],
      nodeStates: new Map(),
      edgeStates: new Map(),
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

  .on(newExecutionEvent, (state, event) => {
    const nodeStates = new Map(state.nodeStates)
    const edgeStates = new Map(state.edgeStates)

    switch (event.type) {
      case ExecutionEventEnum.NODE_STARTED:
        {
          const eventData = event.data as ExecutionEventData[ExecutionEventEnum.NODE_STARTED]
          nodeStates.set(eventData.node.id, {
            status: 'running',
            startTime: event.timestamp,
            node: eventData.node,
          })
        }
        break

      case ExecutionEventEnum.NODE_COMPLETED:
      {
        const eventData = event.data as ExecutionEventData[ExecutionEventEnum.NODE_COMPLETED]
        const prevState = nodeStates.get(eventData.node.id)
        nodeStates.set(eventData.node.id, {
          status: 'completed',
          startTime: prevState?.startTime,
          endTime: event.timestamp,
          executionTime: eventData.executionTime,
          node: eventData.node,
        })
        break
      }

      case ExecutionEventEnum.NODE_FAILED:
      {
        const eventData = event.data as ExecutionEventData[ExecutionEventEnum.NODE_FAILED]
        nodeStates.set(eventData.node.id, {
          status: 'failed',
          endTime: event.timestamp,
          error: eventData.error,
          node: eventData.node,
        })
        break
      }

      case ExecutionEventEnum.NODE_SKIPPED:
      {
        const eventData = event.data as ExecutionEventData[ExecutionEventEnum.NODE_SKIPPED]
        nodeStates.set(eventData.node.id, {
          status: 'skipped',
          endTime: event.timestamp,
          node: eventData.node,
        })
        break
      }

      case ExecutionEventEnum.EDGE_TRANSFER_STARTED:
      {
        const eventData = event.data as ExecutionEventData[ExecutionEventEnum.EDGE_TRANSFER_STARTED]
        edgeStates.set(eventData.edge.id, {
          status: 'transferring',
          edge: eventData.edge,
        })
        break
      }

      case ExecutionEventEnum.EDGE_TRANSFER_COMPLETED:
      {
        const eventData = event.data as ExecutionEventData[ExecutionEventEnum.EDGE_TRANSFER_COMPLETED]
        edgeStates.set(eventData.edge.id, {
          status: 'completed',
          edge: eventData.edge,
        })
        break
      }

      case ExecutionEventEnum.EDGE_TRANSFER_FAILED:
      {
        const eventData = event.data as ExecutionEventData[ExecutionEventEnum.EDGE_TRANSFER_FAILED]
        edgeStates.set(eventData.edge.id, {
          status: 'failed',
          edge: eventData.edge,
        })
        break
      }
    }

    return {
      ...state,
      nodeStates,
      edgeStates,
      events: [...state.events, event],
    }
  })

  // setHighlightedNodeId
  .on(setHighlightedNodeId, (state, highlightedNodeId) => ({
    ...state,
    ui: {
      ...state.ui,
      highlightedNodeId:
        typeof highlightedNodeId === 'string'
          ? [highlightedNodeId]
          : highlightedNodeId,
    },
  }))
  .on(setHighlightedEdgeId, (state, highlightedEdgeId) => ({
    ...state,
    ui: {
      ...state.ui,
      highlightedEdgeId:
        typeof highlightedEdgeId === 'string'
          ? [highlightedEdgeId]
          : highlightedEdgeId,
    },
  }))

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

export const $highlightedNodeId = $executionState.map(state => state.ui.highlightedNodeId)
export const $highlightedEdgeId = $executionState.map(state => state.ui.highlightedEdgeId)
