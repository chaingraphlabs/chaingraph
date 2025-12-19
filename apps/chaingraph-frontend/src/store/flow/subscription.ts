/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { TRPCClient } from '@badaitech/chaingraph-trpc/client'
import type { FlowEvent } from '@badaitech/chaingraph-types'

import { attach, createEffect } from 'effector'

import { trace } from '@/lib/perf-trace'
import { flowDomain } from '../domains'
import { resetEdges } from '../edges'
import { clearNodes } from '../nodes'
import { positionInterpolator } from '../nodes/position-interpolation-advanced'
import { $trpcClient } from '../trpc/store'
import { setFlowSubscriptionError, setFlowSubscriptionStatus } from './stores'
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
    if (!client) {
      console.error('[FLOW SUB] TRPC client not initialized!')
      throw new Error('TRPC client not initialized')
    }

    // Clear existing data
    clearNodes()
    resetEdges()
    setFlowSubscriptionStatus(FlowSubscriptionStatus.CONNECTING)

    try {
      const subscription = client.flow.subscribeToEvents.subscribe(
        {
          flowId,
          lastEventId: null,
          eventTypes: undefined,
        },
        {
          onStarted: (opts) => {
            setFlowSubscriptionStatus(FlowSubscriptionStatus.SUBSCRIBED)
          },
          onData: (data) => {
            if (data && data.data) {
              const spanId = trace.start('subscription.onData', {
                category: 'io',
                tags: { eventType: data.data.type },
              })
              newFlowEvents([
                data.data,
              ])
              trace.end(spanId)
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
            setFlowSubscriptionStatus(FlowSubscriptionStatus.DISCONNECTED)
          },
          onComplete: () => {
            setFlowSubscriptionStatus(FlowSubscriptionStatus.DISCONNECTED)
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
    return { flowId, client: client! }
  },
})

// Effect to cleanup old subscription and start new one
export const switchSubscriptionFx = createEffect<{ oldSub: FlowSubscription | null, newFlowId: string }, FlowSubscription | null>(
  async ({ oldSub, newFlowId }) => {
    // Cleanup old subscription
    if (oldSub && oldSub.unsubscribe) {
      oldSub.unsubscribe()
    }

    // Start new subscription if flowId is provided
    if (newFlowId) {
      return await subscribeToFlowFx(newFlowId)
    }

    return null
  },
)

// Update active subscription store
$activeSubscription
  .on(subscribeToFlowFx.doneData, (_, subscription) => {
    return subscription
  })
  .on(switchSubscriptionFx.doneData, (_, subscription) => {
    return subscription
  })

// Cleanup on store reset
$activeSubscription.watch((subscription) => {
  if (subscription === null) {
    positionInterpolator.dispose()
  }
})

// Export for external access if needed
// export { $activeSubscription }
