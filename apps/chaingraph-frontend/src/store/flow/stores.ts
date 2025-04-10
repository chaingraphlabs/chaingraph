/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { FlowMetadata } from '@badaitech/chaingraph-types'
import type { FlowSubscriptionError } from './types'
import { combine, createStore } from 'effector'
import { createFlowFx, deleteFlowFx, editFlowFx, loadFlowsListFx } from './effects'
import {
  deleteFlow,
  setFlowLoaded,
  setFlowMetadata,
  setFlowsError,
  setFlowsList,
  setFlowsLoading,
} from './events'
import { FlowSubscriptionStatus } from './types'

// Store for all flows list
export const $flows = createStore<FlowMetadata[]>([])
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

// Currently active flow ID
export const $activeFlowId = createStore<string | null>(null)

// Main loading state
export const $isFlowsLoading = createStore<boolean>(false)
  .on(setFlowsLoading, (_, isLoading) => isLoading)
  .on(loadFlowsListFx.pending, (_, isPending) => isPending)

// Main error state
export const $flowsError = createStore<Error | null>(null)
  .on(setFlowsError, (_, error) => error)
  .on(loadFlowsListFx.failData, (_, error) => error)
  .reset(loadFlowsListFx.done)

// Specific operation error stores
export const $createFlowError = createStore<Error | null>(null)
  .on(createFlowFx.failData, (_, error) => error)
  .reset(createFlowFx.done)

export const $updateFlowError = createStore<Error | null>(null)
  .on(editFlowFx.failData, (_, error) => error)
  .reset(editFlowFx.done)

export const $deleteFlowError = createStore<Error | null>(null)
  .on(deleteFlowFx.failData, (_, error) => error)
  .reset(deleteFlowFx.done)

// Specific operation loading states
export const $isCreatingFlow = createStore<boolean>(false)
  .on(createFlowFx.pending, (_, isPending) => isPending)

export const $isUpdatingFlow = createStore<boolean>(false)
  .on(editFlowFx.pending, (_, isPending) => isPending)

export const $isDeletingFlow = createStore<boolean>(false)
  .on(deleteFlowFx.pending, (_, isPending) => isPending)

// Combined error store
export const $allFlowsErrors = combine(
  $flowsError,
  $createFlowError,
  $updateFlowError,
  $deleteFlowError,
  (loadError, createError, updateError, deleteError) =>
    loadError || createError || updateError || deleteError,
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
export const $flowSubscriptionStatus = createStore<FlowSubscriptionStatus>(
  FlowSubscriptionStatus.IDLE,
)

export const $flowSubscriptionError = createStore<FlowSubscriptionError | null>(null)

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
