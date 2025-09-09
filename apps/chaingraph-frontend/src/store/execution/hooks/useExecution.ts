/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import { useUnit } from 'effector-react'
import { $executionState, $executionSubscriptionState } from '../stores'
import { ExecutionSubscriptionStatus } from '../types'

export function useExecution() {
  const executionState = useUnit($executionState)
  const subscriptionState = useUnit($executionSubscriptionState)

  // Derive subscription status from Effector store
  const isSubscribed = subscriptionState.status === ExecutionSubscriptionStatus.SUBSCRIBED
  const isConnecting = subscriptionState.status === ExecutionSubscriptionStatus.CONNECTING

  return {
    ...executionState,
    subscription: subscriptionState,
    isSubscribed,
    isConnecting,
    subscriptionStatus: subscriptionState.status,
    error: subscriptionState.error,
  }
}

export function useExecutionID() {
  const { executionId } = useUnit($executionState)
  return executionId
}
