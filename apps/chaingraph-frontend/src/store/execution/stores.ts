/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type {
  ExecutionEventData,
  ExecutionEventImpl,
} from '@badaitech/chaingraph-types'
import type {
  CreateExecutionOptions,
  EdgeExecutionState,
  ExecutionError,
  ExecutionState,
  ExecutionSubscriptionState,
  NodeExecutionState,
} from './types'
import {
  ExecutionEventEnum,
  NodeStatus,
} from '@badaitech/chaingraph-types'
import { attach, combine, sample } from 'effector'
import { globalReset } from '../common'
import { executionDomain } from '../domains'
// import { $trpcClient } from '../trpc/store'
import { $trpcClientExecutor } from '../trpc/execution-client'
import { ExecutionStatus, ExecutionSubscriptionStatus, isTerminalStatus } from './types'

// EVENTS
// Control events
export const createExecution = executionDomain.createEvent<CreateExecutionOptions>()
export const startExecution = executionDomain.createEvent<string>() // executionId
export const pauseExecution = executionDomain.createEvent<string>() // executionId
export const resumeExecution = executionDomain.createEvent<string>() // executionId
export const stopExecution = executionDomain.createEvent<string>() // executionId

// Debug events
export const toggleDebugMode = executionDomain.createEvent<boolean>()
export const addBreakpoint = executionDomain.createEvent<{ nodeId: string }>()
export const removeBreakpoint = executionDomain.createEvent<{ nodeId: string }>()
export const stepExecution = executionDomain.createEvent<string>() // executionId

// State events
export const setExecutionError = executionDomain.createEvent<ExecutionError | null>()
export const clearExecutionState = executionDomain.createEvent()
export const setExecutionIdAndReset = executionDomain.createEvent<string | null>()

// Subscription events
export const setExecutionSubscriptionStatus = executionDomain.createEvent<ExecutionSubscriptionStatus>()
export const setExecutionSubscriptionError = executionDomain.createEvent<ExecutionError | null>()

export const setExecutionStatus = executionDomain.createEvent<ExecutionStatus>()
// export const newExecutionEvent = executionDomain.createEvent<ExecutionEventImpl>()
export const newExecutionEvents = executionDomain.createEvent<ExecutionEventImpl[]>()

export const resetAutoStart = executionDomain.createEvent()
export const markStartAttempted = executionDomain.createEvent()

export const setHighlightedNodeId = executionDomain.createEvent<string | string[] | null>()
export const setHighlightedEdgeId = executionDomain.createEvent<string | string[] | null>()

// STORES

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

export const $executionState = executionDomain.createStore<ExecutionState>(initialState)
  .reset(globalReset)
  .reset(clearExecutionState)
  .reset(createExecution)

export const addExternalIntegrationConfigEvent = executionDomain.createEvent<{ key: string, value: any }>()
export const removeExternalIntegrationConfigEvent = executionDomain.createEvent<{ key: string }>()
export const clearExternalIntegrationConfigEvent = executionDomain.createEvent()

export const $executionExternalIntegrationConfig = executionDomain.createStore<Map<string, any>>(new Map())
  .on(addExternalIntegrationConfigEvent, (state, { key, value }) => {
    const newState = new Map(state)
    newState.set(key, value)
    return newState
  })
  .on(removeExternalIntegrationConfigEvent, (state, { key }) => {
    const newState = new Map(state)
    newState.delete(key)
    return newState
  })
  .on(clearExternalIntegrationConfigEvent, () => new Map())

// Control effects
export const createExecutionFx = executionDomain.createEffect(async (payload: CreateExecutionOptions) => {
  const client = $trpcClientExecutor.getState()
  const state = $executionState.getState()
  const externalIntegrationsStoreMap = $executionExternalIntegrationConfig.getState()

  const { flowId, debug, archAIIntegration, walletIntegration, externalIntegrations: externalIntegrationsPayload } = payload
  const breakpoints = state.breakpoints

  if (!client) {
    throw new Error('TRPC client is not initialized')
  }

  // merge external integrations from payload with the store, check for map existence
  const externalIntegrations = {
    ...(externalIntegrationsPayload || {}),
  }
  if (externalIntegrationsStoreMap && externalIntegrationsStoreMap.size > 0) {
    externalIntegrationsStoreMap.forEach((value, key) => {
      externalIntegrations[key] = value
    })
  }

  // Build integration object - type will be inferred from TRPC schema
  const integration = {
    ...(archAIIntegration && {
      archai: {
        agentID: archAIIntegration.agentID,
        agentSession: archAIIntegration.agentSession,
        chatID: archAIIntegration.chatID,
        messageID: archAIIntegration.messageID,
      },
    }),
    ...(walletIntegration && {
      wallet: walletIntegration,
    }),
  }

  if (externalIntegrations) {
    Object.entries(externalIntegrations).forEach(([key, value]) => {
      integration[key] = value
    })
  }

  const response = await client.create.mutate({
    flowId,
    options: {
      debug,
      breakpoints: debug ? Array.from(breakpoints) : [],
      execution: {
        maxConcurrency: 10,
        nodeTimeoutMs: 300000,
        flowTimeoutMs: 900000,
      },
    },
    integration,
  })
  return response.executionId
})

