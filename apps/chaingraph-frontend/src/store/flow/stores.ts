/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type {
  FlowMetadata,
} from '@badaitech/chaingraph-types'
import type { CreateFlowEvent, FlowSubscriptionError, UpdateFlowEvent } from './types'
import { flowDomain } from '@/store/domains'
import { combine } from 'effector'
import { globalReset } from '../common'
import { $trpcClient } from '../trpc/store'
import { FlowSubscriptionStatus } from './types'

// EVENTS

// Flow list events
export const loadFlowsList = flowDomain.createEvent()
export const setFlowsList = flowDomain.createEvent<FlowMetadata[]>()
export const setFlowsLoading = flowDomain.createEvent<boolean>()
export const setFlowsError = flowDomain.createEvent<Error | null>()
export const setFlowMetadata = flowDomain.createEvent<FlowMetadata>()
export const setFlowLoaded = flowDomain.createEvent<string>()

// Active flow events
export const setActiveFlowId = flowDomain.createEvent<string>()
export const clearActiveFlow = flowDomain.createEvent()

// Removed debugging - issue identified and fixed

// Flow CRUD events
export const createFlow = flowDomain.createEvent<CreateFlowEvent>()
export const updateFlow = flowDomain.createEvent<UpdateFlowEvent>()
export const deleteFlow = flowDomain.createEvent<string>()
export const forkFlow = flowDomain.createEvent<{ flowId: string, name?: string }>()

// Subscription events
export const setFlowSubscriptionStatus = flowDomain.createEvent<FlowSubscriptionStatus>()
export const setFlowSubscriptionError = flowDomain.createEvent<FlowSubscriptionError | null>()
export const resetFlowSubscription = flowDomain.createEvent()

// EFFECTS

// Effect for loading flows list
export const loadFlowsListFx = flowDomain.createEffect(async () => {
  const client = $trpcClient.getState()
  if (!client) {
    throw new Error('TRPC client is not initialized')
  }
  return client.flow.list.query()
})

// Effect for creating new flow
export const createFlowFx = flowDomain.createEffect(async (event: CreateFlowEvent) => {
  const client = $trpcClient.getState()
  if (!client) {
    throw new Error('TRPC client is not initialized')
  }
  return client.flow.create.mutate(event.metadata)
})

// Effect for editing flow
export const editFlowFx = flowDomain.createEffect(async (event: UpdateFlowEvent) => {
  const client = $trpcClient.getState()

  if (!client) {
    throw new Error('TRPC client is not initialized')
  }
  return client.flow.edit.mutate({
    flowId: event.id,
    ...event.metadata,
  })
})

// Effect for deleting flow
export const deleteFlowFx = flowDomain.createEffect(async (id: string) => {
  const client = $trpcClient.getState()
  if (!client) {
    throw new Error('TRPC client is not initialized')
  }
  return client.flow.delete.mutate({
    flowId: id,
  })
})

// Effect for forking flow
export const forkFlowFx = flowDomain.createEffect(async (event: { flowId: string, name?: string }) => {
  const client = $trpcClient.getState()
  if (!client) {
    throw new Error('TRPC client is not initialized')
  }
  return client.flow.fork.mutate({
    flowId: event.flowId,
    name: event.name,
  })
})

// STORES

// Store for all flows list
export const $flows = flowDomain.createStore<FlowMetadata[]>([])
  // Handle direct state updates
  .on(setFlowsList, (_, flows) => flows)
  .on(setFlowMetadata, (flows, updatedFlow) => {
    const flowExists = flows.some(f => f.id === updatedFlow.id)
    if (flowExists) {
      // Update existing flow
      return flows.map(flow =>
        flow.id === updatedFlow.id ? updatedFlow : flow,
      )
    } else {
      // Insert new flow
      return [...flows, updatedFlow]
    }
  })
  .on(setFlowLoaded, (flows, updatedFlowId) => {
    const flowExists = flows.some(f => f.id === updatedFlowId)
    if (flowExists) {
      // Update existing flow
      return flows.map(flow =>
        flow.id === updatedFlowId
          ? {
              ...flow,
              metadata: {
                ...flow.metadata,
                loaded: true,
              },
            }
          : flow,
      )
    }
  })
  .on(deleteFlow, (flows, id) =>
    flows.filter(f => f.id !== id))
  .reset(globalReset)

