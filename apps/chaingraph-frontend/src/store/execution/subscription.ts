/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { TRPCClient as TRPCExecutorClient } from '@badaitech/chaingraph-executor/client'
import { ExecutionEventEnum } from '@badaitech/chaingraph-types'
import { attach, combine, createEffect, createStore, sample } from 'effector'
import { $trpcClientExecutor } from '../trpc/execution-client'
import {
  $executionState,
  newExecutionEvents,
  setExecutionSubscriptionError,
  setExecutionSubscriptionStatus,
} from './stores'
import {
  ExecutionSubscriptionStatus,
} from './types'

interface ExecutionSubscription {
  unsubscribe: () => void
  executionId: string
}

// Store for current active subscription
export const $activeExecutionSubscription = createStore<ExecutionSubscription | null>(null)

// Base effect for creating subscription
const subscribeToExecutionBaseFx = createEffect<{ executionId: string, client: TRPCExecutorClient }, ExecutionSubscription>(
  async ({ executionId, client }) => {
    if (!client) {
      console.error('[EXEC SUB] TRPC executor client not initialized!')
      throw new Error('Executor TRPC client not initialized')
    }

    setExecutionSubscriptionStatus(ExecutionSubscriptionStatus.CONNECTING)

    try {
      const subscription = client.subscribeToExecutionEvents.subscribe(
        {
          executionId,
          fromIndex: 0,
          eventTypes: [
            ExecutionEventEnum.FLOW_SUBSCRIBED,
            ExecutionEventEnum.FLOW_STARTED,
            ExecutionEventEnum.FLOW_COMPLETED,
            ExecutionEventEnum.FLOW_FAILED,
            ExecutionEventEnum.FLOW_CANCELLED,
            ExecutionEventEnum.FLOW_PAUSED,
            ExecutionEventEnum.FLOW_RESUMED,
            ExecutionEventEnum.NODE_STARTED,
            ExecutionEventEnum.NODE_COMPLETED,
            ExecutionEventEnum.NODE_FAILED,
            ExecutionEventEnum.NODE_SKIPPED,
            // ExecutionEventEnum.NODE_STATUS_CHANGED,
            ExecutionEventEnum.NODE_DEBUG_LOG_STRING,
            ExecutionEventEnum.EDGE_TRANSFER_COMPLETED,
            ExecutionEventEnum.EDGE_TRANSFER_FAILED,
            ExecutionEventEnum.DEBUG_BREAKPOINT_HIT,
            ExecutionEventEnum.CHILD_EXECUTION_SPAWNED,
            ExecutionEventEnum.CHILD_EXECUTION_COMPLETED,
            ExecutionEventEnum.CHILD_EXECUTION_FAILED,
          ],
        },
        {
          onStarted: (opts) => {
            setExecutionSubscriptionStatus(ExecutionSubscriptionStatus.SUBSCRIBED)
          },
          onData: (events) => {
            newExecutionEvents(events)
          },
          onError: (error: any) => {
            setExecutionSubscriptionStatus(ExecutionSubscriptionStatus.ERROR)
            setExecutionSubscriptionError({
              message: error.message,
              code: error.data?.code,
              timestamp: new Date(),
            })
          },
          onStopped: () => {
            setExecutionSubscriptionStatus(ExecutionSubscriptionStatus.DISCONNECTED)
          },
          onComplete: () => {
            setExecutionSubscriptionStatus(ExecutionSubscriptionStatus.DISCONNECTED)
          },
          onConnectionStateChange: (state) => {
            // Could track connection health here if needed
          },
        },
      )

      // The subscription object has an unsubscribe method
      const unsubscribe = () => {
        if (subscription && subscription.unsubscribe) {
          subscription.unsubscribe()
        }
      }

      return { unsubscribe, executionId }
    } catch (error) {
      console.error(`[EXEC SUB] Failed to create subscription for execution ${executionId}:`, error)
      throw error
    }
  },
)

// Attach effect with TRPC executor client
const subscribeToExecutionFx = attach({
  source: $trpcClientExecutor,
  effect: subscribeToExecutionBaseFx,
  mapParams: (executionId: string, client) => {
    return { executionId, client: client! }
  },
})

// Effect to cleanup old subscription and start new one
const switchExecutionSubscriptionFx = createEffect<
  { oldSub: ExecutionSubscription | null, newExecutionId: string },
  ExecutionSubscription | null
>(async ({ oldSub, newExecutionId }) => {
  // Cleanup old subscription
  if (oldSub && oldSub.unsubscribe) {
    oldSub.unsubscribe()
  }

  // Start new subscription if executionId is provided
  if (newExecutionId) {
    try {
      const result = await subscribeToExecutionFx(newExecutionId)
      return result
    } catch (error) {
      console.error(`[EXEC SUB] Failed to create subscription for ${newExecutionId}:`, error)
      throw error
    }
  }

  return null
})

// Watch for executionId changes and manage subscriptions
// Use source combine to prevent race conditions
sample({
  clock: $executionState,
  source: combine({
    currentSub: $activeExecutionSubscription,
    isEffectPending: switchExecutionSubscriptionFx.pending,
  }),
  filter: ({ currentSub, isEffectPending }, state) => {
    // Prevent concurrent executions
    if (isEffectPending) {
      return false
    }
    // Only proceed if executionId is valid and different from current subscription
    const shouldSwitch = Boolean(state.executionId) && currentSub?.executionId !== state.executionId
    return shouldSwitch
  },
  fn: ({ currentSub }, state) => ({
    oldSub: currentSub,
    newExecutionId: state.executionId!,
  }),
  target: switchExecutionSubscriptionFx,
})

// Handle execution deselection (when executionId becomes null)
sample({
  clock: $executionState,
  source: combine({
    currentSub: $activeExecutionSubscription,
    isEffectPending: switchExecutionSubscriptionFx.pending,
  }),
  filter: ({ currentSub, isEffectPending }, state) => !state.executionId && currentSub !== null && !isEffectPending,
  fn: ({ currentSub }) => ({ oldSub: currentSub, newExecutionId: '' }),
  target: switchExecutionSubscriptionFx,
})

// Update active subscription store
$activeExecutionSubscription
  .on(subscribeToExecutionFx.doneData, (_, subscription) => {
    return subscription
  })
  .on(switchExecutionSubscriptionFx.doneData, (_, subscription) => {
    return subscription
  })
