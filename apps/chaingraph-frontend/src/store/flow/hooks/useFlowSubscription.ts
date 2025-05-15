/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { FlowEventHandlerMap } from '@badaitech/chaingraph-types'
import { useTRPC } from '@badaitech/chaingraph-trpc/client'
import { createEventHandler, DefaultPosition, FlowEventType } from '@badaitech/chaingraph-types'
import { skipToken } from '@tanstack/react-query'
import { useSubscription } from '@trpc/tanstack-react-query'
import { useUnit } from 'effector-react'
import { useEffect, useMemo } from 'react'
import {
  getNodePositionInFlow,
  getNodePositionInsideParent,
} from '../../../components/flow/utils/node-position'
import { removeEdge, resetEdges, setEdge, setEdges } from '../../edges'
import {
  $nodes,
  addNode,
  addNodes,
  clearNodes,
  removeNode,
  setNodeVersion,
  updateNode,
  updateNodeUILocal,
} from '../../nodes'
import { positionInterpolator } from '../../nodes/position-interpolation-advanced'
import { updatePort } from '../../ports'
import { $activeFlowId, $flowSubscriptionState, $isFlowsLoading, setFlowLoaded, setFlowMetadata, setFlowSubscriptionError, setFlowSubscriptionStatus } from '../stores'
import { FlowSubscriptionStatus } from '../types'

// export function useFlowSubscription2() {
//   const trpc = useTRPC()
//   const activeFlowId = useUnit($activeFlowId)
//
//
// }

