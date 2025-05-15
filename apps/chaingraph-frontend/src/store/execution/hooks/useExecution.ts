/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import { useUnit } from 'effector-react'
import { $executionState, $executionSubscriptionState } from '../stores'
import { useExecutionSubscription } from './useExecutionSubscription'

export function useExecution() {
  const executionState = useUnit($executionState)
  const subscriptionState = useUnit($executionSubscriptionState)

  // Use the subscription hook
  const { isSubscribed, isConnecting, status: subscriptionStatus, error } = useExecutionSubscription()

  return {
    ...executionState,
    subscription: subscriptionState,
    isSubscribed,
    isConnecting,
    subscriptionStatus,
    error,
  }
}

export function useExecutionID() {
  const { executionId } = useUnit($executionState)
  return executionId
}
