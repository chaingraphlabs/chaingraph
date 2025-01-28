import type { ExecutionState, ExecutionSubscriptionState } from './types'
import { createExecutionFx } from '@/store/execution/effects.ts'

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
  toggleDebugMode,
} from './events'
import { ExecutionStatus, ExecutionSubscriptionStatus, isTerminalStatus } from './types'

const initialState: ExecutionState = {
  status: ExecutionStatus.IDLE,
  executionId: null,
  debugMode: false,
  currentNodeId: null,
  breakpoints: new Set(),
  error: null,
  events: [],
  subscription: {
    status: ExecutionSubscriptionStatus.IDLE,
    error: null,
    isSubscribed: false,
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
// .on(resumeExecutionFx.done, state => ({
//   ...state,
//   status: ExecutionStatus.RUNNING,
// }))
// .on(stopExecutionFx.done, state => ({
//   ...state,
//   status: ExecutionStatus.STOPPED,
// }))

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
    return {
      ...state,
      events: [...state.events, event],
    }
  })

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