export function useFlowSubscription() {
  const activeFlowId = useUnit($activeFlowId)
  const isFlowsLoading = useUnit($isFlowsLoading)
  const subscriptionState = useUnit($flowSubscriptionState)
  const nodes = useUnit($nodes)

  // Create event handlers map
  const eventHandlers: FlowEventHandlerMap = useMemo(() => ({
    [FlowEventType.FlowInitStart]: (data) => {
      // clean up existing flow data

      console.log(`[FlowInitStart] Flow init start for flow ${data.flowId}`)
      clearNodes()
      resetEdges()

      setFlowMetadata(data.metadata)
    },

    [FlowEventType.FlowInitEnd]: (data) => {
      setFlowLoaded(data.flowId)
      console.log(`[FlowInitEnd] Flow init end for flow ${data.flowId}`)
    },

    [FlowEventType.MetadataUpdated]: (data) => {
      setFlowMetadata(data.newMetadata)
    },

    [FlowEventType.NodesAdded]: (data) => {
      addNodes(data.nodes)
    },

    [FlowEventType.NodeAdded]: (data) => {
      // console.log('[NodeAdded] Received node:', data.node)
      addNode(data.node)
    },

    [FlowEventType.NodeUpdated]: (data) => {
      // console.log('[NodeUpdated] Received node:', data.node)
      const node = nodes[data.node.id]
      if (!node) {
        console.error(`[NodeUpdated] Node ${data.node.id} not found`)
        return
      }

      if (data.node.getVersion() && data.node.getVersion() < node.getVersion()) {
        console.warn(`[NodeUpdated] Received outdated node update event for node ${data.node.id}, local version: ${node.getVersion()}, event version: ${data.node.getVersion()}`)
        return
      }

      updateNode(data.node)
    },

    [FlowEventType.NodeRemoved]: (data) => {
      removeNode(data.nodeId)
    },

    [FlowEventType.PortUpdated]: (data) => {
      if (!data.port.getConfig().nodeId) {
        console.error(`Port ${data.port.id} has no node ID`)
        return
      }

      const node = nodes[data.port.getConfig().nodeId!]
      if (!node) {
        console.error(`Node ${data.port.getConfig().nodeId} not found`)
        return
      }

      if (data.nodeVersion && data.nodeVersion <= node.getVersion()) {
        console.warn(`[PortUpdated] Received outdated port update event for node ${data.port.getConfig().nodeId}, local version: ${node.metadata.version}, event version: ${data.nodeVersion}`)
        return
      }

      // log the current node version and from the event
      // console.log(`[PortUpdated] current node version: ${nodes[data.port.getConfig().nodeId!]?.getVersion()}, event version: ${data.nodeVersion}`)
      // console.log(`[PortUpdated] data:`, data)

      updatePort({
        id: data.port.id,
        data: {
          id: data.port.id,
          config: data.port.getConfig(),
          value: data.port.getValue(),
        },
        nodeVersion: data.nodeVersion ?? 1,
      })

      setNodeVersion({
        nodeId: data.port.getConfig().nodeId!,
        version: data.nodeVersion ?? 1,
      })
    },

    [FlowEventType.EdgeAdded]: (data) => {
      // Transform edge data to match our store format
      setEdge({
        flowId: activeFlowId!, // We know it exists because we're subscribed
        edgeId: data.edgeId,
        sourceNodeId: data.sourceNodeId,
        sourcePortId: data.sourcePortId,
        targetNodeId: data.targetNodeId,
        targetPortId: data.targetPortId,
        metadata: data.metadata,
      })
    },

    [FlowEventType.EdgesAdded]: (data) => {
      setEdges(data.edges.map((edge) => {
        return {
          flowId: activeFlowId!,
          edgeId: edge.edgeId,
          sourceNodeId: edge.sourceNodeId,
          sourcePortId: edge.sourcePortId,
          targetNodeId: edge.targetNodeId,
          targetPortId: edge.targetPortId,
          metadata: edge.metadata,
        }
      }))
    },

    [FlowEventType.EdgeRemoved]: (data) => {
      removeEdge({
        flowId: activeFlowId!, // We know it exists because we're subscribed
        edgeId: data.edgeId,
      })
    },

    [FlowEventType.NodeParentUpdated]: (data) => {
      const node = nodes[data.nodeId]
      if (!node)
        return

      const currentVersion = node.getVersion()
      const currentParent = node.metadata.parentNodeId ? nodes[node.metadata.parentNodeId] : undefined
      const newParent = data.newParentNodeId ? nodes[data.newParentNodeId] : undefined

      if ((!currentParent && !newParent) || (currentParent?.id === newParent?.id)) {
        return
      }

      let currentPosition = data.oldPosition || node.metadata.ui?.position || DefaultPosition
      const newPosition = data.newPosition || currentPosition

      if (currentParent && newParent === undefined) {
        currentPosition = getNodePositionInFlow(
          currentPosition,
          currentParent.metadata.ui!.position!,
        )
      }

      if (currentParent === undefined && newParent) {
        currentPosition = getNodePositionInsideParent(
          currentPosition,
          newParent.metadata.ui!.position!,
        )
      }

      // log old and new versions to
      if (data.version && data.version <= currentVersion) {
        // positionInterpolator.clearNodeState(data.nodeId)
        return
      }

      console.debug(`[NodeParentUpdated] currentParent: ${currentParent?.id}, newParent: ${newParent?.id}, currentPosition: ${JSON.stringify(currentPosition)}, newPosition: ${JSON.stringify(newPosition)} currentVersion: ${currentVersion}, data.version: ${data.version}`)

      node.setMetadata({
        ...node.metadata,
        parentNodeId: data.newParentNodeId,
      })

      setNodeVersion({
        nodeId: data.nodeId,
        version: data.version,
      })

      positionInterpolator.clearNodeState(data.nodeId)
      positionInterpolator.addState(data.nodeId, newPosition, currentPosition)
    },

    [FlowEventType.NodeUIPositionChanged]: (data) => {
      const currentNode = nodes[data.nodeId]
      if (!currentNode)
        return

      const currentVersion = currentNode.getVersion()

      // if event contains version + 1 then just update the version
      if (data.version && data.version <= currentVersion) {
        console.warn(`[SKIPPING] Received position change event for node ${data.nodeId}, local version: ${currentVersion}, event version: ${data.version}`)
        return
      }

      // console.debug(`[NOT SKIP] Received position change currentPosition: ${JSON.stringify(data.oldPosition)}, newPosition: ${JSON.stringify(data.newPosition)}, currentVersion: ${currentVersion}, data.version: ${data.version}`)
      setNodeVersion({
        nodeId: data.nodeId,
        version: data.version,
      })

      const currentPosition = currentNode.metadata.ui?.position || DefaultPosition
      positionInterpolator.addState(data.nodeId, data.newPosition, currentPosition)
    },

    [FlowEventType.NodeUIChanged]: (data) => {
      const currentNode = nodes[data.nodeId]
      if (!currentNode)
        return

      const currentVersion = currentNode.getVersion()

      // ignore outdated events
      if (data.version && data.version <= currentVersion) {
        console.debug(`Ignoring outdated UI change event for node ${data.nodeId}, local version: ${currentVersion}, event version: ${data.version}`)
        return
      }

      updateNodeUILocal({
        flowId: activeFlowId!,
        nodeId: data.nodeId,
        ui: data.ui,
        version: data.version,
      })

      setNodeVersion({
        nodeId: data.nodeId,
        version: data.version,
      })
    },

    [FlowEventType.NodeUIDimensionsChanged]: (data) => {
      const currentNode = nodes[data.nodeId]
      if (!currentNode)
        return

      const currentVersion = currentNode.getVersion()

      // if event contains version + 1 then just update the version
      if (data.version && data.version <= currentVersion) {
        return
      }

      if (!data.newDimensions || !data.newDimensions.width || !data.newDimensions.height) {
        return
      }

      // console.debug(`[NOT SKIP] Received dimensions change newDimensions: ${JSON.stringify(data.newDimensions)}, currentVersion: ${currentVersion}, data.version: ${data.version}`)

      setNodeVersion({
        nodeId: data.nodeId,
        version: data.version,
      })

      updateNodeUILocal({
        flowId: activeFlowId!,
        nodeId: data.nodeId,
        ui: {
          ...(currentNode.metadata.ui ?? {}),
          dimensions: data.newDimensions,
        },
        version: data.version,
      })
    },
    // Add other event handlers as needed
  }), [nodes, activeFlowId])

  // Create event handler with error handling
  const handleEvent = useMemo(() =>
    createEventHandler(
      eventHandlers,
      {
        onError: (error, event) => {
          console.error(`Error handling event ${event.type}:`, error)
          // Consider creating a separate error event/store for subscription errors
        },
      },
    ), [eventHandlers])

  const trpc = useTRPC()
  const opts = trpc.flow.subscribeToEvents.subscriptionOptions(
    activeFlowId
      ? {
          flowId: activeFlowId,
          lastEventId: null,
        }
      : skipToken,
    {
      onStarted: () => {
        console.debug(`[FLOW SUB] Subscription started for flow ${activeFlowId}`)

        clearNodes()
        resetEdges()

        setFlowSubscriptionStatus(FlowSubscriptionStatus.CONNECTING)
      },
      onConnectionStateChange: (state) => {
        console.debug(`[FLOW SUB] Connection state changed for flow ${activeFlowId}:`, state)
      },
      onData: async (trackedData) => {
        // Set status to SUBSCRIBED on the first data received
        if (!subscriptionState.isSubscribed) {
          setFlowSubscriptionStatus(FlowSubscriptionStatus.SUBSCRIBED)
        }

        // console.log('Received event:', trackedData.data)
        await handleEvent(trackedData.data)
      },
      onError: (error) => {
        console.error(`Error subscribing to flow events for flow ${activeFlowId}:`, error)
        setFlowSubscriptionStatus(FlowSubscriptionStatus.ERROR)
        setFlowSubscriptionError({
          message: error.message,
          code: error.data?.code,
          timestamp: new Date(),
        })
      },
    },
  )

  const subscription = useSubscription({
    ...opts,
    enabled: !!activeFlowId,
  })

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
    // FIXME
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
