/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { TRPCClient } from '@badaitech/chaingraph-trpc/client'
import type {
  FlowEvent,
} from '@badaitech/chaingraph-types'

import { attach, createEffect } from 'effector'

import { flowDomain } from '../domains'
import { resetEdges } from '../edges'
import {
  clearNodes,
} from '../nodes'
import { positionInterpolator } from '../nodes/position-interpolation-advanced'
import { $trpcClient } from '../trpc/store'
import {
  setFlowSubscriptionError,
  setFlowSubscriptionStatus,
} from './stores'
import { FlowSubscriptionStatus } from './types'

interface FlowSubscription {
  unsubscribe: () => void
  flowId: string
}

// Store for current active subscription
export const $activeSubscription = flowDomain.createStore<FlowSubscription | null>(null)

export const newFlowEvents = flowDomain.createEvent<FlowEvent[]>()

// Base effect for creating subscription
const subscribeToFlowBaseFx = createEffect<{ flowId: string, client: TRPCClient }, FlowSubscription>(
  async ({ flowId, client }) => {
    console.debug(`[FLOW SUB] subscribeToFlowBaseFx called with flowId: ${flowId}, client exists: ${!!client}`)

    if (!client) {
      console.error('[FLOW SUB] TRPC client not initialized!')
      throw new Error('TRPC client not initialized')
    }

    // Clear existing data
    clearNodes()
    resetEdges()
    setFlowSubscriptionStatus(FlowSubscriptionStatus.CONNECTING)

    console.debug(`[FLOW SUB] Creating actual subscription for flow ${flowId}`)

    try {
      const subscription = client.flow.subscribeToEvents.subscribe(
        {
          flowId,
          lastEventId: null,
          eventTypes: undefined,
        },
        {
          onStarted: (opts) => {
            console.debug(`[FLOW SUB] Subscription started for flow ${flowId}`, opts)
            setFlowSubscriptionStatus(FlowSubscriptionStatus.SUBSCRIBED)
          },
          onData: (data) => {
            console.debug(`[FLOW SUB] Received data for flow ${flowId}`)

            if (data && data.data) {
              newFlowEvents([
                data.data,
              ])
            }
          },
          onError: (error: any) => {
            console.error(`[FLOW SUB] Subscription error for flow ${flowId}:`, error)
            setFlowSubscriptionStatus(FlowSubscriptionStatus.ERROR)
            setFlowSubscriptionError({
              message: error.message,
              code: error.data?.code,
              timestamp: new Date(),
            })
          },
          onStopped: () => {
            console.debug(`[FLOW SUB] Subscription stopped for flow ${flowId}`)
            setFlowSubscriptionStatus(FlowSubscriptionStatus.DISCONNECTED)
          },
          onComplete: () => {
            console.debug(`[FLOW SUB] Subscription completed for flow ${flowId}`)
            setFlowSubscriptionStatus(FlowSubscriptionStatus.DISCONNECTED)
          },
          onConnectionStateChange: (state) => {
            console.debug(`[FLOW SUB] Connection state changed for flow ${flowId}:`, state)
            // Could track connection health here if needed
          },
        },
      )

      console.debug(`[FLOW SUB] Subscription created successfully for flow ${flowId}, subscription type: ${typeof subscription}`)

      // The subscription object has an unsubscribe method
      const unsubscribe = () => {
        console.debug(`[FLOW SUB] Calling unsubscribe for flow ${flowId}`)
        if (subscription && subscription.unsubscribe) {
          subscription.unsubscribe()
        }
      }

      return { unsubscribe, flowId }
    } catch (error) {
      console.error(`[FLOW SUB] Failed to create subscription for flow ${flowId}:`, error)
      throw error
    }
  },
)

// Attach effect with TRPC client
const subscribeToFlowFx = attach({
  source: $trpcClient,
  effect: subscribeToFlowBaseFx,
  mapParams: (flowId: string, client) => {
    console.debug(`[FLOW SUB] subscribeToFlowFx attach: flowId=${flowId}, client exists=${!!client}`)
    return { flowId, client: client! }
  },
})

// Effect to cleanup old subscription and start new one
export const switchSubscriptionFx = createEffect<{ oldSub: FlowSubscription | null, newFlowId: string }, FlowSubscription | null>(
  async ({ oldSub, newFlowId }) => {
    console.debug(`[FLOW SUB] switchSubscriptionFx started: cleanup ${oldSub?.flowId || 'none'} → start ${newFlowId || 'none'}`)

    // Cleanup old subscription
    if (oldSub && oldSub.unsubscribe) {
      console.debug(`[FLOW SUB] Unsubscribing from ${oldSub.flowId}`)
      oldSub.unsubscribe()
    }

    // Start new subscription if flowId is provided
    if (newFlowId) {
      console.debug(`[FLOW SUB] Starting new subscription for ${newFlowId}`)
      try {
        const result = await subscribeToFlowFx(newFlowId)
        console.debug(`[FLOW SUB] New subscription created for ${newFlowId}`)
        return result
      } catch (error) {
        console.error(`[FLOW SUB] Failed to create subscription for ${newFlowId}:`, error)
        throw error
      }
    }

    console.debug(`[FLOW SUB] No new subscription needed`)
    return null
  },
)

// Update active subscription store
$activeSubscription
  .on(subscribeToFlowFx.doneData, (_, subscription) => {
    console.debug('[FLOW SUB] $activeSubscription updated from subscribeToFlowFx:', subscription)
    return subscription
  })
  .on(switchSubscriptionFx.doneData, (_, subscription) => {
    console.debug('[FLOW SUB] $activeSubscription updated from switchSubscriptionFx:', subscription)
    return subscription
  })

// Cleanup on store reset
$activeSubscription.watch((subscription) => {
  if (subscription === null) {
    positionInterpolator.dispose()
  }
})

// Add error handling for effects
subscribeToFlowFx.failData.watch((error) => {
  console.error('[FLOW SUB] subscribeToFlowFx failed:', error)
})

switchSubscriptionFx.failData.watch((error) => {
  console.error('[FLOW SUB] switchSubscriptionFx failed:', error)
})

// Log effect state changes
subscribeToFlowFx.pending.watch((pending) => {
  console.debug(`[FLOW SUB] subscribeToFlowFx pending: ${pending}`)
})

switchSubscriptionFx.pending.watch((pending) => {
  console.debug(`[FLOW SUB] switchSubscriptionFx pending: ${pending}`)
})

// Export for external access if needed
// export { $activeSubscription }