export const startExecutionFx = attach({
  source: $trpcClientExecutor,
  effect: async (client, executionId: string) => {
    if (!client) {
      throw new Error('TRPC client is not initialized')
    }
    return client.start.mutate({ executionId })
  },
})

export const pauseExecutionFx = attach({
  source: $trpcClientExecutor,
  effect: async (client, executionId: string) => {
    if (!client) {
      throw new Error('TRPC client is not initialized')
    }
    return client.pause.mutate({ executionId })
  },
})

export const resumeExecutionFx = attach({
  source: $trpcClientExecutor,
  effect: async (client, executionId: string) => {
    if (!client) {
      throw new Error('TRPC client is not initialized')
    }
    return client.resume.mutate({ executionId })
  },
})

export const stopExecutionFx = attach({
  source: $trpcClientExecutor,
  effect: async (client, executionId: string) => {
    if (!client) {
      throw new Error('TRPC client is not initialized')
    }
    return client.stop.mutate({ executionId })
  },
})

// Debug effects - Currently disabled as debug endpoints are not available in the new tRPC API
// TODO: Re-enable when debug endpoints are added back
export const addBreakpointFx = executionDomain.createEffect(
  async (params: { executionId: string, nodeId: string }) => {
    console.warn('Debug breakpoints are not yet available in the new API')
    return { success: false }
  },
)

export const removeBreakpointFx = executionDomain.createEffect(
  async (params: { executionId: string, nodeId: string }) => {
    console.warn('Debug breakpoints are not yet available in the new API')
    return { success: false }
  },
)

export const stepExecutionFx = executionDomain.createEffect(
  async (executionId: string) => {
    console.warn('Debug stepping is not yet available in the new API')
    return { success: false }
  },
)

// effect for checking terminal status
export const checkTerminalStatusFx = executionDomain.createEffect((status: ExecutionStatus) => {
  return isTerminalStatus(status)
})

export const $executionEvents = executionDomain.createStore<ExecutionEventImpl[]>([])
  .on(newExecutionEvents, (state, events) => {
    return [...state, ...events]
  })
  .reset(clearExecutionState)
  .reset(stopExecutionFx.done)
  .reset(createExecutionFx.doneData)
  .reset(createExecution)
  .reset(globalReset)
  .reset(setExecutionIdAndReset)

export const $executionNodes = executionDomain
  .createStore<Record<string, NodeExecutionState>>({}, {
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
  .on(newExecutionEvents, (state, events) => {
    let finalState = state
    let stateChanged = false

    for (const event of events) {
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
          const nodeState = state[eventData.nodeId]
          if (!nodeState || !nodeState.node) {
          // skip if node state doesn't exist
            break
          }

          nodeState.node.setStatus(NodeStatus.Skipped, false)

          finalState = {
            ...state,
            [eventData.nodeId]: {
              status: 'skipped',
              endTime: event.timestamp,
              node: nodeState.node,
            },
          }
          stateChanged = true
          break
        }
      }
    }

    if (stateChanged) {
      return finalState
    }
    return state
  })
  .reset(clearExecutionState)
  .reset(stopExecutionFx.done)
  .reset(createExecutionFx.doneData)
  .reset(globalReset)
  .reset(setExecutionIdAndReset)

