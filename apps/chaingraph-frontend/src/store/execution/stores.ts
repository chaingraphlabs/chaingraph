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
import { ExecutionStatus } from '@badaitech/chaingraph-executor/types'
import {
  ExecutionEventEnum,
  NodeStatus,
} from '@badaitech/chaingraph-types'
import { attach, combine, sample } from 'effector'
import { globalReset } from '../common'
import { executionDomain } from '../domains'
import { $nodes } from '../nodes/stores'
// import { $trpcClient } from '../trpc/store'
import { $trpcClientExecutor } from '../trpc/execution-client'
import { ExecutionSubscriptionStatus, isTerminalStatus } from './types'

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
export const newExecutionEvents = executionDomain.createEvent<ExecutionEventImpl[]>()

export const resetAutoStart = executionDomain.createEvent()
export const markStartAttempted = executionDomain.createEvent()

export const setHighlightedNodeId = executionDomain.createEvent<string | string[] | null>()
export const setHighlightedEdgeId = executionDomain.createEvent<string | string[] | null>()

// Events for tracking newly created executions (to distinguish from selected existing ones)
export const setNewlyCreatedExecutionId = executionDomain.createEvent<string | null>()
export const clearNewlyCreatedExecutionId = executionDomain.createEvent()

// STORES

const initialState: ExecutionState = {
  status: ExecutionStatus.Idle,
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
  .createStore<Record<string, NodeExecutionState>>({}, {})
  .on(newExecutionEvents, (state, events) => {
    let finalState = state
    let stateChanged = false

    for (const event of events) {
      switch (event.type) {
        case ExecutionEventEnum.NODE_STARTED:
          {
            const eventData = event.data as ExecutionEventData[ExecutionEventEnum.NODE_STARTED]
            finalState = {
              ...finalState,
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

          const prevState = finalState[eventData.node.id]
          if (!prevState) {
            finalState = {
              ...finalState,
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
              ...finalState,
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
            ...finalState,
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

          // Get the node from the nodes store if it exists
          const nodesStore = $nodes.getState()
          const prevState = finalState[eventData.nodeId]

          let node = nodesStore[eventData.nodeId]
          if (!node) {
            if (prevState && prevState.node) {
              node = prevState.node
            } else {
              // create mock node
              // node = NodeRegistry.getInstance().createNode()
            }
          }

          const newNode = node.clone()
          newNode.setStatus(NodeStatus.Skipped, false)

          //

          finalState = {
            ...finalState,
            [eventData.nodeId]: {
              status: 'skipped',
              startTime: prevState?.startTime || event.timestamp,
              endTime: event.timestamp,
              node: node || prevState?.node, // Use node from store or preserve existing
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
    return finalState
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
            ...finalState,
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
            ...finalState,
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
            ...finalState,
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
    if (state.status === ExecutionStatus.Idle) {
      return {
        ...state,
        status: ExecutionStatus.Creating,
      }
    }
    return state
  })
  .on(createExecutionFx.doneData, (state, executionId) => {
    return {
      ...state,
      executionId,
      status: ExecutionStatus.Created,
      error: null,
    }
  })
  // setExecutionIdAndReset
  .on(setExecutionIdAndReset, (state, executionId) => {
    return {
      ...state,
      executionId,
      status: ExecutionStatus.Created,
      error: null,
    }
  })
  .on(newExecutionEvents, (state, events) => {
    let newState = state

    // Process ALL events in the batch, not just the first one
    for (const event of events) {
      switch (event.type) {
      // case ExecutionEventEnum.FLOW_SUBSCRIBED:
      //   console.log('Flow subscribed:', event.data)
      //   newState = { ...newState, status: ExecutionStatus.CREATED }
      //   break

        case ExecutionEventEnum.FLOW_STARTED:
          console.debug('Flow started:', event.data)
          newState = { ...newState, status: ExecutionStatus.Running }
          break

        case ExecutionEventEnum.FLOW_COMPLETED:
          console.debug('Flow completed:', event.data)
          newState = { ...newState, status: ExecutionStatus.Completed }
          break

        case ExecutionEventEnum.FLOW_FAILED:
          console.debug('Flow failed:', event.data)
          newState = {
            ...newState,
            status: ExecutionStatus.Failed,
            error: {
              message: (event.data as ExecutionEventData[ExecutionEventEnum.FLOW_FAILED]).error.message,
              timestamp: event.timestamp,
            },
          }
          break

        case ExecutionEventEnum.FLOW_CANCELLED:
          console.debug('Flow cancelled:', event.data)
          newState = {
            ...newState,
            status: ExecutionStatus.Stopped,
          }
          break

        case ExecutionEventEnum.DEBUG_BREAKPOINT_HIT:
          newState = {
            ...newState,
            status: ExecutionStatus.Paused,
          }
          break
      }
    }
    return newState
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
      status: ExecutionStatus.Stopped,
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
    status: error ? ExecutionStatus.Failed : state.status,
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
  state => state.status === ExecutionStatus.Running,
)

export const $isPaused = $executionState.map(
  state => state.status === ExecutionStatus.Paused,
)

export const $canStart = $executionState.map(
  state => !state.status
    || state.status === ExecutionStatus.Idle
    || state.status === ExecutionStatus.Created
    || state.status === ExecutionStatus.Stopped
    || state.status === ExecutionStatus.Completed,
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
export const $startAttempted = executionDomain.createStore(false)
  .reset(globalReset)
  .reset(setExecutionIdAndReset)

// Store for tracking newly created executions (to distinguish from selected existing ones)
export const $newlyCreatedExecutionId = executionDomain.createStore<string | null>(null)
  .on(setNewlyCreatedExecutionId, (_, id) => id)
  .reset(clearNewlyCreatedExecutionId)
  .reset(globalReset)
  .reset(clearExecutionState)
  .reset(setExecutionIdAndReset)

// export const $highlightedNodeId = $executionState.map(state => state.ui.highlightedNodeId)
// export const $highlightedEdgeId = $executionState.map(state => state.ui.highlightedEdgeId)

// Handle execution creation
sample({
  clock: createExecution,
  target: createExecutionFx,
})

// Set newly created execution ID when execution is created
sample({
  clock: createExecutionFx.doneData,
  target: setNewlyCreatedExecutionId,
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

// Auto-start logic - only for newly created executions (not selected existing ones)
sample({
  clock: $autoStartConditions,
  source: combine($startAttempted, $newlyCreatedExecutionId),
  filter: ([attempted, newlyCreatedId], conditions) => {
    return (
      !attempted
      && conditions.executionStatus === ExecutionStatus.Created
      && conditions.subscriptionStatus === ExecutionSubscriptionStatus.SUBSCRIBED
      && !conditions.hasError
      && !!conditions.executionId
      && conditions.executionId === newlyCreatedId // Only auto-start if this is the newly created execution
    )
  },
  fn: (_, conditions) => conditions.executionId!,
  target: [
    startExecution,
    markStartAttempted,
  ],
})

// Clear newly created execution ID when execution starts successfully
sample({
  clock: startExecutionFx.done,
  target: clearNewlyCreatedExecutionId,
})

// Clear newly created execution ID on terminal states or errors
sample({
  clock: [
    stopExecutionFx.done,
    createExecutionFx.failData,
    startExecutionFx.failData,
  ],
  target: clearNewlyCreatedExecutionId,
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