// Currently active flow ID
export const $activeFlowId = flowDomain.createStore<string | null>(null)
  .on(setActiveFlowId, (_, id) => id)
  .reset(clearActiveFlow)
  .reset(globalReset)

// Main loading state
export const $isFlowsLoading = flowDomain.createStore<boolean>(false)
  .on(setFlowsLoading, (_, isLoading) => isLoading)
  .on(loadFlowsListFx.pending, (_, isPending) => isPending)
  .reset(globalReset)

export const $isFlowLoaded = flowDomain.createStore<boolean>(false)
  .on(setFlowLoaded, (_, flowId) => {
    const flow = $flows.getState().find(f => f.id === flowId)
    return flow && flow.metadata ? !!flow.metadata?.loaded : false
  })
  .reset(clearActiveFlow)
  .reset(globalReset)

// Main error state
export const $flowsError = flowDomain.createStore<Error | null>(null)
  .on(setFlowsError, (_, error) => error)
  .on(loadFlowsListFx.failData, (_, error) => error)
  .reset(loadFlowsListFx.done)
  .reset(globalReset)

// Specific operation error stores
export const $createFlowError = flowDomain.createStore<Error | null>(null)
  .on(createFlowFx.failData, (_, error) => error)
  .reset(createFlowFx.done)
  .reset(globalReset)

export const $updateFlowError = flowDomain.createStore<Error | null>(null)
  .on(editFlowFx.failData, (_, error) => error)
  .reset(editFlowFx.done)
  .reset(globalReset)

export const $deleteFlowError = flowDomain.createStore<Error | null>(null)
  .on(deleteFlowFx.failData, (_, error) => error)
  .reset(deleteFlowFx.done)
  .reset(globalReset)

export const $forkFlowError = flowDomain.createStore<Error | null>(null)
  .on(forkFlowFx.failData, (_, error) => error)
  .reset(forkFlowFx.done)
  .reset(globalReset)

// Specific operation loading states
export const $isCreatingFlow = flowDomain.createStore<boolean>(false)
  .on(createFlowFx.pending, (_, isPending) => isPending)
  .reset(globalReset)

export const $isUpdatingFlow = flowDomain.createStore<boolean>(false)
  .on(editFlowFx.pending, (_, isPending) => isPending)
  .reset(globalReset)

export const $isDeletingFlow = flowDomain.createStore<boolean>(false)
  .on(deleteFlowFx.pending, (_, isPending) => isPending)
  .reset(globalReset)

export const $isForkingFlow = flowDomain.createStore<boolean>(false)
  .on(forkFlowFx.pending, (_, isPending) => isPending)
  .reset(globalReset)

// Combined error store
export const $allFlowsErrors = combine(
  $flowsError,
  $createFlowError,
  $updateFlowError,
  $deleteFlowError,
  $forkFlowError,
  (loadError, createError, updateError, deleteError, forkError) =>
    loadError || createError || updateError || deleteError || forkError,
)

// Currently active flow metadata
export const $activeFlowMetadata = combine(
  $flows,
  $activeFlowId,
  (flows, activeId) => activeId
    ? flows.find(f => f.id === activeId) ?? null
    : null,
)

// Subscription related stores
export const $flowSubscriptionStatus = flowDomain.createStore<FlowSubscriptionStatus>(
  FlowSubscriptionStatus.IDLE,
).on(setFlowSubscriptionStatus, (_, status) => status).reset(resetFlowSubscription).reset(clearActiveFlow).reset(globalReset)

export const $flowSubscriptionError = flowDomain.createStore<FlowSubscriptionError | null>(null)
  .on(setFlowSubscriptionError, (_, error) => error)
  .reset(resetFlowSubscription)
  .reset(clearActiveFlow)
  .reset(globalReset)

// Derived store to check if subscription is active
export const $isFlowSubscribed = $flowSubscriptionStatus.map(
  status => status === FlowSubscriptionStatus.SUBSCRIBED,
)

// Combined subscription state for UI
export const $flowSubscriptionState = combine({
  status: $flowSubscriptionStatus,
  error: $flowSubscriptionError,
  isSubscribed: $isFlowSubscribed,
})