export const $executionEdges = executionDomain.createStore<Record<string, EdgeExecutionState>>({})
  .on(newExecutionEvents, (state, events) => {
    let finalState = state
    let stateChanged = false

    for (const event of events) {
      switch (event.type) {
        case ExecutionEventEnum.EDGE_TRANSFER_STARTED:
        {
          const eventData = event.data as ExecutionEventData[ExecutionEventEnum.EDGE_TRANSFER_STARTED]
          finalState = {
            ...state,
            [eventData.serializedEdge.id]: {
              status: 'transferring',
              serializedEdge: eventData.serializedEdge,
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
            [eventData.serializedEdge.id]: {
              status: 'completed',
              serializedEdge: eventData.serializedEdge,
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
            [eventData.serializedEdge.id]: {
              status: 'failed',
              serializedEdge: eventData.serializedEdge,
            },
          }
          stateChanged = true
          break
        }
      }
    }

    if (stateChanged) {
      return finalState
    }
    return state
  })
  .reset(clearExecutionState)
  .reset(stopExecutionFx.done)
  .reset(createExecutionFx.doneData)
  .reset(setExecutionIdAndReset)
  .reset(globalReset)

// Handle execution status changes
$executionState
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
  // setExecutionIdAndReset
  .on(setExecutionIdAndReset, (state, executionId) => {
    return {
      ...state,
      executionId,
      status: ExecutionStatus.CREATED,
      error: null,
    }
  })
  .on(newExecutionEvents, (state, events) => {
    for (const event of events) {
      switch (event.type) {
      // case ExecutionEventEnum.FLOW_SUBSCRIBED:
      //   console.log('Flow subscribed:', event.data)
      //   return { ...state, status: ExecutionStatus.CREATED }

        case ExecutionEventEnum.FLOW_STARTED:
          console.debug('Flow started:', event.data)
          return { ...state, status: ExecutionStatus.RUNNING }

        case ExecutionEventEnum.FLOW_COMPLETED:
          console.debug('Flow completed:', event.data)
          return { ...state, status: ExecutionStatus.COMPLETED }

        case ExecutionEventEnum.FLOW_FAILED:
          console.debug('Flow failed:', event.data)
          return {
            ...state,
            status: ExecutionStatus.ERROR,
            error: {
              message: (event.data as ExecutionEventData[ExecutionEventEnum.FLOW_FAILED]).error.message,
              timestamp: event.timestamp,
            },
          }

        case ExecutionEventEnum.FLOW_CANCELLED:
          console.debug('Flow cancelled:', event.data)
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
  .on(clearExecutionState, state => ({
    ...initialState,
    debugMode: state.debugMode,
    breakpoints: state.breakpoints,
  }))

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

export const $highlightedNodeId = executionDomain.createStore<string[] | null>(null)
  .on(setHighlightedNodeId, (state, highlightedNodeId) =>
    typeof highlightedNodeId === 'string'
      ? [highlightedNodeId]
      : highlightedNodeId)
  .reset(globalReset)
  .reset(setExecutionIdAndReset)

export const $highlightedEdgeId = executionDomain.createStore<string[] | null>(null)
  .on(setHighlightedEdgeId, (state, highlightedEdgeId) =>
    typeof highlightedEdgeId === 'string'
      ? [highlightedEdgeId]
      : highlightedEdgeId)
  .reset(globalReset)
  .reset(setExecutionIdAndReset)

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

export const $executionId = $executionState.map(state => state.executionId)

// Store to prevent multiple start attempts
export const $startAttempted = executionDomain.createStore(false).reset(globalReset).reset(setExecutionIdAndReset)

// export const $highlightedNodeId = $executionState.map(state => state.ui.highlightedNodeId)
// export const $highlightedEdgeId = $executionState.map(state => state.ui.highlightedEdgeId)

// Handle execution creation
sample({
  clock: createExecution,
  target: createExecutionFx,
})

// Handle execution control
sample({
  clock: startExecution,
  target: startExecutionFx,
})

sample({
  clock: pauseExecution,
  target: pauseExecutionFx,
})

sample({
  clock: resumeExecution,
  target: resumeExecutionFx,
})

sample({
  clock: stopExecution,
  target: stopExecutionFx,
})

// Handle debug operations
// sample({
//   clock: addBreakpoint,
//   target: addBreakpointFx,
// })
//
// sample({
//   clock: removeBreakpoint,
//   target: removeBreakpointFx,
// })

$executionState
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

sample({
  clock: stepExecution,
  target: stepExecutionFx,
})

// Handle errors
sample({
  clock: [
    createExecutionFx.failData,
    startExecutionFx.failData,
    pauseExecutionFx.failData,
    resumeExecutionFx.failData,
    stopExecutionFx.failData,
    addBreakpointFx.failData,
    removeBreakpointFx.failData,
    stepExecutionFx.failData,
  ],
  fn: error => ({
    message: error.message,
    timestamp: new Date(),
  }),
  target: setExecutionError,
})

// Handle terminal status
// sample({
//   clock: [
//     // Update status events from execution
//     $executionState.updates.map(state => state.status),
//   ],
//   filter: (status): status is ExecutionStatus =>
//     status !== undefined && isTerminalStatus(status),
//   target: clearExecutionState,
// })

// Add cleanup on subscription end
// sample({
//   clock: setExecutionSubscriptionStatus,
//   filter: status => status === ExecutionSubscriptionStatus.DISCONNECTED,
//   target: clearExecutionState,
// })

// Handle start attempt tracking
$startAttempted
  .on(markStartAttempted, () => true)
  .reset([
    resetAutoStart,
    createExecution,
    // Reset on terminal states
    sample({
      clock: $executionState,
      filter: state => isTerminalStatus(state.status),
    }),
  ])

// Auto-start logic
sample({
  clock: $autoStartConditions,
  source: $startAttempted,
  filter: (attempted, conditions) => {
    return (
      !attempted
      && conditions.executionStatus === ExecutionStatus.CREATED
      && conditions.subscriptionStatus === ExecutionSubscriptionStatus.SUBSCRIBED
      && !conditions.hasError
      && !!conditions.executionId
    )
  },
  fn: (_, conditions) => conditions.executionId!,
  target: [
    startExecution,
    markStartAttempted,
  ],
})

// Reset auto-start when needed
sample({
  clock: [
    createExecution,
    clearExecutionState,
    // Add reset when subscription disconnects
    sample({
      clock: setExecutionSubscriptionStatus,
      filter: status => status === ExecutionSubscriptionStatus.DISCONNECTED,
    }),
  ],
  target: resetAutoStart,
})
