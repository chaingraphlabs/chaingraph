/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { TRPCClient } from '@badaitech/chaingraph-trpc/client'
import type { FlowEventHandlerMap, INode } from '@badaitech/chaingraph-types'
import { createEventHandler, DefaultPosition, FlowEventType } from '@badaitech/chaingraph-types'
import { attach, combine, createEffect, createStore, sample } from 'effector'
import {
  getNodePositionInFlow,
  getNodePositionInsideParent,
} from '../../components/flow/utils/node-position'
import { removeEdge, resetEdges, setEdge, setEdges } from '../edges'
import {
  $nodes,
  addNode,
  addNodes,
  clearNodes,
  removeNode,
  setNodeVersion,
  updateNode,
  updateNodeUILocal,
} from '../nodes'
import { positionInterpolator } from '../nodes/position-interpolation-advanced'
import { updatePort } from '../ports'
import { $trpcClient } from '../trpc/store'
import { nodeUpdated } from '../updates'
import {
  $activeFlowId,
  setFlowLoaded,
  setFlowMetadata,
  setFlowSubscriptionError,
  setFlowSubscriptionStatus,
} from './stores'
import { FlowSubscriptionStatus } from './types'

interface FlowSubscription {
  unsubscribe: () => void
  flowId: string
}

// Store for current active subscription
export const $activeSubscription = createStore<FlowSubscription | null>(null)

// Create event handlers map
function createEventHandlers(flowId: string, nodes: Record<string, INode>): FlowEventHandlerMap {
  return {
    [FlowEventType.FlowInitStart]: (data) => {
      clearNodes()
      resetEdges()
      setFlowMetadata(data.metadata)
    },

    [FlowEventType.FlowInitEnd]: (data) => {
      setFlowLoaded(data.flowId)
    },

    [FlowEventType.MetadataUpdated]: (data) => {
      setFlowMetadata(data.newMetadata)
    },

    [FlowEventType.NodesAdded]: (data) => {
      addNodes(data.nodes)
    },

    [FlowEventType.NodeAdded]: (data) => {
      addNode(data.node)
    },

    [FlowEventType.NodeUpdated]: (data) => {
      const node = nodes[data.node.id]
      if (!node) {
        console.error(`[NodeUpdated] Node ${data.node.id} not found`)
        return
      }

      if (data.node.getVersion() && data.node.getVersion() < node.getVersion()) {
        console.warn(`[NodeUpdated] Received outdated node update event for node ${data.node.id}`)
        return
      }

      updateNode(data.node)
      nodeUpdated(data.node.id)
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
        console.warn(`[PortUpdated] Received outdated port update event`)
        return
      }

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

      nodeUpdated(data.port.getConfig().nodeId!)
    },

    [FlowEventType.EdgeAdded]: (data) => {
      setEdge({
        flowId,
        edgeId: data.edgeId,
        sourceNodeId: data.sourceNodeId,
        sourcePortId: data.sourcePortId,
        targetNodeId: data.targetNodeId,
        targetPortId: data.targetPortId,
        metadata: data.metadata,
      })
    },

    [FlowEventType.EdgesAdded]: (data) => {
      setEdges(data.edges.map(edge => ({
        flowId,
        edgeId: edge.edgeId,
        sourceNodeId: edge.sourceNodeId,
        sourcePortId: edge.sourcePortId,
        targetNodeId: edge.targetNodeId,
        targetPortId: edge.targetPortId,
        metadata: edge.metadata,
      })))
    },

    [FlowEventType.EdgeRemoved]: (data) => {
      removeEdge({
        flowId,
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

      if (data.version && data.version <= currentVersion) {
        return
      }

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

      if (data.version && data.version <= currentVersion) {
        console.warn(`[SKIPPING] Received outdated position change event`)
        return
      }

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

      if (data.version && data.version <= currentVersion) {
        return
      }

      updateNodeUILocal({
        flowId,
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

      if (data.version && data.version <= currentVersion) {
        return
      }

      if (!data.newDimensions || !data.newDimensions.width || !data.newDimensions.height) {
        return
      }

      setNodeVersion({
        nodeId: data.nodeId,
        version: data.version,
      })

      updateNodeUILocal({
        flowId,
        nodeId: data.nodeId,
        ui: {
          ...(currentNode.metadata.ui ?? {}),
          dimensions: data.newDimensions,
        },
        version: data.version,
      })
    },
  }
}

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
              const currentNodes = $nodes.getState()
              const eventHandlers = createEventHandlers(flowId, currentNodes)
              const handleEvent = createEventHandler(eventHandlers, {
                onError: (error, event) => {
                  console.error(`Error handling event ${event.type}:`, error)
                },
              })

              handleEvent(data.data).catch((error) => {
                console.error(`[FLOW SUB] Error handling event:`, error)
              })
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
const switchSubscriptionFx = createEffect<{ oldSub: FlowSubscription | null, newFlowId: string }, FlowSubscription | null>(
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

// Watch for activeFlowId changes and manage subscriptions
// Use source combine to prevent race conditions
sample({
  clock: $activeFlowId,
  source: combine({ currentSub: $activeSubscription, isEffectPending: switchSubscriptionFx.pending }),
  filter: ({ currentSub, isEffectPending }, newFlowId) => {
    // Prevent concurrent executions
    if (isEffectPending) {
      console.debug(`[FLOW SUB] Skipping flow change to ${newFlowId} - effect already pending`)
      return false
    }
    // Only proceed if flowId is valid and different from current subscription
    const shouldSwitch = Boolean(newFlowId) && currentSub?.flowId !== newFlowId
    console.debug(`[FLOW SUB] Flow ID changed to ${newFlowId}, current sub: ${currentSub?.flowId || 'none'}, should switch: ${shouldSwitch}`)
    return shouldSwitch
  },
  fn: ({ currentSub }, newFlowId) => ({ oldSub: currentSub, newFlowId: newFlowId! }),
  target: switchSubscriptionFx,
})

// Handle flow deselection (when flowId becomes null)
sample({
  clock: $activeFlowId,
  source: combine({ currentSub: $activeSubscription, isEffectPending: switchSubscriptionFx.pending }),
  filter: ({ currentSub, isEffectPending }, flowId) => !flowId && currentSub !== null && !isEffectPending,
  fn: ({ currentSub }) => ({ oldSub: currentSub, newFlowId: '' }),
  target: switchSubscriptionFx,
})

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
