/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type {
  FlowEventHandlerMap,
  INode,
} from '@badaitech/chaingraph-types'
import {
  getNodePositionInFlow,
  getNodePositionInsideParent,
} from '@/components/flow/utils/node-position'
import { nodeUpdated } from '@/store/updates'
import {
  createEventHandler,
  DefaultPosition,
  FlowEventType,
} from '@badaitech/chaingraph-types'
import { combine, createEffect, sample } from 'effector'
import {
  removeEdge,
  resetEdges,
  setEdge,
  setEdges,
} from '../edges/stores'
import {
  $activeFlowId,
  loadFlowsList,
  loadFlowsListFx,
} from '../flow/stores'
import {
  positionInterpolator,
} from '../nodes/position-interpolation-advanced'
import {
  $nodes,
  addNode,
  addNodes,
  clearNodes,
  removeNode,
  setNodeVersion,
  updateNode,
  updateNodeUILocal,
} from '../nodes/stores'
import {
  updatePort,
} from '../ports/stores'
import {
  clearActiveFlow,
  createFlow,
  createFlowFx,
  deleteFlow,
  deleteFlowFx,
  editFlowFx,
  forkFlow,
  forkFlowFx,
  setFlowLoaded,
  setFlowMetadata,
  setFlowsList,
  updateFlow,
} from './stores'
import { $activeSubscription, newFlowEvents, switchSubscriptionFx } from './subscription'

// SAMPLES

// Flow List operations
sample({
  clock: loadFlowsList,
  target: loadFlowsListFx,
})
sample({
  clock: loadFlowsListFx.doneData,
  target: setFlowsList,
})

// Flow Create operations
sample({
  clock: createFlow,
  target: createFlowFx,
})
sample({
  clock: createFlowFx.doneData,
  fn: response => response,
  target: setFlowMetadata,
})

// Flow Update operations
sample({
  clock: updateFlow,
  target: editFlowFx,
})
sample({
  clock: editFlowFx.doneData,
  fn: response => response.metadata,
  target: setFlowMetadata,
})

// Flow Delete operations
sample({
  clock: deleteFlow,
  target: [
    deleteFlowFx,
    // If we need to clear active flow after deletion
    sample({
      clock: deleteFlow,
      source: $activeFlowId,
      filter: (activeId, deletedId) => activeId === deletedId,
      target: clearActiveFlow,
    }),
  ],
})

// Flow Fork operations
sample({
  clock: forkFlow,
  target: forkFlowFx,
})
sample({
  clock: forkFlowFx.doneData,
  fn: response => response,
  target: setFlowMetadata,
})
// Reload flow list after fork to get updated canFork values
sample({
  clock: forkFlowFx.done,
  target: loadFlowsListFx,
})

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

      console.log(`[NodeUpdated] Updating node ${data.node.id} to version ${data.node.getVersion()}`)

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

      console.log(`[PortUpdated] Updating port ${data.port.id} on node ${data.port.getConfig().nodeId} to node version ${data.nodeVersion} with value:`, data.port.getValue())

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

sample({
  clock: newFlowEvents,
  source: combine({ nodes: $nodes, flowId: $activeFlowId }),
  fn: (
    { nodes, flowId },
    events,
  ) => ({ nodes, flowId: flowId!, events }),
  filter: ({ flowId }) => !!flowId,
  target: createEffect(async ({ nodes, flowId, events }) => {
    if (!flowId) {
      console.warn('No active flow ID, skipping event processing')
      return
    }

    const eventHandlers = createEventHandlers(flowId, nodes)
    const handleEvent = createEventHandler(eventHandlers, {
      onError: (error, event) => {
        console.error(`Error handling event ${event.type}:`, error)
      },
    })
    for (const event of events) {
      try {
        await handleEvent(event)
      } catch (error) {
        console.error(`Unhandled error processing event ${event.type}:`, error)
      }
    }
  }),
})

// Watch for activeFlowId changes and manage subscriptions
// Use source combine to prevent race conditions
sample({
  clock: $activeFlowId,
  source: combine({ currentSub: $activeSubscription, isEffectPending: switchSubscriptionFx.pending }),
  filter: ({ currentSub, isEffectPending }, newFlowId) => {
    // Prevent concurrent executions
    if (isEffectPending) {
      return false
    }
    // Only proceed if flowId is valid and different from current subscription
    const shouldSwitch = Boolean(newFlowId) && currentSub?.flowId !== newFlowId
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
