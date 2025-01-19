import type { FlowEventHandlerMap } from '@chaingraph/types/flow/eventHandlers'
import { trpc } from '@/api/trpc/client'
import {
  FlowSubscriptionStatus,
  setFlowMetadata,
  setFlowSubscriptionError,
  setFlowSubscriptionStatus,
} from '@/store'
import { $activeFlowId, $flowSubscriptionState, $isFlowsLoading } from '@/store/flow/stores'
import { addNode, removeNode } from '@/store/nodes/events'
import { createEventHandler } from '@chaingraph/types/flow/eventHandlers'
import { FlowEventType } from '@chaingraph/types/flow/events'
import { skipToken } from '@tanstack/react-query'
import { useUnit } from 'effector-react/effector-react.umd'
import { useEffect, useMemo } from 'react'

export function useFlowSubscription() {
  const activeFlowId = useUnit($activeFlowId)
  const isFlowsLoading = useUnit($isFlowsLoading)
  const subscriptionState = useUnit($flowSubscriptionState)

  // Create event handlers map
  const eventHandlers: FlowEventHandlerMap = useMemo(() => ({
    [FlowEventType.MetadataUpdated]: (data) => {
      console.log('Flow metadata updated:', data)
      setFlowMetadata(data.newMetadata)
    },

    [FlowEventType.NodeAdded]: (data) => {
      console.log('Node added:', data)
      addNode(data.node)
    },

    [FlowEventType.NodeRemoved]: (data) => {
      console.log('Node removed:', data)
      removeNode(data.nodeId)
    },

    // Add other event handlers as needed
  }), [])

  // Create event handler with error handling
  const handleEvent = useMemo(() => createEventHandler(eventHandlers, {
    onError: (error, event) => {
      console.error(`Error handling event ${event.type}:`, error)
      // Consider creating a separate error event/store for subscription errors
    },
  }), [eventHandlers])

  // Subscribe to flow events using tRPC
  const subscription = trpc.flow.subscribeToEvents.useSubscription(
    activeFlowId
      ? {
          flowId: activeFlowId,
          lastEventId: null,
        }
      : skipToken,
    {
      onStarted: () => {
        setFlowSubscriptionStatus(FlowSubscriptionStatus.CONNECTING)
      },
      onData: async (trackedData) => {
        // Set status to SUBSCRIBED on first data received
        setFlowSubscriptionStatus(FlowSubscriptionStatus.SUBSCRIBED)
        console.log('Received event:', trackedData.data)
        await handleEvent(trackedData.data)
      },
      onError: (error) => {
        console.error('Error subscribing to flow events:', error)
        setFlowSubscriptionStatus(FlowSubscriptionStatus.ERROR)
        setFlowSubscriptionError({
          message: error.message,
          code: error.data?.code,
          timestamp: new Date(),
        })
      },
    },
  )

  // Update subscription status on unmount
  useEffect(() => {
    return () => {
      if (activeFlowId) {
        setFlowSubscriptionStatus(FlowSubscriptionStatus.DISCONNECTED)
      }

      // Reset subscription
      if (subscription) {
        subscription.reset()
      }
    }
  }, [activeFlowId, subscription])

  return {
    ...subscriptionState,
    isLoading: isFlowsLoading || subscriptionState.status === FlowSubscriptionStatus.CONNECTING,
  }
}
