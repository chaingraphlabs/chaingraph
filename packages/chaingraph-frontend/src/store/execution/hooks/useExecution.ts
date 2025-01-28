import { useUnit } from 'effector-react'
import { $executionState, $executionSubscriptionState } from '../stores'
import { useExecutionSubscription } from './useExecutionSubscription'

export function useExecution() {
  const executionState = useUnit($executionState)
  const subscriptionState = useUnit($executionSubscriptionState)

  // Use the subscription hook
  useExecutionSubscription()

  return {
    ...executionState,
    subscription: subscriptionState,
  }
}
