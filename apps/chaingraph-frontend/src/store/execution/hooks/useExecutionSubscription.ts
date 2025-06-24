/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import { useTRPC } from '@badaitech/chaingraph-trpc/client'
import { ExecutionEventEnum } from '@badaitech/chaingraph-types'
import { useSubscription } from '@trpc/tanstack-react-query'
// import { trpcReact } from '@badaitech/chaingraph-trpc/client'
import { useUnit } from 'effector-react'
import { useEffect, useMemo } from 'react'
import {
  $executionState,
  $executionSubscriptionState,
  ExecutionSubscriptionStatus,
  newExecutionEvent,
  setExecutionSubscriptionError,
  setExecutionSubscriptionStatus,
} from '../index'

export function useExecutionSubscription() {
  const { executionId } = useUnit($executionState)
  const subscriptionState = useUnit($executionSubscriptionState)

  // Create event handlers map
  // const eventHandlers: ExecutionEventHandlerMap = useMemo(() => ({
  //   [ExecutionEventEnum.FLOW_SUBSCRIBED]: (data) => {
  //     // console.log('Flow subscribed:', data.flow.id)
  //
  //     setExecutionSubscriptionStatus(ExecutionSubscriptionStatus.SUBSCRIBED)
  //   },
  //   [ExecutionEventEnum.FLOW_STARTED]: (data) => {
  //     // Handle flow started
  //     // console.log('Flow started:', data.flow.id)
  //     setExecutionStatus(ExecutionStatus.RUNNING)
  //   },
  //
  //   [ExecutionEventEnum.FLOW_COMPLETED]: (data) => {
  //     // Update execution status
  //     // console.log('Flow completed:', data.flow.id, 'in', data.executionTime, 'ms')
  //     setExecutionStatus(ExecutionStatus.COMPLETED)
  //   },
  //
  //   [ExecutionEventEnum.FLOW_FAILED]: (data) => {
  //     // console.log('Flow failed:', data.flow.id, data.error)
  //     setExecutionError({
  //       message: data.error.message,
  //       timestamp: new Date(),
  //     })
  //     // Clear execution state when flow fails
  //     setExecutionStatus(ExecutionStatus.ERROR)
  //   },
  //
  //   [ExecutionEventEnum.FLOW_CANCELLED]: (data) => {
  //     // console.log('Flow cancelled:', data.reason)
  //     // Clear execution state when flow is cancelled
  //     setExecutionStatus(ExecutionStatus.STOPPED)
  //   },
  //
  //   [ExecutionEventEnum.FLOW_PAUSED]: (data) => {
  //     // Update execution status
  //     // console.log('Flow paused:', data.reason)
  //   },
  //
  //   [ExecutionEventEnum.FLOW_RESUMED]: (data) => {
  //     // Update execution status
  //     // console.log('Flow resumed:', data.flow.id)
  //   },
  //
  //   [ExecutionEventEnum.NODE_STARTED]: (data) => {
  //     // Update current executing node
  //     // console.log('Node started:', data.node.id)
  //   },
  //
  //   [ExecutionEventEnum.NODE_COMPLETED]: (data) => {
  //     // console.log('Node completed:', data.node.id, 'in', data.executionTime, 'ms')
  //   },
  //
  //   [ExecutionEventEnum.NODE_FAILED]: (data) => {
  //     // console.log('Node failed:', data.node.id, data.error)
  //   },
  //
  //   [ExecutionEventEnum.NODE_SKIPPED]: (data) => {
  //     // console.log('Node skipped:', data.node.id, data.reason)
  //   },
  //
  //   [ExecutionEventEnum.NODE_STATUS_CHANGED]: (data) => {
  //     // console.log('Node status changed:', data.node.id, data.oldStatus, '->', data.newStatus)
  //   },
  //
  //   [ExecutionEventEnum.EDGE_TRANSFER_STARTED]: (data) => {
  //     // console.log('Edge transfer started:', data.edge.id)
  //   },
  //
  //   [ExecutionEventEnum.EDGE_TRANSFER_COMPLETED]: (data) => {
  //     // console.log('Edge transfer completed:', data.edge.id, 'in', data.transferTime, 'ms')
  //   },
  //
  //   [ExecutionEventEnum.EDGE_TRANSFER_FAILED]: (data) => {
  //     // console.log('Edge transfer failed:', data.edge.id, data.error)
  //   },
  //
  //   [ExecutionEventEnum.DEBUG_BREAKPOINT_HIT]: (data) => {
  //     // console.log('Debug breakpoint hit:', data.node.id)
  //
  //     setExecutionStatus(ExecutionStatus.PAUSED)
  //   },
  //
  //   [ExecutionEventEnum.NODE_DEBUG_LOG_STRING]: (data) => {
  //     // console.log('Debug log from execution:\n', data.node, '\n', data.log)
  //   },
  // }), [])

  // Create event handler with error handling
  // const handleEvent = useMemo(() => createExecutionEventHandler(eventHandlers, {
  //   onError: (error, event) => {
  //     console.error(`Error handling execution event ${event.type}:`, error)
  //     setExecutionSubscriptionError({
  //       message: `Error handling event ${event.type}: ${error.message}`,
  //       timestamp: new Date(),
  //     })
  //   },
  // }), [eventHandlers])

  // Subscribe to execution events using tRPC
  const trpc = useTRPC()

  const opts = trpc.execution.subscribeToEvents.subscriptionOptions(
    {
      executionId: executionId || '',
      lastEventId: null,
      eventTypes: [
        ExecutionEventEnum.FLOW_SUBSCRIBED,
        ExecutionEventEnum.FLOW_STARTED,
        ExecutionEventEnum.FLOW_COMPLETED,
        ExecutionEventEnum.FLOW_FAILED,
        ExecutionEventEnum.FLOW_CANCELLED,
        ExecutionEventEnum.FLOW_PAUSED,
        ExecutionEventEnum.FLOW_RESUMED,
        ExecutionEventEnum.NODE_STARTED,
        ExecutionEventEnum.NODE_BACKGROUNDED,
        ExecutionEventEnum.NODE_COMPLETED,
        ExecutionEventEnum.NODE_FAILED,
        ExecutionEventEnum.NODE_SKIPPED,
        ExecutionEventEnum.NODE_STATUS_CHANGED,
        ExecutionEventEnum.NODE_DEBUG_LOG_STRING,
        // ExecutionEventEnum.EDGE_TRANSFER_STARTED,
        ExecutionEventEnum.EDGE_TRANSFER_COMPLETED,
        ExecutionEventEnum.EDGE_TRANSFER_FAILED,
        ExecutionEventEnum.DEBUG_BREAKPOINT_HIT,
        ExecutionEventEnum.CHILD_EXECUTION_SPAWNED,
        ExecutionEventEnum.CHILD_EXECUTION_COMPLETED,
        ExecutionEventEnum.CHILD_EXECUTION_FAILED,
      ],
    },
    {
      enabled: !!executionId,
      onStarted: () => {
        setExecutionSubscriptionStatus(ExecutionSubscriptionStatus.CONNECTING)
      },
      onData: async (trackedData) => {
        if (trackedData.type === ExecutionEventEnum.FLOW_SUBSCRIBED) {
          setExecutionSubscriptionStatus(ExecutionSubscriptionStatus.SUBSCRIBED)
        }
        if (trackedData.type !== ExecutionEventEnum.NODE_STATUS_CHANGED) {
          newExecutionEvent(trackedData)
        }
        // await handleEvent(trackedData)
      },
      onError: (error) => {
        // debugger
        console.error('Error subscribing to execution events:', error)
        setExecutionSubscriptionStatus(ExecutionSubscriptionStatus.ERROR)
        setExecutionSubscriptionError({
          message: error.message,
          code: error.data?.code,
          timestamp: new Date(),
        })
      },
    },
  )

  const subscription = useSubscription({
    ...opts,
    enabled: !!executionId,
  })

  // Add effect to handle terminal states
  // useEffect(() => {
  //   if (isTerminalStatus(executionStatus)) {
  //     debugger
  //     setExecutionSubscriptionStatus(ExecutionSubscriptionStatus.DISCONNECTED)
  //     if (subscription) {
  //       subscription.reset()
  //     }
  //   }
  // }, [executionStatus, subscription])

  // Cleanup on unmount
  // useEffect(() => {
  //   return () => {
  //     if (isTerminalStatus(executionStatus)) {
  //       clearExecutionState()
  //     }
  //   }
  // }, [executionStatus])

  useEffect(() => {
    return () => {
      if (executionId) {
        setExecutionSubscriptionStatus(ExecutionSubscriptionStatus.DISCONNECTED)
      }

      // Reset subscription
      // if (subscription) {
      //   subscription.reset()
      // }
    }
    // FIXME
  }, [executionId])

  return useMemo(() => ({
    isSubscribed: subscriptionState.status === ExecutionSubscriptionStatus.SUBSCRIBED,
    isConnecting: subscriptionState.status === ExecutionSubscriptionStatus.CONNECTING,
    // subscription,
    status: subscriptionState.status,
    error: subscriptionState.error,
  }), [subscriptionState.status, subscriptionState.error])
}
