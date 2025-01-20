import type { FlowEventHandlerMap } from '@chaingraph/types/flow/eventHandlers'
import { trpc } from '@/api/trpc/client'
import {
  $nodes,
  FlowSubscriptionStatus,
  setFlowMetadata,
  setFlowSubscriptionError,
  setFlowSubscriptionStatus,
  setNodes,
  setNodeVersion,
} from '@/store'
import { $activeFlowId, $flowSubscriptionState, $isFlowsLoading } from '@/store/flow/stores'
import { addNode, removeNode } from '@/store/nodes/events'
import { positionInterpolator } from '@/store/nodes/position-interpolation'
import { createEventHandler } from '@chaingraph/types/flow/eventHandlers'
import { FlowEventType } from '@chaingraph/types/flow/events'
import { DefaultPosition } from '@chaingraph/types/node/node-ui.ts'
import { skipToken } from '@tanstack/react-query'
import { useUnit } from 'effector-react/effector-react.umd'
import { useEffect, useMemo } from 'react'

export function useFlowSubscription() {
  const activeFlowId = useUnit($activeFlowId)
  const isFlowsLoading = useUnit($isFlowsLoading)
  const subscriptionState = useUnit($flowSubscriptionState)
  const nodes = useUnit($nodes)

  // Create event handlers map
  const eventHandlers: FlowEventHandlerMap = useMemo(() => ({
    [FlowEventType.FlowInitStart]: (data) => {
      // clean up existing flow data
      setNodes({})
      setFlowMetadata(data.metadata)
    },

    [FlowEventType.FlowInitEnd]: (data) => {},

    [FlowEventType.MetadataUpdated]: (data) => {
      setFlowMetadata(data.newMetadata)
    },

    [FlowEventType.NodeAdded]: (data) => {
      console.log('Adding node: version:', data.node.metadata.version)
      addNode(data.node)
    },

    [FlowEventType.NodeRemoved]: (data) => {
      removeNode(data.nodeId)
    },

    [FlowEventType.NodeUIPositionChanged]: (data) => {
      const currentNode = nodes[data.nodeId]
      if (!currentNode)
        return

      const currentVersion = currentNode.getVersion()

      // if event contains version + 1 then just update the version
      if (data.version && data.version <= currentVersion) {
        console.log(`[SKIPPING] Received position change event for node ${data.nodeId}, local version: ${currentVersion}, event version: ${data.version}`)
        return
      }

      // ignore outdated events
      // if (data.version && data.version <= currentVersion) {
      //   console.log(`Ignoring outdated position change event for node ${data.nodeId}, local version: ${currentVersion}, event version: ${data.version}`)
      //   return
      // }

      console.log(`[NOT SKIP] Received position change event for node ${data.nodeId}, local version: ${currentVersion}, event version: ${data.version}`)

      setNodeVersion({
        id: data.nodeId,
        version: data.version,
      })

      const currentPosition = currentNode.metadata.ui?.position || DefaultPosition
      positionInterpolator.startInterpolation(
        data.nodeId,
        currentPosition,
        data.newPosition,
      )
    },

    [FlowEventType.NodeUIStateChanged]: (data) => {
      const currentNode = nodes[data.nodeId]
      if (!currentNode)
        return

      const currentVersion = currentNode.getVersion()

      // ignore outdated events
      if (data.version && data.version <= currentVersion) {
        console.log(`Ignoring outdated state change event for node ${data.nodeId}, local version: ${currentVersion}, event version: ${data.version}`)
        return
      }

      currentNode.setMetadata({
        ...currentNode.metadata,
        ui: {
          ...currentNode.metadata.ui,
          ...data.newValue,
          position: data.newValue.position || currentNode.metadata.ui?.position,
          dimensions: data.newValue.dimensions || currentNode.metadata.ui?.dimensions,
          style: data.newValue.style || currentNode.metadata.ui?.style,
          state: data.newValue.state || currentNode.metadata.ui?.state,
          version: data.newValue.version,
        },
      })
    },

    // Add other event handlers as needed
  }), [nodes])

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

  useEffect(() => {
    return () => {
      positionInterpolator.dispose()
    }
  }, [])

  return {
    ...subscriptionState,
    isLoading: isFlowsLoading || subscriptionState.status === FlowSubscriptionStatus.CONNECTING,
  }
}
